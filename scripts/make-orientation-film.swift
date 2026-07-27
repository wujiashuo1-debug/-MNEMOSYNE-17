import AppKit
import AVFoundation
import CoreVideo
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let publicDir = root.appendingPathComponent("public")
let silentURL = URL(fileURLWithPath: "/private/tmp/m17-orientation-silent.mp4")
let narrationURL = URL(fileURLWithPath: "/private/tmp/m17-orientation.aiff")
let narrationTextURL = root.appendingPathComponent("scripts/orientation-narration.txt")
let outputURL = publicDir.appendingPathComponent("orientation-film.mp4")

if !FileManager.default.fileExists(atPath: narrationURL.path) {
    let speech = Process()
    speech.executableURL = URL(fileURLWithPath: "/usr/bin/say")
    speech.arguments = ["-v", "Tingting", "-f", narrationTextURL.path, "-o", narrationURL.path, "--data-format=LEF32@22050"]
    try speech.run()
    speech.waitUntilExit()
    guard speech.terminationStatus == 0 else {
        fputs("Could not synthesize narration\n", stderr)
        exit(1)
    }
}

let imageNames = [
    "orientation-institute-1998.png",
    "orientation-lab-2001.png",
    "archive-b2.png",
    "corridor-day1.webp",
    "corridor-day7.webp",
    "evidence-table.webp",
]

let images: [CGImage] = imageNames.compactMap { name in
    let url = publicDir.appendingPathComponent(name)
    guard
        let image = NSImage(contentsOf: url),
        let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
    else {
        fputs("Could not load \(url.path)\n", stderr)
        return nil
    }
    return cgImage
}

guard images.count == imageNames.count else {
    exit(2)
}

try? FileManager.default.removeItem(at: silentURL)
try? FileManager.default.removeItem(at: outputURL)

let width = 960
let height = 720
let fps: Int32 = 12
let secondsPerImage = 11
let framesPerImage = Int(fps) * secondsPerImage
let totalFrames = framesPerImage * images.count

let writer = try AVAssetWriter(outputURL: silentURL, fileType: .mp4)
let input = AVAssetWriterInput(
    mediaType: .video,
    outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 1_650_000,
            AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        ],
    ]
)
input.expectsMediaDataInRealTime = false

let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
    ]
)

guard writer.canAdd(input) else {
    fputs("Cannot add video input\n", stderr)
    exit(3)
}
writer.add(input)
guard writer.startWriting() else {
    fputs("Writer failed to start: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(4)
}
writer.startSession(atSourceTime: .zero)

func drawFrame(_ image: CGImage, progress: Double, into pixelBuffer: CVPixelBuffer) {
    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

    guard
        let base = CVPixelBufferGetBaseAddress(pixelBuffer),
        let context = CGContext(
            data: base,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        )
    else { return }

    context.setFillColor(NSColor.black.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))

    let imageAspect = CGFloat(image.width) / CGFloat(image.height)
    let frameAspect = CGFloat(width) / CGFloat(height)
    var drawWidth: CGFloat
    var drawHeight: CGFloat
    if imageAspect > frameAspect {
        drawWidth = CGFloat(width)
        drawHeight = drawWidth / imageAspect
    } else {
        drawHeight = CGFloat(height)
        drawWidth = drawHeight * imageAspect
    }

    let scale = 1.0 + CGFloat(progress) * 0.042
    drawWidth *= scale
    drawHeight *= scale
    let drift = CGFloat(progress - 0.5) * 10
    let rect = CGRect(
        x: (CGFloat(width) - drawWidth) / 2 + drift,
        y: (CGFloat(height) - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight
    )
    context.interpolationQuality = .high
    context.draw(image, in: rect)

    context.setFillColor(NSColor(calibratedWhite: 0, alpha: 0.13).cgColor)
    for y in stride(from: 0, to: height, by: 4) {
        context.fill(CGRect(x: 0, y: y, width: width, height: 1))
    }
    context.setStrokeColor(NSColor(calibratedWhite: 1, alpha: 0.055).cgColor)
    context.setLineWidth(1)
    let scratchY = Int(progress * 997).quotientAndRemainder(dividingBy: height).remainder
    context.move(to: CGPoint(x: 0, y: scratchY))
    context.addLine(to: CGPoint(x: width, y: scratchY))
    context.strokePath()

    let fadeLength = 0.075
    let alpha: CGFloat
    if progress < fadeLength {
        alpha = CGFloat(1 - progress / fadeLength)
    } else if progress > 1 - fadeLength {
        alpha = CGFloat((progress - (1 - fadeLength)) / fadeLength)
    } else {
        alpha = 0
    }
    if alpha > 0 {
        context.setFillColor(NSColor(calibratedWhite: 0, alpha: alpha).cgColor)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    }
}

for frame in 0..<totalFrames {
    while !input.isReadyForMoreMediaData {
        Thread.sleep(forTimeInterval: 0.002)
    }
    autoreleasepool {
        var buffer: CVPixelBuffer?
        let status = CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
        guard status == kCVReturnSuccess, let pixelBuffer = buffer else { return }
        let imageIndex = frame / framesPerImage
        let localFrame = frame % framesPerImage
        let progress = Double(localFrame) / Double(max(framesPerImage - 1, 1))
        drawFrame(images[imageIndex], progress: progress, into: pixelBuffer)
        let presentationTime = CMTime(value: CMTimeValue(frame), timescale: fps)
        if !adaptor.append(pixelBuffer, withPresentationTime: presentationTime) {
            fputs("Frame \(frame) failed: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
        }
    }
}

input.markAsFinished()
let writeGroup = DispatchGroup()
writeGroup.enter()
writer.finishWriting { writeGroup.leave() }
writeGroup.wait()

guard writer.status == .completed else {
    fputs("Video render failed: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(5)
}

let videoAsset = AVURLAsset(url: silentURL)
let audioAsset = AVURLAsset(url: narrationURL)
let composition = AVMutableComposition()
guard
    let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
    let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
else {
    fputs("Rendered video could not be reopened\n", stderr)
    exit(6)
}

let duration = CMTime(seconds: Double(totalFrames) / Double(fps), preferredTimescale: 600)
try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: sourceVideo, at: .zero)
videoTrack.preferredTransform = sourceVideo.preferredTransform

if let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
   let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
    let audioDuration = CMTimeMinimum(audioAsset.duration, duration)
    try audioTrack.insertTimeRange(CMTimeRange(start: .zero, duration: audioDuration), of: sourceAudio, at: .zero)
}

guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
    fputs("Could not create exporter\n", stderr)
    exit(7)
}
exporter.outputURL = outputURL
exporter.outputFileType = .mp4
exporter.shouldOptimizeForNetworkUse = true

let exportGroup = DispatchGroup()
exportGroup.enter()
exporter.exportAsynchronously { exportGroup.leave() }
exportGroup.wait()

guard exporter.status == .completed else {
    fputs("Export failed: \(exporter.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(8)
}

print(outputURL.path)
