"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Phase = "title" | "walk" | "interlude" | "complete";
type EventEffect =
  | "still"
  | "clock"
  | "mirror"
  | "phone"
  | "memory"
  | "door"
  | "echo"
  | "cctv"
  | "walls"
  | "visitor";

type RouteEvent = {
  at: number;
  effect: EventEffect;
  text: string;
};

type DayStory = {
  label: string;
  date: string;
  opening: string;
  thought: string;
  closing: string;
  events: RouteEvent[];
};

const days: DayStory[] = [
  {
    label: "第一夜",
    date: "2026年7月21日　23:47",
    opening: "临海市卫生档案馆，地下二层。临时档案员许澄要把最后一箱旧磁带送到左侧销毁室。",
    thought: "路线很短。经过电梯、电话、蓝门，再从尽头的安全门出去。",
    closing: "回家后，许澄在档案箱夹层里找到一张二十五年前的值班照。照片里的女人和她长着同一张脸。",
    events: [
      { at: 12, effect: "still", text: "电梯门在身后合上。楼层灯没有熄灭。" },
      { at: 38, effect: "clock", text: "墙钟慢了六分钟。值班表上的时间却已经盖好：04:17。" },
      { at: 64, effect: "still", text: "蓝门里传来磁带倒转的声音。门牌写着：共同证词室。" },
      { at: 86, effect: "phone", text: "电话没有响。听筒却像刚被人握过一样温热。" },
    ],
  },
  {
    label: "第二夜",
    date: "2026年7月22日　23:47",
    opening: "馆长说地下二层没有蓝门，也从未安装过墙上电话。他让许澄照常完成夜间交接。",
    thought: "同一条路。只是今晚不要看凸面镜。",
    closing: "安全门外不是楼梯，而是一张正在打印的走廊平面图。图上的黑点比许澄早一步到家。",
    events: [
      { at: 16, effect: "clock", text: "墙钟仍是 04:17。秒针每走七格，便退回一格。" },
      { at: 41, effect: "memory", text: "公告栏多了一张签收单。签名是许澄，日期是 2001 年。" },
      { at: 67, effect: "mirror", text: "镜里的许澄没有提档案箱。她正用空着的手指向蓝门。" },
      { at: 89, effect: "still", text: "左侧安全门后，有人用许澄的脚步声继续向左走。" },
    ],
  },
  {
    label: "第三夜",
    date: "2026年7月23日　23:47",
    opening: "许澄查到 2001 年的最后一名访客也叫许澄。证件号码、指纹编号、紧急联系人都与她完全相同。",
    thought: "值班不能中断。继续向左。不要停在镜子前。",
    closing: "睡着前，许澄想起母亲曾牵她走过这条走廊。可 2001 年，母亲只有八岁。",
    events: [
      { at: 18, effect: "mirror", text: "镜里的动作慢了半步。许澄停下时，她又独自走了一步。" },
      { at: 43, effect: "phone", text: "听筒里只有呼吸。每一次呼气，都与许澄的脚步同时落下。" },
      { at: 69, effect: "door", text: "蓝门开了一条缝。门后还是这条走廊，只是许澄已经走到了前面。" },
      { at: 90, effect: "memory", text: "她突然记起自己的童年名叫方宁。下一秒，她又记起世上从没有这个人。" },
    ],
  },
  {
    label: "第四夜",
    date: "2026年7月24日　23:47",
    opening: "今晚电梯里已经有人按过 B2。电话从门打开前就开始响，来电线路标记为：2001 / 观察室。",
    thought: "不接电话。只要走出安全门，铃声就会停止。",
    closing: "电话没有停止。凌晨四点十七分，铃声从许澄卧室的墙里响起。母亲的声音问她：今天你替谁回来了？",
    events: [
      { at: 14, effect: "phone", text: "第一次铃声。女人念出许澄已经注销的出生证明号码。" },
      { at: 39, effect: "mirror", text: "镜中站着十七个人。走廊里只有许澄的脚步声。" },
      { at: 63, effect: "phone", text: "第二次铃声。女人说：小澄，你小时候不叫这个名字。" },
      { at: 87, effect: "echo", text: "第三次铃声没有结束。前方的自己替她拿起了听筒。" },
    ],
  },
  {
    label: "第五夜",
    date: "2026年7月25日　23:47",
    opening: "蓝门完全敞开。门后是另一条相同的 B2。另一条走廊里，也有一个许澄正在完成第五次夜间交接。",
    thought: "系统提示：证词校准 5 / 7。出口依然在左侧。",
    closing: "安全门旁多出一只档案箱。标签上写着：许澄，形成于 2001 年 7 月 17 日，明日启封。",
    events: [
      { at: 13, effect: "door", text: "另一条走廊里的许澄比她快。她已经经过了尚未响起的电话。" },
      { at: 37, effect: "echo", text: "公告栏上的十六张证件照都变成许澄。每一张年龄不同。" },
      { at: 62, effect: "walls", text: "墙里的人随着她一起走。只有在许澄停下时，他们才会继续。" },
      { at: 87, effect: "echo", text: "前面的脚步停了。身后的脚步仍在靠近。" },
    ],
  },
  {
    label: "第六夜",
    date: "2026年7月26日　23:47",
    opening: "许澄没有去上班。23:47，她在自己的客厅睁开眼，电梯门正在面前打开。门外仍是 B2。",
    thought: "不要看镜子。不要接电话。不要让走在前面的许澄回头。",
    closing: "出口没有打开。门上贴着今晚的监控截图：一个许澄站在走廊尽头，另一个许澄正贴着摄像机看她。",
    events: [
      { at: 15, effect: "memory", text: "她记起母亲在这里工作。档案显示，那段记忆属于十七个不同的人。" },
      { at: 40, effect: "walls", text: "墙面在呼吸。每次起伏，里面都会少一个人的轮廓。" },
      { at: 66, effect: "echo", text: "镜中的工作证不是许澄。上面只写着：第七夜。" },
      { at: 86, effect: "cctv", text: "监控画面亮了一秒。贴近摄像机的那个人正在看屏幕外的你。" },
    ],
  },
  {
    label: "第七夜",
    date: "2001年7月17日　04:17",
    opening: "第七夜没有夜班。许澄站在尚未关闭的临海认知续存研究所，手里拿着一份空白的第十七号证词。",
    thought: "只向左走。每一步都会把一次犹豫写进过去。",
    closing: "七夜不是七天，而是同一段记忆被校准了七遍。研究所从未上传意识，它只让后来的人确信自己曾经回过家。",
    events: [
      { at: 12, effect: "walls", text: "第一夜的电梯、第二夜的签名、第三夜的脚步，原来都发生在这一秒。" },
      { at: 36, effect: "phone", text: "电话里的女人不是母亲。那是上一次走到这里的许澄。" },
      { at: 61, effect: "visitor", text: "前六夜不是系统记录。它们是你刚刚替许澄补写的记忆。" },
      { at: 82, effect: "echo", text: "别再向左。安全门后，是下一位访问者的第一夜。" },
      { at: 95, effect: "visitor", text: "她没有在逃离 B2。她一直在练习如何成为你的过去。" },
    ],
  },
];

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (path: string) => `${basePath}${path}`;

export default function SevenDaysPage() {
  const [day, setDay] = useState(0);
  const [phase, setPhase] = useState<Phase>("title");
  const [progress, setProgress] = useState(0);
  const [moving, setMoving] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);
  const [effect, setEffect] = useState<EventEffect>("still");
  const [caption, setCaption] = useState(days[0].thought);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [impact, setImpact] = useState(false);
  const [sound, setSound] = useState(true);
  const [finishedAt, setFinishedAt] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const ambienceRef = useRef<{ oscillator: OscillatorNode; gain: GainNode; lfo: OscillatorNode } | null>(null);
  const stepRef = useRef(-1);
  const captionTimerRef = useRef<number | null>(null);

  const audioContext = useCallback(() => {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    const context = audioRef.current || new AudioCtor();
    audioRef.current = context;
    if (context.state === "suspended") void context.resume();
    return context;
  }, []);

  const beginAmbience = useCallback(() => {
    if (!sound || ambienceRef.current) return;
    const context = audioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 43 + day * 1.7;
    lfo.frequency.value = 0.17;
    lfoGain.gain.value = 2.4 + day * 0.35;
    gain.gain.value = 0.0001;
    lfo.connect(lfoGain).connect(oscillator.frequency);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    lfo.start();
    gain.gain.exponentialRampToValueAtTime(0.028 + day * 0.002, context.currentTime + 2.2);
    ambienceRef.current = { oscillator, gain, lfo };
  }, [audioContext, day, sound]);

  const stopAmbience = useCallback(() => {
    const ambience = ambienceRef.current;
    const context = audioRef.current;
    if (!ambience || !context) return;
    ambience.gain.gain.cancelScheduledValues(context.currentTime);
    ambience.gain.gain.setValueAtTime(Math.max(ambience.gain.gain.value, 0.0001), context.currentTime);
    ambience.gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
    ambience.oscillator.stop(context.currentTime + 0.75);
    ambience.lfo.stop(context.currentTime + 0.75);
    ambienceRef.current = null;
  }, []);

  const playFootstep = useCallback(() => {
    if (!sound) return;
    const context = audioContext();
    if (!context) return;
    const duration = 0.085;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const envelope = Math.pow(1 - index / data.length, 4);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 135 + Math.random() * 45;
    gain.gain.value = 0.12;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }, [audioContext, sound]);

  const playCue = useCallback((cue: EventEffect) => {
    if (!sound) return;
    const context = audioContext();
    if (!context) return;

    if (cue === "phone") {
      [0, 0.18, 0.76, 0.94].forEach((delay) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(690, context.currentTime + delay);
        oscillator.frequency.exponentialRampToValueAtTime(540, context.currentTime + delay + 0.13);
        gain.gain.setValueAtTime(0.055, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.15);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.16);
      });
      return;
    }

    const duration = cue === "cctv" ? 0.7 : 0.34;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / data.length, cue === "cctv" ? 1.4 : 3.5);
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = cue === "cctv" ? "bandpass" : "lowpass";
    filter.frequency.value = cue === "cctv" ? 1260 : 310;
    gain.gain.value = cue === "cctv" ? 0.23 : 0.045;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }, [audioContext, sound]);

  const showCaption = useCallback((text: string, hold = 4200) => {
    if (captionTimerRef.current) window.clearTimeout(captionTimerRef.current);
    setCaption(text);
    setCaptionVisible(true);
    captionTimerRef.current = window.setTimeout(() => setCaptionVisible(false), hold);
  }, []);

  const startNight = () => {
    setPhase("walk");
    setProgress(0);
    setEventIndex(0);
    setEffect("still");
    setImpact(false);
    stepRef.current = -1;
    beginAmbience();
    showCaption(days[day].thought, 5200);
  };

  const nextNight = () => {
    if (day === days.length - 1) {
      const now = new Date();
      const stamp = new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      localStorage.setItem("mnemosyne-seven-days", stamp);
      setFinishedAt(stamp);
      setPhase("complete");
      return;
    }
    setDay((value) => value + 1);
    setPhase("title");
    setProgress(0);
    setEventIndex(0);
    setEffect("still");
  };

  useEffect(() => {
    if (phase !== "walk" || !moving || impact) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const speed = day >= 5 ? 0.072 : 0.084;
        const next = Math.min(100, value + speed);
        const step = Math.floor(next / 2.1);
        if (step !== stepRef.current) {
          stepRef.current = step;
          playFootstep();
        }
        return next;
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [day, impact, moving, phase, playFootstep]);

  useEffect(() => {
    if (phase !== "walk") return;
    const routeEvent = days[day].events[eventIndex];
    if (!routeEvent || progress < routeEvent.at) return;
    setEventIndex((value) => value + 1);
    setEffect(routeEvent.effect);
    showCaption(routeEvent.text, routeEvent.effect === "cctv" ? 5000 : 4300);
    playCue(routeEvent.effect);

    if (routeEvent.effect === "cctv") {
      setImpact(true);
      setMoving(false);
      const timer = window.setTimeout(() => setImpact(false), 920);
      return () => window.clearTimeout(timer);
    }
  }, [day, eventIndex, phase, playCue, progress, showCaption]);

  useEffect(() => {
    if (phase !== "walk" || progress < 100) return;
    setMoving(false);
    stopAmbience();
    setCaptionVisible(false);
    const timer = window.setTimeout(() => setPhase("interlude"), 900);
    return () => window.clearTimeout(timer);
  }, [phase, progress, stopAmbience]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if ((event.key === "ArrowLeft" || event.key.toLowerCase() === "a") && phase === "walk" && !impact) {
        event.preventDefault();
        setMoving(true);
        beginAmbience();
      }
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") setMoving(false);
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [beginAmbience, impact, phase]);

  useEffect(() => () => {
    if (captionTimerRef.current) window.clearTimeout(captionTimerRef.current);
    stopAmbience();
    void audioRef.current?.close();
  }, [stopAmbience]);

  useEffect(() => {
    if (!sound) stopAmbience();
    else if (phase === "walk") beginAmbience();
  }, [beginAmbience, phase, sound, stopAmbience]);

  const replay = () => {
    setDay(0);
    setPhase("title");
    setProgress(0);
    setEventIndex(0);
    setEffect("still");
    setCaption(days[0].thought);
    setCaptionVisible(false);
    setImpact(false);
    setFinishedAt("");
  };

  const backgroundPosition = `${100 - progress}% center`;
  const midOpacity = day <= 1 ? 0 : day === 2 ? 0.18 : day === 3 ? 1 : day === 4 ? 0.82 : day === 5 ? 0.4 : 0;
  const finalOpacity = day <= 3 ? 0 : day === 4 ? 0.18 : day === 5 ? 0.62 : 1;
  const sceneStyle = {
    "--route-position": backgroundPosition,
    "--mid-opacity": midOpacity,
    "--final-opacity": finalOpacity,
    "--route-progress": progress,
    "--route-normal": `url("${asset("/seven-days-route.png")}")`,
    "--route-mid": `url("${asset("/seven-days-route-mid-v2.png")}")`,
    "--route-final": `url("${asset("/seven-days-route-final-v2.png")}")`,
  } as CSSProperties;

  const eventFlags = useMemo(() => ({
    mirror: day >= 1 && progress > 52,
    phone: (day >= 2 && progress > 28) || effect === "phone",
    echo: day >= 3 && progress > 56 && progress < 94,
    wall: day >= 4 && progress > 30,
    foreground: day === 6 && progress > 72 && progress < 79,
    cctv: impact && day === 5,
  }), [day, effect, impact, progress]);

  return (
    <main className={`return-game return-day-${day + 1} return-${phase} effect-${effect} ${moving ? "is-walking" : ""} ${impact ? "has-impact" : ""}`}>
      <div className="return-grain" aria-hidden="true" />

      <nav className="return-minimal-nav" aria-label="页面操作">
        <a href={`${basePath}/`}>退出记录</a>
        <button onClick={() => setSound((value) => !value)} aria-pressed={sound}>{sound ? "声音：开" : "声音：关"}</button>
      </nav>

      <section className="return-stage" style={sceneStyle}>
        <div className="return-scene-layer scene-normal" aria-hidden="true" />
        <div className="return-scene-layer scene-mid" aria-hidden="true" />
        <div className="return-scene-layer scene-final" aria-hidden="true" />
        <div className="return-light-flicker" aria-hidden="true" />
        <div className="return-vignette" aria-hidden="true" />

        {eventFlags.mirror && <div className="return-mirror-presence" aria-hidden="true" />}
        {eventFlags.phone && <div className="return-phone-pulse" aria-hidden="true" />}

        {eventFlags.echo && (
          <div className="return-echo" aria-hidden="true">
            <div><img src={asset("/xu-cheng-walk-v2.png")} alt="" draggable={false} /></div>
          </div>
        )}

        {eventFlags.wall && (
          <div className="return-wall-whisper" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
        )}

        <div className="return-player" aria-label="许澄">
          <div className="return-player-sprite">
            <img src={asset("/xu-cheng-walk-v2.png")} alt="许澄提着档案箱向左行走" draggable={false} />
          </div>
          <div className="return-player-shadow" aria-hidden="true" />
        </div>

        {eventFlags.foreground && (
          <div className="return-foreground-pass" aria-hidden="true">
            <div><img src={asset("/xu-cheng-walk-v2.png")} alt="" draggable={false} /></div>
          </div>
        )}

        <header className="return-night-mark">
          <span>{days[day].label}</span>
          <time>{days[day].date}</time>
        </header>

        <div className={`return-caption ${captionVisible ? "is-visible" : ""}`}>
          <p>{caption}</p>
        </div>

        {phase === "title" && (
          <section className="return-story-card">
            <span>{days[day].label}</span>
            <time>{days[day].date}</time>
            <p>{days[day].opening}</p>
            <button onClick={startNight}>{day === 0 ? "开始夜间交接" : "再次向左走"}</button>
          </section>
        )}

        {phase === "interlude" && (
          <section className="return-interlude">
            <span>{days[day].label}　结束</span>
            <p>{days[day].closing}</p>
            <button onClick={nextNight}>{day === days.length - 1 ? "查看第十七号证词" : "翌夜"}</button>
          </section>
        )}

        {phase === "complete" && (
          <section className="return-ending">
            <span>TRANSFER COMPLETE / WITNESS 017</span>
            <h1>第八夜<br />没有许澄</h1>
            <p>你刚才以为自己在操纵许澄走回家。</p>
            <p>但每一次按住向左键，系统记录的操作者都不是她。</p>
            <dl>
              <div><dt>第十七号证词</dt><dd>已形成</dd></div>
              <div><dt>本次签收人</dt><dd>REMOTE VISITOR</dd></div>
              <div><dt>签收时间</dt><dd>{finishedAt}</dd></div>
            </dl>
            <blockquote>明晚打开页面时，许澄会忘记你。<br />你不会忘记她。</blockquote>
            <div>
              <a href={`${basePath}/`}>返回档案终端</a>
              <button onClick={replay}>重新校准</button>
            </div>
          </section>
        )}

        {eventFlags.cctv && (
          <div className="return-cctv-cut" aria-hidden="true">
            <img src={asset("/cctv-duplicate-witness.png")} alt="" />
          </div>
        )}

        <div className="return-fade" aria-hidden="true" />
      </section>

      <footer className="return-control">
        <p><span>唯一操作</span>　按住向左键或 A，让许澄继续走。</p>
        <div className="return-route-progress" aria-label={`当前路线 ${Math.round(progress)}%`}><i style={{ width: `${progress}%` }} /></div>
        <button
          disabled={phase !== "walk" || impact}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setMoving(true);
            beginAmbience();
          }}
          onPointerUp={() => setMoving(false)}
          onPointerCancel={() => setMoving(false)}
          onPointerLeave={() => setMoving(false)}
          aria-label="按住向左行走"
        >
          <b>←</b><span>按住行走</span>
        </button>
      </footer>
    </main>
  );
}
