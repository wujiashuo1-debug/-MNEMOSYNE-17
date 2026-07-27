"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type Phase = "intro" | "walk" | "end" | "complete";
type EventKind = "notice" | "ring" | "figure" | "memory" | "shock";

type DayStory = {
  label: string;
  date: string;
  intro: string;
  instruction: string;
  end: string;
  events: { at: number; kind: EventKind; text: string }[];
};

const days: DayStory[] = [
  {
    label: "第一日",
    date: "2026.07.21 / 23:47",
    intro: "许澄在市卫生档案馆完成第一晚数字化工作。最后一箱资料来自二十五年前关闭的临海认知续存研究所。",
    instruction: "电梯停在 B2。沿走廊向左，经过蓝门和旧电话，从安全出口离开。",
    end: "回家后，许澄发现工作证背面多了一行铅笔字：不要替第十七个人签收。",
    events: [
      { at: 15, kind: "notice", text: "身后的电梯没有上行。楼层指示仍停在 B2。" },
      { at: 44, kind: "notice", text: "转院复核通知写着“共十七人”。附件名单只有十六行。" },
      { at: 72, kind: "ring", text: "墙上的电话没有响。听筒却是温的。" },
    ],
  },
  {
    label: "第二日",
    date: "2026.07.22 / 23:47",
    intro: "第二晚，馆长说 B2 从未安装电话。许澄没有提起听筒，也没有提起工作证背面的字。",
    instruction: "还是同一条路线。墙钟比昨晚慢了三分钟，终端时间却没有变化。",
    end: "安全出口外不是街道。门外是一张打印中的纸，上面是许澄刚才走过走廊的俯视图。",
    events: [
      { at: 18, kind: "notice", text: "墙钟显示 04:17。秒针每走七格，就退回一格。" },
      { at: 48, kind: "memory", text: "蓝门旁的签收栏出现了你的签名。日期：2001.07.17。" },
      { at: 76, kind: "figure", text: "安全镜里有一个人停在电话旁。你回头时，那里只有听筒。" },
    ],
  },
  {
    label: "第三日",
    date: "2026.07.23 / 23:47",
    intro: "第三晚，许澄调出 2001 年访客簿。凌晨 03:42 的最后一名访客也叫许澄，证件号码与今天相同。",
    instruction: "馆长要求继续工作：旧记录出现同名人员很常见。走完路线，别碰电话。",
    end: "门外传来自己的脚步声。不是跟在后面，而是已经走到了明天。",
    events: [
      { at: 21, kind: "figure", text: "镜中的你晚了半步。你停下以后，她又走了一步。" },
      { at: 53, kind: "notice", text: "蓝门门牌从“设备间”变成“共同证词室”。油漆仍然是湿的。" },
      { at: 79, kind: "memory", text: "你想起小时候来过这里。下一秒，你又想起自己从未住在临海。" },
    ],
  },
  {
    label: "第四日",
    date: "2026.07.24 / 23:47",
    intro: "第四晚，电话从电梯门打开时就一直响。值班台的线路图显示：来电来自 2001 年的观察室。",
    instruction: "不需要接听。向左走。只要离开 B2，电话就会停止。",
    end: "电话没有停止。回到家后，它从许澄厨房的墙里继续响了四次。",
    events: [
      { at: 17, kind: "ring", text: "第一次铃声。一个女人在振铃间隙里念你的身份证号码。" },
      { at: 46, kind: "ring", text: "第二次铃声。她说：小澄，你小时候不叫这个名字。" },
      { at: 73, kind: "ring", text: "第三次铃声。听筒自己落下：别走完第七次。" },
    ],
  },
  {
    label: "第五日",
    date: "2026.07.25 / 23:47",
    intro: "第五晚，蓝门敞开。门后没有房间，只有另一条完全相同的 B2 走廊。另一条走廊里，也有一个许澄正在向左走。",
    instruction: "系统把路线标记为“证词校准 5/7”。安全出口仍在左侧。",
    end: "出口处新增一只档案箱。标签写着：许澄，形成日期 2001.07.17，开放日期明日。",
    events: [
      { at: 14, kind: "figure", text: "另一条走廊里的你比你快。她已经经过了还没到达的电话。" },
      { at: 51, kind: "memory", text: "公告栏上的十六张证件照都变成了你，但每一张年龄不同。" },
      { at: 82, kind: "figure", text: "前面的脚步停了。后面的脚步还在接近。" },
    ],
  },
  {
    label: "第六日",
    date: "2026.07.26 / 23:47",
    intro: "第六晚，许澄没有打卡。电梯仍然把她送到 B2。电脑自动建立了第十七行转院记录，只缺签收人的姓名。",
    instruction: "不要看安全镜。不要接电话。不要在蓝门前停下。走到出口。",
    end: "出口没有打开。门上贴着一张今天的监控截图：一个许澄站在走廊尽头，另一个许澄贴着摄像机。",
    events: [
      { at: 19, kind: "memory", text: "你记起母亲曾在这里工作。档案却显示她当时只有八岁。" },
      { at: 57, kind: "figure", text: "镜子里的人没有脸。她胸前的工作证写着：第七日。" },
      { at: 84, kind: "shock", text: "摄像机里的人抬头了。她不是在看镜头。她在看屏幕外的你。" },
    ],
  },
  {
    label: "第七日",
    date: "2001.07.17 / 04:17",
    intro: "第七日没有夜班。系统时间回到 2001 年。许澄站在尚未关闭的研究所 B2，手里拿着一份空白证词。",
    instruction: "只向左走。每走一步，系统都会把一次犹豫写进过去。",
    end: "许澄终于明白：七日不是七个晚上，而是同一次记忆被重复校准了七遍。第十七个人没有姓名，因为每一位完成路线的人都会替她签一次。现在，2001 年的转院名单有了第十七行：许澄。签收日期是今天。",
    events: [
      { at: 13, kind: "memory", text: "第一日的电梯、第二日的签名、第三日的脚步都同时发生在这一秒。" },
      { at: 43, kind: "figure", text: "电话里的女人不是母亲。那是上一次走到这里的你。" },
      { at: 70, kind: "shock", text: "别再向左。出口后面是下一位访问者的第一日。" },
      { at: 91, kind: "memory", text: "你没有在逃离 B2。你一直在替一份不存在的证词练习回家。" },
    ],
  },
];

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (path: string) => `${basePath}${path}`;

export default function SevenDaysPage() {
  const [day, setDay] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState(0);
  const [moving, setMoving] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);
  const [narration, setNarration] = useState(days[0].instruction);
  const [eventKind, setEventKind] = useState<EventKind>("notice");
  const [shock, setShock] = useState(false);
  const [sound, setSound] = useState(true);
  const [completed, setCompleted] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const stepRef = useRef(-1);

  const audioContext = useCallback(() => {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    const context = audioRef.current || new AudioCtor();
    audioRef.current = context;
    if (context.state === "suspended") void context.resume();
    return context;
  }, []);

  const playFootstep = useCallback(() => {
    if (!sound) return;
    const context = audioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(78, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(42, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.11);
  }, [audioContext, sound]);

  const playEvent = useCallback((kind: EventKind) => {
    if (!sound) return;
    const context = audioContext();
    if (!context) return;
    if (kind === "ring") {
      [0, 0.22].forEach((delay) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = 620;
        gain.gain.setValueAtTime(0.045, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + 0.15);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.16);
      });
      return;
    }
    const duration = kind === "shock" ? 1.05 : 0.45;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / data.length, kind === "shock" ? 1.8 : 3.2);
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = kind === "shock" ? 1600 : 380;
    gain.gain.value = kind === "shock" ? 0.32 : 0.055;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }, [audioContext, sound]);

  const startDay = () => {
    setPhase("walk");
    setProgress(0);
    setEventIndex(0);
    setEventKind("notice");
    setNarration(days[day].instruction);
    stepRef.current = -1;
    const context = audioContext();
    if (sound && context) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 48 + day * 2;
      gain.gain.setValueAtTime(0.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 3.5);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 3.6);
    }
  };

  const nextDay = () => {
    if (day >= days.length - 1) {
      setCompleted(true);
      setPhase("complete");
      localStorage.setItem("mnemosyne-seven-days", "complete");
      return;
    }
    setDay((value) => value + 1);
    setPhase("intro");
    setProgress(0);
    setEventIndex(0);
    setEventKind("notice");
    setNarration(days[day + 1].instruction);
  };

  useEffect(() => {
    if (phase !== "walk" || !moving || shock) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const speed = day >= 6 ? 0.24 : day >= 4 ? 0.3 : 0.36;
        const next = Math.min(100, value + speed);
        const step = Math.floor(next / 3.4);
        if (step !== stepRef.current) {
          stepRef.current = step;
          playFootstep();
        }
        return next;
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [day, moving, phase, playFootstep, shock]);

  useEffect(() => {
    if (phase !== "walk") return;
    const event = days[day].events[eventIndex];
    if (!event || progress < event.at) return;
    setEventIndex((value) => value + 1);
    setEventKind(event.kind);
    setNarration(event.text);
    setMoving(false);
    playEvent(event.kind);
    if (event.kind === "shock") {
      setShock(true);
      const timer = window.setTimeout(() => setShock(false), day >= 6 ? 980 : 620);
      return () => window.clearTimeout(timer);
    }
  }, [day, eventIndex, phase, playEvent, progress]);

  useEffect(() => {
    if (phase === "walk" && progress >= 100) {
      setMoving(false);
      setPhase("end");
      setNarration(days[day].end);
    }
  }, [day, phase, progress]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if ((event.key === "ArrowLeft" || event.key.toLowerCase() === "a") && !event.repeat && phase === "walk" && !shock) {
        event.preventDefault();
        setMoving(true);
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
  }, [phase, shock]);

  const replay = () => {
    setDay(0);
    setPhase("intro");
    setProgress(0);
    setEventIndex(0);
    setNarration(days[0].instruction);
    setCompleted(false);
    setShock(false);
  };

  const witnessVisible = day >= 2 && progress > 16 && progress < 88;
  const reverseVisible = day >= 4 && progress > 33 && progress < 86;
  const phoneRinging = eventKind === "ring" && phase === "walk";
  const sceneStyle = {
    "--walk-progress": progress,
    "--scene-image": `url("${asset("/seven-days-route.png")}")`,
    backgroundPosition: `${100 - progress}% center`,
  } as CSSProperties;

  return (
    <main className={`seven-days-shell day-${day + 1} phase-${phase} event-${eventKind} ${moving ? "is-walking" : ""}`}>
      <div className="seven-scanlines" aria-hidden="true" />
      <header className="seven-topbar">
        <a href={`${basePath}/`}>← 返回档案终端</a>
        <span>B2 夜间通行记录 / PERSONNEL XU-17</span>
        <button onClick={() => setSound((value) => !value)}>声音 {sound ? "开启" : "关闭"}</button>
      </header>

      <section className="seven-viewport">
        <div className="seven-route" style={sceneStyle}>
          <div className="route-flicker" aria-hidden="true" />
          <div className="route-clock">04:17</div>
          <div className={`route-phone ${phoneRinging ? "ringing" : ""}`}><i /><span>LINE 017</span></div>
          {witnessVisible && <div className="route-witness" aria-hidden="true"><i /><b /></div>}
          {reverseVisible && <div className="reverse-walker" style={{ left: `${Math.max(8, 92 - progress)}%` }} aria-hidden="true"><i /><b /><span /></div>}
          {day >= 5 && progress > 58 && <div className="door-copy">证词校准 {day + 1}/7</div>}

          <div className="player-walker" aria-label="许澄">
            <i className="walker-head" />
            <b className="walker-body" />
            <span className="walker-arm" />
            <em className="walker-leg left" />
            <em className="walker-leg right" />
            <small>档案箱</small>
          </div>
          <div className="player-shadow" aria-hidden="true" />
        </div>

        <div className="seven-day-stamp">
          <span>{days[day].label}</span>
          <time>{days[day].date}</time>
          <i>{String(day + 1).padStart(2, "0")} / 07</i>
        </div>

        {phase === "walk" && (
          <div className={`seven-narration kind-${eventKind}`}>
            <p>{narration}</p>
            <span>{moving ? "脚步正在向左" : "按住 ← 或下方按钮继续"}</span>
          </div>
        )}

        {phase === "intro" && (
          <section className="seven-card intro-card">
            <span>{days[day].label} / RETURN ROUTE</span>
            <h1>{day === 0 ? "B2 七日回程" : days[day].date.slice(0, 10)}</h1>
            <p>{days[day].intro}</p>
            <blockquote>{days[day].instruction}</blockquote>
            <button onClick={startDay}>从电梯向左走</button>
          </section>
        )}

        {phase === "end" && (
          <section className="seven-card end-card">
            <span>{days[day].label} / ROUTE COMPLETE</span>
            <h2>{day >= 6 ? "出口没有打开" : "安全出口已通过"}</h2>
            <p>{days[day].end}</p>
            <button onClick={nextDay}>{day >= days.length - 1 ? "查看第十七行" : "继续到下一日"}</button>
          </section>
        )}

        {phase === "complete" && (
          <section className="seven-card complete-card">
            <span>WITNESS ACCEPTED / 04:17:07</span>
            <h1>第八日<br />正在等待</h1>
            <p>第七行之后，打印机又吐出一张空白通行记录。形成日期是 2001 年，纸面仍然温热。</p>
            <blockquote>路线没有结束。只是这一次，向左走的人不再是许澄。</blockquote>
            <div>
              <a href={`${basePath}/`}>返回档案终端</a>
              <button onClick={replay}>重新开始七日</button>
            </div>
          </section>
        )}

        <div className="seven-progress"><i style={{ width: `${progress}%` }} /></div>
      </section>

      <footer className="seven-controls">
        <div><span>唯一操作</span><p>按住向左键，让许澄走完同一条回程路线。</p></div>
        <button
          disabled={phase !== "walk" || shock}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setMoving(true); }}
          onPointerUp={() => setMoving(false)}
          onPointerCancel={() => setMoving(false)}
          onPointerLeave={() => setMoving(false)}
          aria-label="按住向左行走"
        >
          <b>←</b><span>按住行走</span>
        </button>
      </footer>

      {shock && (
        <div className={`seven-shock shock-day-${day + 1}`} role="alert">
          <img src={asset("/cctv-duplicate-witness.png")} alt="同一名女性同时出现在摄像机前和走廊尽头" />
          <div><span>你走得太慢了</span><b>{day >= 6 ? "下一次由我来走" : "不要看安全镜"}</b></div>
        </div>
      )}

      {completed && <div className="seven-complete-scar" aria-hidden="true">REMOTE WITNESS / XU-17</div>}
    </main>
  );
}
