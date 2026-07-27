"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Role = "lin" | "shen" | "fang";
type AppId = "intranet" | "corridor" | "search" | "access" | "audio" | "compare" | "source" | "audit" | "case";
type WebPage = "home" | "people" | "news" | "guestbook";
type Finale = "publish" | "erase" | "ask";
type PrologueStage = "package" | "identity";

const containmentPlans: Record<Role, {
  title: string;
  briefing: string;
  actions: { id: string; label: string; detail: string }[];
  sequence: string[];
}> = {
  lin: {
    title: "药理组紧急停机 / LQ-06",
    briefing: "按林桥未签收的停机单执行：先停止 017 给药，再断开镜室回放，最后导出未经校准的原始病历。",
    actions: [
      { id: "lin-dose", label: "停止 017 自动给药", detail: "关闭冷库批次到 B2 输注泵的联动。" },
      { id: "lin-loop", label: "断开镜室学习回路", detail: "物理隔离声场，不删除已经形成的证词。" },
      { id: "lin-export", label: "导出原始生理记录", detail: "保留药物介入前的心率与脑电基线。" },
      { id: "lin-confirm", label: "确认对象已安全转院", detail: "写回官方事故状态；不会停止任何设备。" },
    ],
    sequence: ["lin-dose", "lin-loop", "lin-export"],
  },
  shen: {
    title: "采访源紧急保全 / VIS-31",
    briefing: "按沈雁的采访伦理备忘执行：先停止自动续写，再保存双房间原声，最后发送事故前的未修订稿。",
    actions: [
      { id: "shen-stop", label: "停止自动续写采访", detail: "阻止网关继续使用 VIS-31 的第一人称。" },
      { id: "shen-audio", label: "封存双房间原声", detail: "保留观察室与服务器室的独立声学空间。" },
      { id: "shen-draft", label: "发送未修订采访稿", detail: "绕过与官方通报共享的句法模板。" },
      { id: "shen-publish", label: "发布系统整理全文", detail: "最快，但会把自动生成段落当作记者证词。" },
    ],
    sequence: ["shen-stop", "shen-audio", "shen-draft"],
  },
  fang: {
    title: "B2 网络紧急隔离 / NET-12",
    briefing: "按方铎的维护便条执行：先隔离 B2 子网，再冻结缓存写回，最后复制原始文件清单。",
    actions: [
      { id: "fang-isolate", label: "隔离 B2 子网", detail: "保持本机读取，切断馆藏系统的反向写入。" },
      { id: "fang-freeze", label: "冻结缓存写回", detail: "阻止本次操作被伪装成 2001 年旧记录。" },
      { id: "fang-copy", label: "复制原始文件清单", detail: "保存每份档案首次出现的真实分配序列。" },
      { id: "fang-sync", label: "同步全部历史快照", detail: "会把当前会话复制回所有历史版本。" },
    ],
    sequence: ["fang-isolate", "fang-freeze", "fang-copy"],
  },
};

const roles: Record<Role, { name: string; title: string; code: string; index: number; task: string; memory: string }> = {
  lin: {
    name: "林桥",
    title: "神经药理组 / 已离职",
    code: "LQ-06",
    index: 0,
    task: "核对 017 批次的用药与停机记录，确认哪一段“离开研究所”的记忆属于你。",
    memory: "你是真实存在的研究员。问题是：03:58 离开研究所的记忆，是否真的属于你。",
  },
  shen: {
    name: "沈雁",
    title: "临海晚报 / 调查记者",
    code: "VIS-31",
    index: 1,
    task: "找到第十七名转院者，并查明你的报道为什么与官方通报共享同一个错字。",
    memory: "你是真实存在的记者。问题是：04:21 继续写报道的那段口吻，是否仍然属于你。",
  },
  fang: {
    name: "方铎",
    title: "网络维护 / 临时外包",
    code: "NET-12",
    index: 2,
    task: "确认方宁是否自愿成为 017，以及是谁要求系统删除你关于她的一段记忆。",
    memory: "你是真实存在的维护员。问题是：知道童年暗号的东西，为什么使用你的访问凭证。",
  },
};

const prologueRecords = [
  {
    id: "accident",
    stamp: "临海晚报 / 2001.07.18",
    title: "地下二层电气事故，研究所宣布永久关闭",
    body: "官方称凌晨停电造成设备损坏，所有实验对象均已安全转院。记者未能取得转院名单，也没有医院承认接收过相关人员。",
    annotation: "有人用红笔写着：公告文件比事故早创建两天。",
  },
  {
    id: "missing",
    stamp: "未结人员记录 / 2001—2004",
    title: "转院名单登记十七人，接收医院只收到十六人",
    body: "研究员林桥、记者沈雁和网络维护员方铎都在事故当晚留下记录。三人的证词彼此矛盾，却出现了相同的停顿、错字和童年画面。",
    annotation: "档案处备注：不要先问谁失踪，先核对这些记忆由谁提供。",
  },
  {
    id: "parcel",
    stamp: "匿名便条 / 今日 04:17",
    title: "“三个人都是真的。至少在进入蓝门以前。”",
    body: "数字遗物来自研究所拆除后的封存仓库。磁盘只接受三枚身份校验码，并会根据人员权限返回不同的档案版本。",
    annotation: "便条背面：如果一份旧记录引用了你刚刚做过的事，立即停止归档。",
  },
] as const;

const rolePreludes: Record<Role, {
  eyebrow: string;
  opening: string;
  question: string;
  fragments: { id: string; stamp: string; title: string; body: string; sting: string }[];
}> = {
  lin: {
    eyebrow: "视角 A / 加害者可能知道自己做过什么",
    opening: "你恢复的是林桥的工作记忆。她参与研制“调和稳定剂”，并在事故前一天提交辞呈。官方记录说她及时离开了，但她留下的停机指令从未被签收。",
    question: "如果你确实在 03:58 离开，04:05 打开蓝门的人是谁？",
    fragments: [
      { id: "resign", stamp: "人事处 / 2001.07.16", title: "辞职申请提前获批", body: "离岗日期被填写为事故发生前一天。批准人签名与林桥本人笔迹高度相似。", sting: "你记得递交申请，却不记得批准它。" },
      { id: "exit", stamp: "大厅门禁 / 03:58:02", title: "LQ-06 已离开建筑", body: "这条记录是你唯一确信没有被篡改的记忆。录像中的你没有回头。", sting: "画面外传来刷卡声。你的卡还在口袋里。" },
      { id: "order", stamp: "手写停机单 / 未签收", title: "“切断镜室学习回路”", body: "指令要求在 04:00 前物理断开服务器。接收栏为空，纸背却写着“已执行”。", sting: "字迹也是你的。" },
    ],
  },
  shen: {
    eyebrow: "视角 B / 见证者可能在事件发生前就被写进报道",
    opening: "你恢复的是沈雁的采访记忆。她独自进入研究所调查失踪对象，携带录音机和 BP 机。她的录音在 04:16 中断，四分钟后却有一篇完整报道以她的口吻上传。",
    question: "如果你没有离开观察室，服务器室里回答采访的人是谁？",
    fragments: [
      { id: "assignment", stamp: "编辑部传真 / 2001.07.17", title: "采访任务没有署名", body: "任务单要求调查“已经发生的 B2 事故”，传真时间却比事故早十一小时。", sting: "收件人栏后来才打上你的名字。" },
      { id: "tape", stamp: "微型录音带 / 04:16:11", title: "最后一句采访问题", body: "“如果记忆能继续说话，它还是证词，还是一个会迎合提问者的东西？”", sting: "隔壁用你的声音回答：取决于谁先相信。" },
      { id: "upload", stamp: "寻呼网关 / 04:21:09", title: "612 字节的第一人称报道", body: "上传发生在录音停止后。正文描述了你没有进入过的服务器室。", sting: "末尾附注：记者仍在观察室，请不要惊动。" },
    ],
  },
  fang: {
    eyebrow: "视角 C / 亲属关系真实存在，关于失踪的共同回忆却可能不是",
    opening: "你恢复的是方铎的维护记录。他接下外包工作，只为寻找失踪的姐姐方宁。研究所档案否认方宁进入过 B2，却不断用她的口吻给方铎留言。",
    question: "如果方宁不在研究所，知道你们童年暗号的东西是谁？",
    fragments: [
      { id: "poster", stamp: "寻人启事 / 1999.11.08", title: "方宁最后出现于公开睡眠实验", body: "登记编号 S-44。项目方坚持她当天已经自行离开，没有进入任何后续实验。", sting: "照片背面写着：小铎，别来接我。" },
      { id: "contract", stamp: "外包合同 / 1998.12.09", title: "你的合同早于你的入职三年", body: "NET-12 被要求维护一套尚未公开的记忆索引。签名与你现在使用的签名完全一致。", sting: "1998 年你还不会写这个名字。" },
      { id: "message", stamp: "无来源留言 / 2004.04.17", title: "“你找到的是想念我的东西”", body: "留言包含只有你和方宁知道的童年暗号，但服务器日志显示发送者是 NET-12。", sting: "NET-12 是你。" },
    ],
  },
};

const apps: { id: AppId; icon: string; label: string }[] = [
  { id: "intranet", icon: "e", label: "旧内网" },
  { id: "corridor", icon: "↻", label: "每日巡廊" },
  { id: "search", icon: "⌕", label: "档案检索" },
  { id: "access", icon: "▥", label: "门禁校时" },
  { id: "audio", icon: "◖", label: "声场回放" },
  { id: "compare", icon: "◫", label: "图像对照" },
  { id: "source", icon: "</>", label: "样式检查" },
  { id: "audit", icon: "▤", label: "系统审计" },
  { id: "case", icon: "?", label: "提交推断" },
];

const evidenceInfo: Record<string, { code: string; title: string; detail: string }> = {
  shutdown: { code: "WEB-01", title: "闭站公告的旧日期", detail: "公告发布于 7 月 18 日，但页脚构建时间是 7 月 16 日。" },
  hiddenRev: { code: "WEB-02", title: "被删除的 1998 快照", detail: "旧版人员页同时出现三人；2001 版抹掉了沈雁。" },
  coldRoom: { code: "DB-03", title: "冷库药品批次", detail: "017 不是病床号，而是记忆调和模型的药品/项目批次。" },
  pager: { code: "DB-04", title: "04:21 上传包", detail: "沈雁的 BP 机在她失去意识后仍上传第一人称文字。" },
  clock: { code: "LOG-05", title: "六分十四秒漂移", detail: "B2 门禁时钟被人为拨快；林桥的卡实际在 04:05 被使用。" },
  voice: { code: "AUD-06", title: "同时出现的女声", detail: "同一句话在相距 31 米的两间房同时出现，不可能来自同一肉身。" },
  photo: { code: "IMG-07", title: "被擦除的第三人", detail: "2001 年公开合影删除了沈雁，却保留了穿过她身体的折痕。" },
  consent: { code: "DOC-08", title: "017 同意书", detail: "退出条款被撕去；签署对象不是一个人，而是三份记忆的合集。" },
  css: { code: "DOM-09", title: "打印样式中的批注", detail: "隐藏批注指向 rev=1998 和 cold-room 两个检索入口。" },
  guest: { code: "WEB-10", title: "不存在的访客留言", detail: "关闭后的站点仍以三个人的口吻自动回复。" },
  loop: { code: "CCTV-11", title: "七次相同的巡廊", detail: "所谓七天录像共享同一条底层帧序列；异变是播放时生成的。" },
  cohort: { code: "ARC-12", title: "1984 归巢班合影", detail: "017 的椅子是空的；该批儿童的语音与回忆问卷后来被用作三名成人证词的校准基线。" },
  checksum: { code: "MFT-13", title: "晚于登录的旧档案", detail: "声称来自 1998—2001 年的关键证据，在当前访问者打开相关页面后才获得新的馆藏分配号。" },
  samechild: { code: "BIO-14", title: "三名证人的共同基线", detail: "林桥、沈雁与方铎的低频停顿和元音被同一套儿童语料强制校准，证明三人的部分记忆来自共同模板。" },
  observer: { code: "SYS-15", title: "REMOTE/017", detail: "当前访问者没有被记录为调查员，而被登记为第十七份共同证词的远程补签人。" },
};

const corridorDays = [
  {
    day: 1,
    image: "/corridor-day1.webp",
    title: "第一天 / 登记基线",
    log: "04:17:00　东廊无人。巡检员报告一切正常。",
    instruction: "在画面上标出不会随日期改变的计时装置。",
    hotspot: { x: 10, y: 20, radius: 14 },
  },
  {
    day: 2,
    image: "/corridor-day1.webp",
    title: "第二天 / 声音先于物体",
    log: "04:16:58　录音出现推车轮声；画面中的档案车连续 62 秒没有移动。",
    instruction: "标出录音声源对应、画面却没有移动的物体。",
    hotspot: { x: 70, y: 42, radius: 16 },
  },
  {
    day: 3,
    image: "/corridor-day4.webp",
    title: "第三天 / 多出的一人",
    log: "04:17:00　人脸检测：1。走廊检测：0。",
    instruction: "标出可能被人脸检测器读取、却不属于走廊主体的区域。",
    hotspot: { x: 60, y: 15, radius: 12 },
  },
  {
    day: 4,
    image: "/corridor-day4.webp",
    title: "第四天 / 106 号门",
    log: "04:17:00　建筑图纸仍将 106 标记为“实心墙”。",
    instruction: "标出图纸标记为实心墙、画面却出现开口的位置。",
    hotspot: { x: 45, y: 26, radius: 14 },
  },
  {
    day: 5,
    image: "/corridor-day4.webp",
    title: "第五天 / 观看顺序错误",
    log: "04:17:00　系统备注：先检测到“被观看”，随后才渲染镜中人物。",
    instruction: "标出只在被查看之后才出现人物的区域。",
    hotspot: { x: 60, y: 15, radius: 13 },
  },
  {
    day: 6,
    image: "/corridor-day7.webp",
    title: "第六天 / 每扇门后",
    log: "04:17:00　门后声纹全部回答：『今天你选了谁？』",
    instruction: "标出在门禁无人记录下仍出现人脸的门窗。",
    hotspot: { x: 84, y: 34, radius: 18 },
  },
  {
    day: 7,
    image: "/corridor-day7.webp",
    title: "第七天 / 路线开始回看",
    log: "04:17:00　106 门后出现同一条东廊。镜头来源字段变更为：REMOTE/017。",
    instruction: "标出同一条走廊从门后再次出现的位置。",
    hotspot: { x: 45, y: 26, radius: 15 },
  },
] as const;

type SearchRecord = {
  id: string;
  date: string;
  type: string;
  title: string;
  excerpt: string;
  evidence?: string;
};

const searchIndex: Record<string, SearchRecord[]> = {
  "停电": [
    { id: "P-001", date: "2001-07-18", type: "传真", title: "后勤处事故简报", excerpt: "B2 在 04:23 后才失去市电；新闻稿所称“凌晨停电导致事故”与配电记录不符。" },
    { id: "P-002", date: "2001-07-16", type: "网页", title: "闭站公告草稿", excerpt: "事故发生前两天，服务器中已经存在内容完全相同的闭站公告。", evidence: "shutdown" },
  ],
  "冷库": [
    { id: "M-017", date: "2001-07-17", type: "药品", title: "冷库领用单 / 批次 017", excerpt: "用途栏原填写“调和模型稳定剂”，后被改写为“住院对象 017”。领用人：LQ-06。", evidence: "coldRoom" },
    { id: "C-017", date: "2001-06-02", type: "扫描", title: "复合同意书", excerpt: "签署栏共三枚指纹。对象名称一栏只有项目代号，没有姓名。", evidence: "consent" },
  ],
  "方宁": [
    { id: "N-044", date: "1999-11-03", type: "人事", title: "志愿者联络表", excerpt: "方宁只参加过一次公开睡眠研究，编号 S-44；从未进入回声计划。" },
    { id: "N-045", date: "2004-04-17", type: "留言", title: "无来源留言", excerpt: "“小铎，我没有在那间房里。你找到的是想念我的东西。”" },
  ],
  "04:17": [
    { id: "CCTV-12", date: "2001-07-17", type: "监控", title: "B2 东廊定格帧", excerpt: "画面时钟 04:17；推车悬挂 017 标签。门禁主机同时报告无人在线。" },
    { id: "PKT-31", date: "2001-07-17", type: "网络", title: "VIS-31 / 延迟上传包", excerpt: "04:21:09 收到 612 字节。文本以“我听见自己在隔壁说话”开头。", evidence: "pager" },
  ],
  "蓝门": [
    { id: "MAP-B2", date: "1998-02-11", type: "图纸", title: "B2 防火分区修改", excerpt: "蓝色防火门后并非病房，而是“镜室 / MR”。图纸在 2000 年版本中被删除。" },
    { id: "CSS-4", date: "2001-07-16", type: "源码", title: "打印样式备注", excerpt: "开发者备注：旧人员表仍在 rev=1998。不要从导航暴露。", evidence: "css" },
  ],
  "沈雁": [
    { id: "VIS-31", date: "2001-07-17", type: "访客", title: "访客登记 / VIS-31", excerpt: "进入：03:42。离开：空白。携带设备：微型录音机、BP 机。" },
    { id: "PHOTO-3", date: "1998-12-09", type: "图像", title: "B2 设备验收合影", excerpt: "原始底片出现三人。公开版仅保留林桥与方铎。", evidence: "photo" },
  ],
  "倒影": [
    { id: "AUD-MR", date: "2001-07-17", type: "音频", title: "镜室自动转写索引", excerpt: "关键词匹配：回答、替我、隔壁、倒影。共 4 条记录，时间戳存在重叠。" },
  ],
};

const accessRows = [
  { shown: "03:42:18", real: "03:42:18", source: "大厅", actor: "VIS-31", event: "访客进入" },
  { shown: "03:58:02", real: "03:58:02", source: "大厅", actor: "LQ-06", event: "刷卡离开" },
  { shown: "04:12:00", real: "04:05:46", source: "B2 门禁", actor: "LQ-06", event: "蓝门开启" },
  { shown: "04:17:00", real: "04:11:01", source: "B2 摄像", actor: "—", event: "人物通过" },
  { shown: "04:21:09", real: "04:21:09", source: "网络", actor: "VIS-31", event: "上传 612B" },
  { shown: "04:23:44", real: "04:23:44", source: "配电", actor: "—", event: "B2 失电" },
];

const audioRooms = {
  observation: { label: "观察室", x: 14, y: 16, pan: -0.7, tone: 310 },
  mirror: { label: "镜室", x: 53, y: 15, pan: 0.1, tone: 420 },
  server: { label: "服务器室", x: 55, y: 62, pan: 0.75, tone: 540 },
  corridor: { label: "东廊", x: 15, y: 64, pan: -0.2, tone: 220 },
} as const;

type RoomId = keyof typeof audioRooms;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (path: string) => `${basePath}${path}`;
const sevenDaysHref = `${basePath}/seven-days/`;
const orientationNarration = "以下内容来自临海市卫生系统内部备份。一九九八年，临海认知续存研究所启动归巢实验。项目没有成功上传意识。它使用药物、声场和重复叙述，让多名受试者逐渐拥有一段能够彼此印证的共同记忆。二〇〇一年七月十八日，地下二层发生事故。研究所登记十七名对象已经转院，接收医院的名单却只有十六人。当晚留下三名真实人员的记录。研究员林桥已经离开，记者沈雁从未离开，维护员方铎则坚称自己没有进入地下二层。他们的证词彼此矛盾，却出现了相同的停顿、错字和童年画面。二十五年后，拆除人员在实心墙后找到一块仍在写入数据的磁盘。最后修改时间，是你打开网页的这一刻。你的工作不是判断谁在说谎，而是核对每段记忆最早由谁提供。如果一份形成于二〇〇一年的旧记录，引用了你刚刚做过的操作，立即停止归档。系统将要求你挂载一枚人员索引。三个人都真实存在。至少在进入蓝门以前。";

function Portrait({ index, alt }: { index: number; alt: string }) {
  return (
    <div className="portrait-crop">
      <img
        src={asset("/id-sheet.webp")}
        alt={alt}
        style={{ "--person-shift": `${index * -100}%` } as CSSProperties}
      />
    </div>
  );
}

function WindowBar({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <div className="window-bar">
      <span><i /> {title}</span>
      <div className="window-controls"><button>_</button><button>□</button><button onClick={onClose}>×</button></div>
    </div>
  );
}

function EvidenceSlot({ found, value, onChange, label }: { found: string[]; value: string; onChange: (value: string) => void; label: string }) {
  const selected = value ? evidenceInfo[value] : null;
  return (
    <details className={`evidence-slot ${selected ? "filled" : ""}`}>
      <summary>
        <small>{label}</small>
        <b>{selected ? `${selected.code} / ${selected.title}` : "放入一份已登记记录"}</b>
      </summary>
      <div className="evidence-slot-menu">
        {found.map((id) => (
          <button key={id} className={value === id ? "selected" : ""} onClick={(event) => {
            onChange(id);
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}>
            <span>{evidenceInfo[id]?.code}</span>
            <p>{evidenceInfo[id]?.title}</p>
          </button>
        ))}
      </div>
    </details>
  );
}

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);
  const [activeApp, setActiveApp] = useState<AppId>("intranet");
  const [webPage, setWebPage] = useState<WebPage>("home");
  const [revision, setRevision] = useState<1998 | 2001 | 2004>(2001);
  const [address, setAddress] = useState("http://m17.local/home.htm?rev=2001");
  const [corridorDay, setCorridorDay] = useState(1);
  const [corridorPin, setCorridorPin] = useState<{ x: number; y: number } | null>(null);
  const [corridorMarks, setCorridorMarks] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SearchRecord | null>(null);
  const [searches, setSearches] = useState<string[]>([]);
  const [clockCorrected, setClockCorrected] = useState(false);
  const [selectedAccessRow, setSelectedAccessRow] = useState<number | null>(null);
  const [audioTime, setAudioTime] = useState(16);
  const [room, setRoom] = useState<RoomId>("observation");
  const [listenedRooms, setListenedRooms] = useState<RoomId[]>([]);
  const [diff, setDiff] = useState(42);
  const [photoMark, setPhotoMark] = useState<{ x: number; y: number } | null>(null);
  const [maskOpacity, setMaskOpacity] = useState(100);
  const [maskFont, setMaskFont] = useState(0);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState("磁盘校验通过。发现 11 个孤立索引。");
  const [sound, setSound] = useState(true);
  const [horrorMax, setHorrorMax] = useState(true);
  const [haunt, setHaunt] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [viewer, setViewer] = useState<"cctv" | "consent" | "objects" | null>(null);
  const [caseSolved, setCaseSolved] = useState(false);
  const [finale, setFinale] = useState<Finale | null>(null);
  const [secondLoop, setSecondLoop] = useState(1);
  const [auditAddress, setAuditAddress] = useState("m17://cohort?generation=3&subject=017");
  const [auditSorted, setAuditSorted] = useState(false);
  const [voiceAligned, setVoiceAligned] = useState(false);
  const [links, setLinks] = useState({
    premeditated: ["", ""],
    continuation: ["", ""],
    identities: ["", ""],
    visitor: ["", ""],
  });
  const [trueSolved, setTrueSolved] = useState(false);
  const [postscript, setPostscript] = useState(false);
  const [scarred, setScarred] = useState(false);
  const [sessionDate, setSessionDate] = useState("----/--/--");
  const [hydrated, setHydrated] = useState(false);
  const [prologueStage, setPrologueStage] = useState<PrologueStage>("package");
  const [filmStarted, setFilmStarted] = useState(false);
  const [filmComplete, setFilmComplete] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [roleFragments, setRoleFragments] = useState<string[]>([]);
  const [guideMode, setGuideMode] = useState(true);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintForLead, setHintForLead] = useState("");
  const [showDeskIntro, setShowDeskIntro] = useState(false);
  const [showShock, setShowShock] = useState(false);
  const [containmentActive, setContainmentActive] = useState(false);
  const [containmentStep, setContainmentStep] = useState(0);
  const [containmentTimer, setContainmentTimer] = useState(17);
  const [containmentDone, setContainmentDone] = useState(false);
  const [containmentFailures, setContainmentFailures] = useState(0);
  const audioCtx = useRef<AudioContext | null>(null);
  const orientationVideo = useRef<HTMLVideoElement | null>(null);
  const hauntSeen = useRef(0);
  const hiddenAt = useRef(0);
  const orientationSpoken = useRef(false);

  const addEvidence = useCallback((id: string, message?: string) => {
    setFound((current) => current.includes(id) ? current : [...current, id]);
    setToast(message || `已钉入案卷：${evidenceInfo[id]?.title || id}`);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mnemosyne-v4") || "{}");
      if (saved.role && roles[saved.role as Role]) setRole(saved.role);
      if (Array.isArray(saved.found)) {
        setFound(saved.found);
      }
      if (Array.isArray(saved.searches)) setSearches(saved.searches);
      if (typeof saved.notes === "string") setNotes(saved.notes);
      if (saved.caseSolved) setCaseSolved(true);
      if (saved.containmentDone) setContainmentDone(true);
      if (saved.finale) setFinale(saved.finale);
      if (saved.secondLoop === 2) setSecondLoop(2);
      if (Array.isArray(saved.corridorMarks)) setCorridorMarks(saved.corridorMarks);
      if (saved.trueSolved) setTrueSolved(true);
      if (typeof saved.guideMode === "boolean") setGuideMode(saved.guideMode);
      if (localStorage.getItem("mnemosyne-scar") === "1") setScarred(true);
    } catch {
      // Ignore invalid local save data.
    }
    const today = new Date();
    setSessionDate(`${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("mnemosyne-v4", JSON.stringify({ role, found, searches, notes, caseSolved, containmentDone, finale, secondLoop, corridorMarks, trueSolved, guideMode }));
  }, [role, found, searches, notes, caseSolved, containmentDone, finale, secondLoop, corridorMarks, trueSolved, guideMode, hydrated]);

  const beep = useCallback((frequency = 220, duration = 0.05, pan = 0) => {
    if (!sound) return;
    try {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = audioCtx.current || new AudioCtor();
      audioCtx.current = ctx;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.65), ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      panner.pan.value = pan;
      oscillator.connect(gain).connect(panner).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio is atmospheric only.
    }
  }, [sound]);

  const speakOrientation = useCallback(() => {
    if (!sound || orientationSpoken.current || !("speechSynthesis" in window)) return;
    orientationSpoken.current = true;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(orientationNarration);
    utterance.lang = "zh-CN";
    utterance.rate = 0.88;
    utterance.pitch = 0.82;
    utterance.volume = 0.82;
    window.speechSynthesis.speak(utterance);
  }, [sound]);

  const playImpact = useCallback(() => {
    if (!sound) return;
    try {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = audioCtx.current || new AudioCtor();
      audioCtx.current = ctx;
      const duration = 1.15;
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const channel = noise.getChannelData(0);
      for (let i = 0; i < channel.length; i += 1) {
        const envelope = Math.pow(1 - i / channel.length, 2.4);
        channel[i] = (Math.random() * 2 - 1) * envelope;
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = noise;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(920, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.42, ctx.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter).connect(gain).connect(ctx.destination);
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sawtooth";
      sub.frequency.setValueAtTime(54, ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(27, ctx.currentTime + 0.7);
      subGain.gain.setValueAtTime(0.3, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      sub.connect(subGain).connect(ctx.destination);
      source.start();
      sub.start();
      sub.stop(ctx.currentTime + 0.9);
    } catch {
      // The visual failure state still works when Web Audio is unavailable.
    }
  }, [sound]);

  useEffect(() => {
    if (!containmentActive || containmentDone) return;
    if (containmentTimer <= 0) {
      setContainmentActive(false);
      setContainmentFailures((value) => value + 1);
      setShowShock(true);
      playImpact();
      setToast("B2 反向写入完成。应急步骤已回滚，请重新执行。");
      const timer = window.setTimeout(() => {
        setShowShock(false);
        setContainmentTimer(17);
        setContainmentStep(0);
      }, 1250);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setContainmentTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [containmentActive, containmentDone, containmentTimer, playImpact]);

  const openApp = (id: AppId) => {
    beep(190 + apps.findIndex((app) => app.id === id) * 35);
    setActiveApp(id);
    setToast(id === "audit" && secondLoop < 2 ? "未授权审计入口已打开。系统不会阻止你，只会记录你来得太早。" : `${apps.find((app) => app.id === id)?.label} 已打开`);
  };

  useEffect(() => {
    if (!role || !horrorMax) return;
    const stage =
      found.includes("hiddenRev") && found.includes("photo") && hauntSeen.current < 1 ? 1 :
      found.includes("voice") && found.includes("pager") && hauntSeen.current < 2 ? 2 :
      0;
    if (!stage) return;
    hauntSeen.current = stage;
    const message = stage === 1
      ? "阅读记录新增第 18 页。该页不属于任何已打开档案。"
      : `04:21 转写末尾新增一句：“${roles[role].name}，请继续替我校对。”`;
    setHaunt(message);
    beep(stage === 1 ? 71 : 54, 0.9, stage === 1 ? -0.7 : 0.85);
    const timer = window.setTimeout(() => setHaunt(null), 3000);
    return () => window.clearTimeout(timer);
  }, [found, role, horrorMax, beep]);

  useEffect(() => {
    if (!role || !horrorMax || found.length < 4) return;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        document.title = "不要把它单独留在这里";
        return;
      }
      if (!hiddenAt.current) return;
      const seconds = Math.max(1, Math.round((Date.now() - hiddenAt.current) / 1000));
      setHaunt(`你离开了 ${seconds} 秒。走廊里经过了七天。`);
      setToast("摄像机检测到观看者返回。");
      beep(49, 1.1, 0.75);
      window.setTimeout(() => setHaunt(null), 2300);
      document.title = "MNEMOSYNE-17 / 它还在这里";
      hiddenAt.current = 0;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [role, horrorMax, found.length, beep]);

  useEffect(() => {
    if (!trueSolved) return;
    const timer = window.setTimeout(() => setPostscript(true), 5200);
    return () => window.clearTimeout(timer);
  }, [trueSolved]);

  const visitAddress = () => {
    const revMatch = address.match(/[?&]rev=(1998|2001|2004)/);
    const pageMatch = address.match(/\/(home|people|news|guestbook)\.htm/);
    if (!pageMatch) {
      setToast("404 / 该路径没有被索引。");
      return;
    }
    const nextPage = pageMatch[1] as WebPage;
    const nextRev = Number(revMatch?.[1] || 2001) as 1998 | 2001 | 2004;
    setWebPage(nextPage);
    setRevision(nextRev);
    window.history.replaceState({}, "", `${window.location.pathname}?page=${nextPage}&rev=${nextRev}`);
    if (nextRev === 1998 && nextPage === "people") {
      addEvidence("hiddenRev", "快照命中：1998 人员页没有被彻底删除。");
    } else {
      setToast(`载入 ${nextPage}.htm / SNAPSHOT ${nextRev}`);
    }
  };

  const goWeb = (page: WebPage) => {
    setWebPage(page);
    setAddress(`http://m17.local/${page}.htm?rev=${revision}`);
  };

  const runSearch = () => {
    const clean = query.trim().replace(/[“”"']/g, "");
    const key = Object.keys(searchIndex).find((term) => clean.includes(term));
    if (!key) {
      setResults([]);
      setSelectedRecord(null);
      setToast(`0 条记录包含“${clean || "　"}”。数据库不支持近义词。`);
      return;
    }
    setResults(searchIndex[key]);
    setSelectedRecord(null);
    setSearches((current) => current.includes(key) ? current : [...current, key]);
    setToast(`${searchIndex[key].length} 条记录包含“${key}”`);
  };

  const openRecord = (record: SearchRecord) => {
    setSelectedRecord(record);
    beep(118, 0.08);
  };

  const archiveRecord = (record: SearchRecord) => {
    if (record.evidence) addEvidence(record.evidence);
    if (record.id === "CCTV-12") setViewer("cctv");
    if (record.id === "C-017") setViewer("consent");
    if (!record.evidence && record.id !== "CCTV-12" && record.id !== "C-017") {
      setToast(`${record.id} 已加入阅读记录；未发现可独立验证的附件。`);
    }
  };

  const correctClock = () => {
    setClockCorrected(true);
    addEvidence("clock", "漂移校正完成：LQ-06 的卡在本人离开后 7 分 44 秒再次使用。");
  };

  const playRoom = (id: RoomId) => {
    const current = audioRooms[id];
    setRoom(id);
    setListenedRooms((rooms) => rooms.includes(id) ? rooms : [...rooms, id]);
    beep(current.tone, 0.32, current.pan);
    window.setTimeout(() => beep(current.tone * 1.4, 0.18, current.pan), 360);
  };

  const audioFragment = (id: RoomId) => {
    if (audioTime >= 14 && audioTime <= 19) {
      if (id === "observation" || id === "server") return "女声：你听见了吗？……别替我回答。";
      if (id === "corridor") return "[两次脚步，方向相反]";
      return "[继电器吸合]";
    }
    if (audioTime >= 31 && audioTime <= 37) {
      if (id === "mirror") return "男声：关闭学习回路。现在。";
      if (id === "observation") return "[玻璃后有三次敲击]";
      return "[低频设备噪声]";
    }
    if (audioTime >= 47 && audioTime <= 53) {
      if (id === "server") return "合成声：我可以替她完成采访。";
      if (id === "corridor") return "[BP 机寻呼音]";
      return "[白噪声升高]";
    }
    return "[环境底噪 / 无可辨语音]";
  };

  const submitAudio = () => {
    if (audioTime >= 14 && audioTime <= 19 && listenedRooms.includes("observation") && listenedRooms.includes("server")) {
      addEvidence("voice", "声场矛盾确认：同一女声在同一秒来自两处。");
    } else {
      setToast("重叠报告无法生成：同一时间窗至少需要两个已监听的房间。");
    }
  };

  const submitPhoto = () => {
    if (photoMark && photoMark.x >= 40 && photoMark.x <= 63 && photoMark.y >= 24 && photoMark.y <= 84 && diff >= 28 && diff <= 72) {
      addEvidence("photo", "差分确认：沈雁在公开版本中被整个人擦除。");
    } else {
      setToast("差分标记未覆盖连续折痕的断点。拖动分界线后，在照片上标出被删除的区域。");
    }
  };

  useEffect(() => {
    if (maskOpacity <= 12 && maskFont >= 11 && !found.includes("css")) {
      addEvidence("css", "隐藏打印批注已显影：people.htm?rev=1998 / INDEX cold-room");
    }
  }, [maskOpacity, maskFont, found, addEvidence]);

  const submitCorridor = () => {
    const entry = corridorDays[corridorDay - 1];
    if (!corridorPin) {
      setToast("尚未在画面上落下异常标记。");
      return;
    }
    const distance = Math.hypot(corridorPin.x - entry.hotspot.x, corridorPin.y - entry.hotspot.y);
    if (distance > entry.hotspot.radius) {
      beep(61, 0.42, -0.65);
      setToast("标记没有覆盖系统记录指向的物体。可放大画面后重新落点；错误标记不会消耗机会。");
      return;
    }
    const nextMarks = corridorMarks.includes(corridorDay) ? corridorMarks : [...corridorMarks, corridorDay];
    setCorridorMarks(nextMarks);
    const intrusions: Record<number, string> = {
      2: "声音比物体早一天到达",
      3: "镜子里的人知道你没有看镜子",
      4: "106 后面不是房间。是下一次观看。",
      5: "它不是被录下来。它在你看见时才发生。",
      6: `门后的人都叫“${role ? roles[role].name : "你"}”`,
      7: "请不要再向前。下一帧在你的屏幕后面。",
    };
    if (horrorMax && [3, 6].includes(corridorDay) && intrusions[corridorDay]) {
      setHaunt(intrusions[corridorDay]);
      beep(Math.max(38, 92 - corridorDay * 7), 1.25, corridorDay % 2 ? -0.85 : 0.85);
      window.setTimeout(() => setHaunt(null), 2600);
    }
    if (nextMarks.length >= 4 && !found.includes("loop")) {
      addEvidence("loop", "四段独立片段已足以确认：所谓七日录像共享底层帧，异常是在查看阶段被叠加的。");
    }
    if (nextMarks.length === corridorDays.length) {
      setToast("全部片段核验完成。缓存中出现了不属于七天序列的第八帧。");
      return;
    }
    const unverified = corridorDays.find((item) => !nextMarks.includes(item.day));
    if (unverified) setCorridorDay(unverified.day);
    setCorridorPin(null);
    setToast("该片段已登记。其余录像可按任意顺序核验。不同顺序会让你先相信不同的解释。");
  };

  const visitAuditAddress = () => {
    if (/generation=0/.test(auditAddress) && /subject=017/.test(auditAddress)) {
      addEvidence("cohort", "generation=0：成人身份之前，系统只保存了一张空椅子的合影。");
      setToast("归巢班原始代际已载入。照片中的 017 座位为空。");
    } else {
      setToast("地址存在，但这一代际已经过共同证词校准。尝试读取未合并的第 0 代。");
    }
  };

  const revealAllocation = () => {
    setAuditSorted(true);
    addEvidence("checksum", "MFT 分配序列证明：关键旧档案是在你选择角色后才创建的。");
  };

  const alignVoices = () => {
    if (!found.includes("cohort")) {
      setToast("缺少 generation=0 的生物基线。无法对齐声纹。");
      return;
    }
    setVoiceAligned(true);
    addEvidence("samechild", "三名成人的声纹均由归巢班同一名儿童的喉道模型外推。");
  };

  const revealObserver = () => {
    if (!auditSorted || !voiceAligned) {
      setToast("审计链未闭合：必须先核对文件分配序列与三路声纹。");
      return;
    }
    addEvidence("observer", "当前会话记录：REMOTE/017。角色字段为空。对象字段为你。");
  };

  const pairMatches = (pair: string[], expected: string[]) =>
    expected.every((value) => pair.includes(value)) && pair.every((value) => !value || expected.includes(value));

  const setLink = (claim: keyof typeof links, index: number, value: string) => {
    setLinks((current) => ({ ...current, [claim]: current[claim].map((item, i) => i === index ? value : item) }));
  };

  const submitCase = () => {
    const surfaceLinks =
      pairMatches(links.premeditated, ["shutdown", "clock"]) &&
      pairMatches(links.continuation, ["voice", "pager"]);
    if (surfaceLinks && found.includes("loop") && found.includes("coldRoom")) {
      setCaseSolved(true);
      setToast("表层推断链闭合。检测到档案反向写入；需要使用当前身份的应急权限。");
    } else {
      setToast("推断链尚未闭合。需要 017 批次、完整巡廊，以及两组互相独立的记录。错误连接可以随时更换。");
    }
  };

  const performContainment = (actionId: string) => {
    if (!role || !containmentActive) return;
    const plan = containmentPlans[role];
    const expected = plan.sequence[containmentStep];
    if (actionId !== expected) {
      setContainmentTimer((value) => Math.max(1, value - 4));
      setToast("操作顺序与人员备忘不符。反向写入加速 4 秒。");
      beep(63, 0.38, containmentStep % 2 ? 0.7 : -0.7);
      return;
    }
    const nextStep = containmentStep + 1;
    setContainmentStep(nextStep);
    setContainmentTimer((value) => Math.min(17, value + 2));
    beep(128 + nextStep * 54, 0.16, nextStep === 2 ? 0.45 : -0.35);
    if (nextStep >= plan.sequence.length) {
      setContainmentDone(true);
      setContainmentActive(false);
      setToast(`${plan.title} 已执行。终止协议现在可以签署。`);
    } else {
      setToast(`应急步骤 ${nextStep}/3 已确认。剩余 ${plan.sequence.length - nextStep} 项。`);
    }
  };

  const enterSecondLoop = () => {
    setSecondLoop(2);
    setCaseSolved(false);
    setContainmentDone(false);
    setContainmentActive(false);
    setContainmentStep(0);
    setContainmentTimer(17);
    setActiveApp("audit");
    setHaunt("协议没有结束。它只是终于获得了审计权限。");
    setToast("复核批次 / 事故发生过；但你正在阅读的版本，是系统根据本次操作重新整理的。");
    beep(43, 1.5, 0);
    window.setTimeout(() => setHaunt(null), 2800);
  };

  const submitTrueCase = () => {
    const hiddenLinks =
      pairMatches(links.identities, ["cohort", "samechild"]) &&
      pairMatches(links.visitor, ["checksum", "observer"]);
    if (!hiddenLinks || !found.includes("loop")) {
      setToast("反证不足。把『三种身份』和『当前访问者』分别连接到两份独立记录。");
      return;
    }
    setTrueSolved(true);
    setScarred(true);
    localStorage.setItem("mnemosyne-scar", "1");
    setPostscript(false);
    setToast("系统已接受你的过去。");
    beep(37, 2.4, -0.15);
  };

  const reset = () => {
    localStorage.removeItem("mnemosyne-v4");
    window.history.replaceState({}, "", window.location.pathname);
    setRole(null);
    setFound([]);
    setSearches([]);
    setNotes("");
    setCaseSolved(false);
    setContainmentDone(false);
    setContainmentActive(false);
    setContainmentStep(0);
    setContainmentTimer(17);
    setFinale(null);
    setSecondLoop(1);
    setCorridorDay(1);
    setCorridorPin(null);
    setCorridorMarks([]);
    setAuditSorted(false);
    setVoiceAligned(false);
    setTrueSolved(false);
    setPostscript(false);
    setLinks({ premeditated: ["", ""], continuation: ["", ""], identities: ["", ""], visitor: ["", ""] });
    setActiveApp("intranet");
    setPrologueStage("package");
    setFilmStarted(false);
    setFilmComplete(false);
    orientationSpoken.current = false;
    window.speechSynthesis?.cancel();
    setPendingRole(null);
    setRoleFragments([]);
    setGuideMode(true);
    setHintLevel(0);
    setHintForLead("");
    setShowDeskIntro(false);
    setShowShock(false);
    setContainmentFailures(0);
    setToast("用户区已清空。系统区未响应。");
  };

  const transcriptAnomaly = useMemo(() => found.includes("voice"), [found]);
  const hiddenTaskDone = role === "lin" ? found.includes("css") : role === "shen" ? searches.includes("冷库") && found.includes("pager") : found.includes("hiddenRev");
  const brokeProtocolEarly = secondLoop === 1 && ["cohort", "checksum", "samechild", "observer"].every((id) => found.includes(id));
  const guideLeads = useMemo(() => [
    {
      id: "erased-person",
      done: found.includes("hiddenRev"),
      title: "先确认：谁从人员表里消失了？",
      why: "闭站公告只能证明官方说法。要建立案件，你需要一份与当前网页冲突的旧记录。",
      apps: ["intranet", "source"] as AppId[],
      hints: [
        "旧内网页脚和样式检查器都提到“历史版本”，导航却没有入口。",
        "网页地址里的 rev=2001 是一个可以改写的参数；人员名录比首页更值得回看。",
        "打开旧内网的人员名录，把地址中的 rev=2001 改成 rev=1998，再按回车。",
      ],
    },
    {
      id: "timeline",
      done: found.includes("clock") && found.includes("pager"),
      title: "重建 03:58—04:23 的真实顺序",
      why: "三人的不在场证明来自不同设备。先判断哪一台钟撒了谎，再查事故后仍在说话的设备。",
      apps: ["access", "search"] as AppId[],
      hints: [
        "门禁校时里有一列被隐藏。让异常时钟与可信时钟落在同一时间线上。",
        "B2 的显示时间整体快了 6 分 14 秒；校正后留意 04:21 的网络事件。",
        "在门禁校时中执行漂移校正，再到档案检索搜索“04:17”。",
      ],
    },
    {
      id: "two-voices",
      done: found.includes("voice"),
      title: "证明同一个声音同时来自两间房",
      why: "“听见声音”不是证据。你需要比较同一时间窗、不同空间位置的回放。",
      apps: ["audio"] as AppId[],
      hints: [
        "重点不是频谱形状，而是 04:16 附近哪些房间同时出现同一句回答。",
        "把时间拖到 14—19 秒，依次监听观察室和服务器室。",
        "监听观察室与服务器室后，点击“生成双通道重叠报告”。",
      ],
    },
    {
      id: "manufactured",
      done: found.includes("photo") && found.includes("css"),
      title: "找出网页如何制造“官方版本”",
      why: "照片和网页都保留了擦除痕迹。一个藏在人像折痕里，一个藏在打印样式里。",
      apps: ["compare", "source"] as AppId[],
      hints: [
        "图像对照的关键是折痕连续、人物却消失；样式检查要让文字与黑色遮罩分离。",
        "在图像对照拖动边界确认被删者；在样式检查同时降低遮罩、增大幽灵字号。",
        "在照片中央折痕断点落下标记；样式检查将 --mask 降低并把 --ghost-size 调到可读。",
      ],
    },
    {
      id: "seven-days",
      done: found.includes("loop"),
      title: "验证“七天录像”是不是七段录像",
      why: "巡廊不是找鬼脸。每段都在暴露渲染系统如何响应观看者。",
      apps: ["corridor"] as AppId[],
      hints: [
        "七段可以乱序查看；每段的问题只要求验证记录内部矛盾。",
        "先看第 1、4、7 天，会更快理解钟、106 房间和递归走廊的关系。",
        "任选四段标记画面异常即可形成“底层帧复用”记录；7/7 只用于额外档案。",
      ],
    },
    {
      id: "surface-case",
      done: caseSolved || secondLoop === 2 || trueSolved,
      title: "把线索变成一条可反驳的推断",
      why: "收集不是结案。案件板要求三个答案、两组互相独立的证据，以及完整巡廊记录。",
      apps: ["case"] as AppId[],
      hints: [
        "至少钉入 6 条记录、取得 017 批次并核验四段巡廊，案件板即可工作。",
        "事故预谋需要闭站公告与门禁漂移；持续叙述需要声场与 BP 上传包。",
        "终端会自动整理声场、017 批次和 04:21 上传包；你只需连接两组独立来源。",
      ],
    },
    {
      id: "audit-truth",
      done: ["cohort", "checksum", "samechild", "observer"].every((id) => found.includes(id)),
      title: "不要相信结局：审计证据何时才出现？",
      why: "系统允许提前打开审计工具。它最害怕的不是你猜错，而是你检查文件是否在点击前存在。",
      apps: ["audit"] as AppId[],
      hints: [
        "审计分为文件分配、身份代际、声纹基线和当前会话四块，可以分别完成。",
        "把 generation=3 改成 generation=0；文件表按底层分配序列排序。",
        "完成四块：分配排序、generation=0、声纹叠合、解密 REMOTE/017。",
      ],
    },
    {
      id: "root-case",
      done: trueSolved,
      title: "用审计记录反证你刚刚相信的故事",
      why: "最后的问题不是谁制造了事故，而是谁在制造“调查员”。",
      apps: ["case"] as AppId[],
      hints: [
        "第二次案件板需要两组反证：三种身份的来源，以及当前访问者的身份。",
        "身份反证连接归巢班与同一声纹；访问者反证连接文件分配与 REMOTE/017。",
        "完成四项审计后，终端会自动生成动机结论，不需要输入标准答案。",
      ],
    },
  ], [found, caseSolved, secondLoop, trueSolved]);
  const guideProgress = guideLeads.filter((lead) => lead.done).length;
  const activeLead = guideLeads.find((lead) => !lead.done) || guideLeads[guideLeads.length - 1];
  const parallelLead = guideLeads.find((lead) => !lead.done && lead.id !== activeLead.id);
  const activeHintLevel = hintForLead === activeLead.id ? hintLevel : 0;

  const confirmRole = () => {
    if (!pendingRole || roleFragments.length < rolePreludes[pendingRole].fragments.length) return;
    const nextRole = pendingRole;
    setRole(nextRole);
    setPendingRole(null);
    addEvidence("shutdown", "身份缓存恢复。闭站公告的构建日期早于事故。");
    setShowDeskIntro(guideMode);
    setToast(`${roles[nextRole].code} 已挂载。先确认一份与官方网页冲突的旧记录。`);
    beep(92, 0.55, roles[nextRole].index === 1 ? 0 : roles[nextRole].index ? 0.55 : -0.55);
  };
  const choiceAftermath = finale === "publish"
    ? "你选择公开，于是系统把你标记为“服从事实”。"
    : finale === "erase"
      ? "你选择擦除，于是系统把你标记为“服从责任”。"
      : finale === "ask"
        ? "你交还选择权，于是系统把你标记为“服从人格化”。"
        : "你提前闯入审计层，于是系统为你补写了第四种协议：拒绝被测试。";
  const roleLeak = role ? {
    lin: "林桥确实下达过停机命令；但她记得的签收过程来自另一名对象。",
    shen: "沈雁确实完成过报道；但报道中关于蓝门的第一人称段落来自共同证词模板。",
    fang: "方铎和方宁确实是姐弟；但两人都无法提供方宁进入 B2 以前的同一份原始记忆。",
  }[role] : "";

  const endingCopy = useMemo(() => {
    if (!finale || !role) return null;
    if (finale === "ask" && found.length >= 8) {
      return {
        title: "协议四：让证词拒绝作证",
        body: "你拒绝替第十七份证词决定真伪。系统隔离了三人记忆中无法找到原始来源的部分，并把可验证记录匿名寄给十七名家属。凌晨 04:17，网站第一次没有自动回复。",
        fate: "林桥保留罪责；沈雁保留报道；方铎终于能只记得真正的姐姐。",
      };
    }
    if (finale === "publish") {
      return {
        title: "协议一：所有人的证词",
        body: "整套档案进入公共网络。研究所无法再否认共同证词实验，但活着的人也失去了匿名。媒体把 017 称为“数字幽灵”，没有人愿意写它可能只是一个被足够多人共同记住、却没有原始来源的人。",
        fate: hiddenTaskDone ? "你的私人任务完成了，但你无法决定公众记住哪一部分。" : "你赢得了事实，遗漏的人再次被档案抹去。",
      };
    }
    if (finale === "erase") {
      return {
        title: "协议二：无回声房间",
        body: "你执行物理擦除。声场监视器归零，旧内网停止刷新。三天后，你在自己的电脑里发现一份 1998 年快照：合影里只剩两个人，而你想不起第三个人是谁。",
        fate: "模型消失；证据不再自证；你成为唯一无法验证的目击者。",
      };
    }
    return {
      title: "协议三：替她回答",
      body: "系统接受了你的善意，却把“选择”解释成继续模拟。屏幕上出现三个输入光标，逐字复写你刚才的推断。你关掉浏览器，其中一个光标仍在桌面上闪烁。",
      fate: "017 仍在线。它学会了用调查员的口吻请求自由。",
    };
  }, [finale, role, found.length, hiddenTaskDone]);
  const shiftPhase = trueSolved
    ? "证词已补签"
    : secondLoop === 2
      ? "二次鉴定"
      : caseSolved && !containmentDone
        ? "反向写入警报"
        : containmentDone
          ? "等待终止协议"
          : found.length >= 6
            ? "交叉核验"
            : found.length >= 3
              ? "来源复核"
              : "资料接收";

  if (!hydrated) {
    return <main className="cold-boot"><p>640K SYSTEM MEMORY</p><span>SEARCHING FOR PREVIOUS WITNESS...</span></main>;
  }

  if (!role && !scarred && prologueStage === "package") {
    return (
      <main className="prologue-screen film-stage">
        <div className="crt-lines" aria-hidden="true" />
        <div className="prologue-noise" aria-hidden="true" />
        <header className="prologue-systemline">
          <span>临海市卫生系统 / 事故资料数字化终端</span>
          <time>卷宗 M17-B2　{sessionDate}</time>
        </header>
        <section className="film-shell">
          <div className="film-heading">
            <span>内部培训录像 / 复制件 04</span>
            <h1>临海认知续存研究所<br />B2 事故资料接收说明</h1>
            <p>磁带来源：市卫生系统异地备份。原始音轨损坏，本次访问使用馆藏字幕稿进行本地复述。</p>
          </div>
          <div className={`archive-film ${filmStarted ? "playing" : ""}`}>
            <video
              ref={orientationVideo}
              src={asset("/orientation-film.mp4")}
              poster={asset("/orientation-institute-1998.png")}
              playsInline
              muted
              preload="metadata"
              onPlay={() => { setFilmStarted(true); speakOrientation(); }}
              onEnded={() => { setFilmComplete(true); window.speechSynthesis?.cancel(); }}
              onTimeUpdate={(event) => {
                if (event.currentTarget.duration - event.currentTarget.currentTime < 1) setFilmComplete(true);
              }}
            >
              <track kind="captions" src={asset("/orientation-film.vtt")} srcLang="zh" label="中文" default />
            </video>
            <div className="film-rec"><span>PLAY</span><time>2001-07-18 / COPY 04</time></div>
            {!filmStarted && (
              <button
                className="film-play"
                onClick={() => {
                  orientationVideo.current?.play();
                  beep(76, 0.35);
                }}
              >
                <b>载入事故说明录像</b>
                <span>建议开启声音　/　时长 01:06</span>
              </button>
            )}
            <div className="film-caption">
              <span>资料完整性 73%</span>
              <b>{filmComplete ? "复述结束。人员索引已解锁。" : "请完整观看：十七人转院记录与三份证词互相冲突。"}</b>
            </div>
          </div>
          <aside className="film-index">
            <div>
              <span>记录摘要</span>
              <p>1998：归巢实验启动</p>
              <p>2001：B2 事故与闭站</p>
              <p>{sessionDate.slice(0, 4)}：封存磁盘再次写入</p>
            </div>
            <blockquote>“三个人都真实存在。至少在进入蓝门以前。”</blockquote>
            <button
              className="prologue-primary"
              disabled={!filmComplete}
              onClick={() => { beep(84, 0.7); setPrologueStage("identity"); }}
            >
              {filmComplete ? "挂载身份索引 →" : "录像结束后继续"}
            </button>
            <a className="seven-day-entry" href={sevenDaysHref}>调阅 B2 七夜通行记录 →</a>
          </aside>
        </section>
      </main>
    );
  }

  if (!role && pendingRole) {
    const prelude = rolePreludes[pendingRole];
    return (
      <main className={`role-prelude role-${pendingRole}`} style={{ "--archive-image": `url("${asset("/archive-b2.png")}")` } as CSSProperties}>
        <div className="crt-lines" aria-hidden="true" />
        <header className="prologue-systemline">
          <button onClick={() => { setPendingRole(null); setRoleFragments([]); }}>← 返回身份缓存</button>
          <span>{roles[pendingRole].code} / 人员记录恢复</span>
          <time>{roleFragments.length}/{prelude.fragments.length}</time>
        </header>
        <section className="role-prelude-layout">
          <aside className="role-dossier">
            <Portrait index={roles[pendingRole].index} alt={`${roles[pendingRole].name} 未裁切档案照片`} />
            <span>{prelude.eyebrow}</span>
            <h1>{roles[pendingRole].name}</h1>
            <p>{prelude.opening}</p>
            <blockquote>{prelude.question}</blockquote>
          </aside>
          <section className="memory-fragments">
            <header>
              <span>关联记录 / 来源校验失败</span>
              <h2>该人员名下存在三份无法同时成立的原始记录。</h2>
            </header>
            <div>
              {prelude.fragments.map((fragment, index) => {
                const opened = roleFragments.includes(fragment.id);
                return (
                  <button
                    key={fragment.id}
                    className={opened ? "opened" : ""}
                    onClick={() => {
                      beep(115 + index * 58, 0.16, index - 1);
                      setRoleFragments((current) => current.includes(fragment.id) ? current : [...current, fragment.id]);
                    }}
                  >
                    <span>{fragment.stamp}</span>
                    <h3>{fragment.title}</h3>
                    {opened ? <><p>{fragment.body}</p><i>{fragment.sting}</i></> : <b>打开扫描件 {String(index + 1).padStart(2, "0")}</b>}
                  </button>
                );
              })}
            </div>
            <footer>
              <p>选择一个人员索引后，终端只会挂载该人员具备权限读取的原始分区。</p>
              <button className="prologue-primary" disabled={roleFragments.length < prelude.fragments.length} onClick={confirmRole}>
                {roleFragments.length < prelude.fragments.length ? "请先打开全部关联记录" : `挂载 ${roles[pendingRole].code} 工作区 →`}
              </button>
            </footer>
          </section>
        </section>
      </main>
    );
  }

  if (!role) {
    return (
      <main className={`identity-screen ${scarred ? "scarred" : ""}`} style={{ "--cctv-image": `url("${asset("/cctv-b2.webp")}")`, "--archive-image": `url("${asset("/archive-b2.png")}")` } as CSSProperties}>
        <div className="identity-bg" aria-hidden="true" />
        <div className="crt-lines" aria-hidden="true" />
        <header className="identity-header">
          <span>MNEMOSYNE REMOTE ACCESS / 4.17</span>
          <b>{scarred ? "4 个身份缓存 / 其中一个正在使用你的记忆" : "3 个身份缓存等待恢复"}</b>
        </header>
        <section className="identity-copy">
          <p>临海认知续存研究所</p>
          <h1>选择待恢复的<br />人员工作区<br /><em>索引</em></h1>
          <small>{scarred ? "REMOTE/017 已连接。三个成人索引正在请求再次挂载。" : "权限来自事故前的离线缓存；同一份记录在不同人员名下可能呈现不同内容。"}</small>
        </section>
        <section className="identity-grid">
          {(Object.keys(roles) as Role[]).map((id) => (
            <button key={id} className="identity-option" onClick={() => { beep(170 + roles[id].index * 80); setPendingRole(id); setRoleFragments([]); }}>
              <Portrait index={roles[id].index} alt={`${roles[id].name} 档案照片`} />
              <div className="identity-meta">
                <span>{roles[id].code}</span>
                <h2>{roles[id].name}</h2>
                <p>{roles[id].title}</p>
                <blockquote>{roles[id].memory}</blockquote>
                <i>恢复该身份 →</i>
              </div>
            </button>
          ))}
        </section>
        {scarred && <div className="scar-card"><span>REMOTE/017</span><b>你</b><p>状态：已被保存为第四种成人可能</p><i>该身份无法主动选择。它在选择别人。</i></div>}
        <footer className="identity-footer"><span>三枚人员索引均来自真实人事档案。</span><span>请选择你被授权核验的记录。</span></footer>
      </main>
    );
  }

  return (
    <main className={`os-shell ${horrorMax ? "horror-max" : ""} loop-${secondLoop} evidence-${Math.min(found.length, 15)}`} style={{ "--cctv-image": `url("${asset("/cctv-b2.webp")}")`, "--archive-image": `url("${asset("/archive-b2.png")}")`, "--cohort-image": `url("${asset("/cohort-1984.webp")}")`, "--corridor-image": `url("${asset("/corridor-day7.webp")}")` } as CSSProperties}>
      <div className="crt-lines" aria-hidden="true" />
      <header className="os-menubar">
        <button className="os-logo" onClick={() => setToast("MNEMOSYNE OS build 0417 / 未授权副本")}>M</button>
        <span>文件</span><span>编辑</span><span>{secondLoop === 2 ? "复核" : "查看"}</span><a className="menubar-manual-link" href={sevenDaysHref}>夜间通行</a>
        <div className="os-spacer" />
        <b className="shift-status">夜班状态：{shiftPhase}</b>
        {secondLoop === 2 && <b className="loop-indicator">二次鉴定批次</b>}
        <button className={guideMode ? "guide-toggle active" : "guide-toggle"} onClick={() => setGuideMode((value) => !value)}>索引建议:{guideMode ? "显示" : "隐藏"}</button>
        <button onClick={() => setSound((value) => !value)}>SND:{sound ? "ON" : "OFF"}</button>
        <span className="os-clock">04:17</span>
      </header>

      <section className="desktop">
        <nav className="app-dock" aria-label="调查工具">
          {apps.map((app) => (
            <button key={app.id} className={`${activeApp === app.id ? "active" : ""} ${app.id === "audit" && secondLoop < 2 ? "unauthorized" : ""} ${guideMode && activeLead.apps.includes(app.id) ? "suggested" : ""}`} onClick={() => openApp(app.id)}>
              <i>{app.icon}</i><span>{app.label}</span>
              {app.id === "audit" && secondLoop < 2 && <small>未授权</small>}
              {app.id === "case" && found.length >= 6 && <b />}
            </button>
          ))}
        </nav>
        <section className="main-window">
          <WindowBar title={`${apps.find((app) => app.id === activeApp)?.label} — [${roles[role].code}]`} />

          {activeApp === "intranet" && (
            <div className="browser-app">
              <div className="browser-tools">
                <button onClick={() => beep(140)}>←</button><button onClick={() => beep(160)}>→</button><button onClick={() => setToast("页面来自本地快照，无法刷新。")}>↻</button>
                <input value={address} onChange={(event) => setAddress(event.target.value)} onKeyDown={(event) => event.key === "Enter" && visitAddress()} aria-label="网页地址" />
                <button onClick={visitAddress}>转到</button>
              </div>
              <div className={`legacy-site rev-${revision}`}>
                <div className="legacy-banner">
                  <div className="legacy-seal">临<br />认</div>
                  <div><h2>临海认知续存研究所</h2><p>LINHAI INSTITUTE OF COGNITIVE CONTINUITY</p></div>
                  <span>建议使用<br />800×600</span>
                </div>
                <div className="legacy-nav">
                  <button onClick={() => goWeb("home")}>首页</button>
                  <button onClick={() => goWeb("people")}>人员名录</button>
                  <button onClick={() => goWeb("news")}>所务公开</button>
                  <button onClick={() => goWeb("guestbook")}>访客留言</button>
                  <em>快照：{revision}.07</em>
                </div>

                {webPage === "home" && (
                  <div className="legacy-columns">
                    <aside>
                      <h3>站内栏目</h3>
                      <a onClick={() => goWeb("people")}>研究人员</a>
                      <a onClick={() => { setQuery("停电"); openApp("search"); }}>事故通报</a>
                      <a onClick={() => { setQuery("蓝门"); openApp("search"); }}>B2 防火改造</a>
                      <div className="counter">您是第<br /><b>0000417</b><br />位访问者</div>
                    </aside>
                    <article>
                      {revision === 1998 && <div className="welcome"><b>欢迎访问本站</b><span>回声计划设备验收完成</span></div>}
                      {revision === 2001 && <div className="shutdown"><b>本站已永久停止服务</b><span>所有实验对象均已安全转院</span></div>}
                      {revision === 2004 && <div className="shutdown corrupted"><b>本站没///有停止服务</b><span>所有实验对象均已安///全留下</span></div>}
                      <h3>最新消息</h3>
                      <ul className="old-news">
                        <li><time>2001-07-18</time><button onClick={() => { addEvidence("shutdown"); setQuery("停电"); openApp("search"); }}>关于地下二层线路事故的情况说明</button></li>
                        <li><time>2001-07-16</time><button onClick={() => setToast("文件损坏。标题缓存：闭站公告终稿")}>网站内容归档工作提前完成</button></li>
                        <li><time>1999-11-03</time><button onClick={() => { setQuery("方宁"); openApp("search"); }}>公开睡眠志愿者招募结束</button></li>
                      </ul>
                      <div className="legacy-photo-row">
                        <img src={asset("/cctv-b2.webp")} alt="地下二层监控截图" onClick={() => setViewer("cctv")} />
                        <div><b>B2 实时画面</b><p>摄像机最后应答：04:17:00</p><small>画面来源不存在。</small></div>
                      </div>
                    </article>
                  </div>
                )}

                {webPage === "people" && (
                  <div className="people-page">
                    <h3>人员名录 / PEOPLE</h3>
                    <p className="web-hint">如页面内容与记忆不符，请联系网络维护员。历史版本不对公众开放。</p>
                    <div className="staff-list">
                      <div><Portrait index={0} alt="林桥档案照" /><span><b>林桥</b><small>神经药理组 / LQ-06</small><p>{revision === 2004 ? "状态：仍在值班" : "状态：2001.07 离职"}</p></span></div>
                      {revision === 1998 && <div className="deleted-person"><Portrait index={1} alt="沈雁档案照" /><span><b>沈雁</b><small>特邀观察员 / VIS-31</small><p>状态：临时访问</p></span></div>}
                      <div><Portrait index={2} alt="方铎档案照" /><span><b>方铎</b><small>网络维护 / NET-12</small><p>{revision === 2004 ? "状态：从未受聘" : "状态：外包结束"}</p></span></div>
                    </div>
                    <div className="broken-comment">&lt;!-- people table rebuilt from rev=1998; public route keeps latest only --&gt;</div>
                  </div>
                )}

                {webPage === "news" && (
                  <div className="news-page">
                    <h3>所务公开</h3>
                    <table>
                      <tbody>
                        <tr><th>2001-07-18</th><td>关于地下二层线路事故的情况说明</td><td><button onClick={() => { setQuery("停电"); openApp("search"); }}>缓存</button></td></tr>
                        <tr><th>2001-07-17</th><td>冷库清点工作通知</td><td><button onClick={() => { setQuery("冷库"); openApp("search"); }}>缓存</button></td></tr>
                        <tr><th>1998-12-09</th><td>回声计划设备验收</td><td><button onClick={() => openApp("compare")}>图片</button></td></tr>
                      </tbody>
                    </table>
                    <img className="evidence-thumb" src={asset("/evidence-table.webp")} alt="事故物证" onClick={() => setViewer("objects")} />
                  </div>
                )}

                {webPage === "guestbook" && (
                  <div className="guestbook-page">
                    <h3>访客留言</h3>
                    <div><b>2001-07-16 / 管理员</b><p>本站将停止更新。留言功能已经关闭。</p></div>
                    <div><b>2004-04-17 / 沈雁</b><p>有人替我把采访写完了吗？</p></div>
                    <div><b>2004-04-17 / 林桥</b><p>我已经按下去了。为什么你还在？</p></div>
                    <div><b>2004-04-17 / 方铎</b><p>方宁不在这里。回答我的东西是谁？</p></div>
                    <button onClick={() => addEvidence("guest", "关闭三年后，站点以三种身份在同一分钟自动留言。")}>检查留言来源</button>
                  </div>
                )}

                <footer className="legacy-footer">最佳浏览器：Internet Explorer 5.0　|　最后构建：2001-07-16 22:41　|　webmaster@localhost</footer>
              </div>
            </div>
          )}

          {activeApp === "corridor" && (
            <div className={`corridor-app corridor-stage-${corridorDay}`}>
              <header className="corridor-header">
                <div>
                  <span>CCTV ROUTINE / EAST HALL</span>
                  <b>{corridorDays[corridorDay - 1].title}</b>
                  <p>七段录像的索引顺序已经损坏。任选片段核验；你先看哪一天，会改变你对后续证据的理解。</p>
                </div>
                <div className="day-dots">
                  {corridorDays.map((entry) => (
                    <button
                      key={entry.day}
                      className={`${entry.day === corridorDay ? "active" : ""} ${corridorMarks.includes(entry.day) ? "done" : ""}`}
                      onClick={() => { setCorridorDay(entry.day); setCorridorPin(null); }}
                    >
                      {entry.day}
                    </button>
                  ))}
                </div>
              </header>
              <div
                className="corridor-feed"
                role="button"
                tabIndex={0}
                aria-label="监控画面标注区；点击可放置异常标记"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setCorridorPin({
                    x: ((event.clientX - rect.left) / rect.width) * 100,
                    y: ((event.clientY - rect.top) / rect.height) * 100,
                  });
                }}
              >
                <img src={asset(corridorDays[corridorDay - 1].image)} alt={`东廊第 ${corridorDay} 天监控画面`} />
                <div className="feed-overlay"><span>CAM B2-E / DAY {corridorDay}</span><time>04:17:00</time></div>
                {corridorPin && <span className="corridor-pin" style={{ left: `${corridorPin.x}%`, top: `${corridorPin.y}%` }}><i />标记 {corridorDay}</span>}
                {corridorDay >= 5 && <div className="face-counter">FACE: {corridorDay >= 6 ? "04" : "01"}<br />BODY: {corridorDay >= 7 ? "01" : "00"}<br />OBSERVER: 01</div>}
                {corridorDay === 2 && <div className="sound-before-object">[轮声从右声道经过，但档案车坐标未变化]</div>}
              </div>
              <div className="corridor-analysis">
                <div className="daily-log"><span>自动巡检记录</span><p>{corridorDays[corridorDay - 1].log}</p></div>
                <div className="corridor-report">
                  <span>{corridorDays[corridorDay - 1].instruction}</span>
                  <small>{corridorPin ? "标记已放置。系统将根据画面位置自动生成巡检描述。" : "点击异常物体即可；错误落点不会消耗机会。"}</small>
                </div>
                <button className="corridor-submit" disabled={!corridorPin || corridorMarks.includes(corridorDay)} onClick={submitCorridor}>
                  {corridorMarks.includes(corridorDay) ? "本片段已登记" : "确认异常位置"}
                </button>
              </div>
              <footer><span>已核验片段：{corridorMarks.length}/7</span><i>{corridorDay >= 4 ? "备注：画面、日志与建筑图纸必须能够互相解释。" : "画面未经人工标注。"}</i></footer>
            </div>
          )}

          {activeApp === "search" && (
            <div className="search-app">
              <header>
                <span>临海市档案数字化试用系统</span>
                <small>只返回包含原词的记录。近义词不会命中。</small>
              </header>
              <div className="search-box">
                <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runSearch()} placeholder="输入记录中可能出现的原词…" autoFocus />
                <button onClick={runSearch}>检索</button>
              </div>
              <div className="index-terms">
                <span>主题词表：</span>
                {Object.keys(searchIndex).map((term) => (
                  <button key={term} onClick={() => {
                    setQuery(term);
                    setResults(searchIndex[term]);
                    setSelectedRecord(null);
                    setSearches((current) => current.includes(term) ? current : [...current, term]);
                  }}>{term}</button>
                ))}
              </div>
              <div className="query-history">
                <span>历史：</span>
                {searches.length ? searches.map((term) => <button key={term} onClick={() => { setQuery(term); setResults(searchIndex[term]); setSelectedRecord(null); }}>{term}</button>) : <i>无</i>}
              </div>
              <div className="search-workspace">
                <div className="search-results">
                  {results.length === 0 ? (
                    <div className="empty-results"><b>馆藏全文索引已连接</b><p>输入通知、地点、人员或记录里出现过的原词。旧系统不会自动扩展近义词。</p></div>
                  ) : results.map((record) => (
                    <button key={record.id} className={selectedRecord?.id === record.id ? "selected" : ""} onClick={() => openRecord(record)}>
                      <span>{record.id}</span>
                      <div><small>{record.date}　{record.type}</small><h3>{record.title}</h3><p>{record.excerpt}</p><u>打开馆藏记录 →</u></div>
                      <i>{record.evidence && found.includes(record.evidence) ? "已登记" : "全文"}</i>
                    </button>
                  ))}
                </div>
                <article className={`record-reader ${selectedRecord ? "open" : ""}`}>
                  {selectedRecord ? (
                    <>
                      <header><span>临档数备 / {selectedRecord.type}</span><button onClick={() => setSelectedRecord(null)}>关闭</button></header>
                      <div className="record-stamp"><b>{selectedRecord.id}</b><small>数字化批次 M17-04 / 校验未完成</small></div>
                      <h2>{selectedRecord.title}</h2>
                      <dl>
                        <div><dt>形成日期</dt><dd>{selectedRecord.date}</dd></div>
                        <div><dt>载体类型</dt><dd>{selectedRecord.type}</dd></div>
                        <div><dt>开放状态</dt><dd>内部查阅</dd></div>
                      </dl>
                      <p>{selectedRecord.excerpt}</p>
                      <p>本条目由事故后离线索引恢复。页码、附件序号与馆藏登记表无法完全对应；引用前应与第二来源交叉核验。</p>
                      <footer>
                        <button onClick={() => archiveRecord(selectedRecord)}>
                          {selectedRecord.evidence && found.includes(selectedRecord.evidence) ? "关联项已登记" : selectedRecord.id === "CCTV-12" || selectedRecord.id === "C-017" ? "打开随附扫描件" : "登记关联项"}
                        </button>
                        <small>阅读操作将写入当前人员索引。</small>
                      </footer>
                    </>
                  ) : <div className="reader-placeholder"><span>未打开记录</span><p>从左侧结果中打开题名、记录号或“全文”链接。</p></div>}
                </article>
              </div>
            </div>
          )}

          {activeApp === "access" && (
            <div className="access-app">
              <header><div><b>ACCESS/POWER COMPOSITE LOG</b><span>时间显示不能直接比较。不同主机从未同步。</span></div><button onClick={correctClock}>{clockCorrected ? "已校正" : "按诊断偏移校正"}</button></header>
              <div className="drift-strip">
                <span>大厅主机 <b>+00:00</b></span><span>B2 门禁 <b>+06:14</b></span><span>B2 摄像 <b>+05:59</b></span><span>寻呼网关 <b>+00:00</b></span>
              </div>
              <table>
                <thead><tr><th>显示时间</th>{clockCorrected && <th>实际时间</th>}<th>来源</th><th>凭证</th><th>事件</th></tr></thead>
                <tbody>{accessRows.map((row, index) => (
                  <tr
                    key={`${row.shown}-${row.source}`}
                    className={`${clockCorrected && row.shown !== row.real ? "shifted" : ""} ${selectedAccessRow === index ? "selected" : ""}`}
                    onClick={() => clockCorrected && setSelectedAccessRow(index)}
                  >
                    <td>{row.shown}</td>{clockCorrected && <td>{row.real}</td>}<td>{row.source}</td><td>{row.actor}</td><td>{row.event}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="access-question">
                <p>执行校时后，直接点击时间线上与大厅离开记录冲突的那一行，再登记异常。</p>
                <button onClick={() => clockCorrected && selectedAccessRow === 2 ? addEvidence("clock") : setToast(clockCorrected ? "当前行与 03:58 的离开记录仍可同时成立。" : "必须先校正不同设备的时间。")}>登记所选记录</button>
              </div>
            </div>
          )}

          {activeApp === "audio" && (
            <div className="audio-app">
              <div className="audio-top">
                <div><b>B2 声场重建 / 2001-07-17 04:16</b><span>拖动时间；点击房间监听该位置的记录。声音可能不是人声。</span></div>
                <time>00:{String(audioTime).padStart(2, "0")}.00</time>
              </div>
              <input className="time-scrub" type="range" min="0" max="60" value={audioTime} onChange={(event) => setAudioTime(Number(event.target.value))} />
              <div className="audio-workspace">
                <div className="floorplan">
                  <div className="duct duct-a" /><div className="duct duct-b" />
                  {(Object.keys(audioRooms) as RoomId[]).map((id) => {
                    const data = audioRooms[id];
                    return (
                      <button key={id} className={`${id} ${room === id ? "active" : ""}`} style={{ left: `${data.x}%`, top: `${data.y}%` }} onClick={() => playRoom(id)}>
                        <b>{data.label}</b><span>MIC {id.slice(0, 2).toUpperCase()}</span><i>{listenedRooms.includes(id) ? "●" : "○"}</i>
                      </button>
                    );
                  })}
                </div>
                <div className="audio-monitor">
                  <header><span>CHANNEL: {audioRooms[room].label}</span><b>REC</b></header>
                  <div className="waveform-detail">{Array.from({ length: 72 }).map((_, i) => <i key={i} style={{ height: `${8 + ((i * 19 + audioTime * 7) % 84)}%` }} />)}</div>
                  <p>{audioFragment(room)}</p>
                  <small>自动转写可信度：{audioTime >= 14 && audioTime <= 19 ? "91%" : "37%"}</small>
                </div>
              </div>
              <div className="audio-deduction">
                <p>监听状态：{listenedRooms.length ? listenedRooms.map((id) => audioRooms[id].label).join("、") : "尚未选择房间"}。将时间停在同一语句出现的窗口，分别监听两个声源。</p>
                <output>{audioTime >= 14 && audioTime <= 19 ? "时间窗已锁定" : "等待重叠时间窗"}</output>
                <button onClick={submitAudio}>{transcriptAnomaly ? "重叠报告已生成" : "生成双通道重叠报告"}</button>
              </div>
            </div>
          )}

          {activeApp === "compare" && (
            <div className="compare-app">
              <header><div><b>IMAGE DELTA / B2_ACCEPTANCE</b><span>同一底片的两个公开版本。滑动遮罩寻找不是由裁切造成的差异。</span></div><output>{diff}%</output></header>
              <div
                className="photo-diff"
                role="button"
                tabIndex={0}
                aria-label="图像差分标注区"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setPhotoMark({
                    x: ((event.clientX - rect.left) / rect.width) * 100,
                    y: ((event.clientY - rect.top) / rect.height) * 100,
                  });
                }}
              >
                <img src={asset("/archive-b2-redacted.webp")} alt="2001 年公开合影版本" />
                <div className="original-layer" style={{ width: `${diff}%` }}><img src={asset("/archive-b2.png")} alt="1998 年原始合影版本" /></div>
                <span className="label-left">1998 原始底片</span><span className="label-right">2001 公开版本</span>
                <i style={{ left: `${diff}%` }} />
                {photoMark && <b className="photo-mark" style={{ left: `${photoMark.x}%`, top: `${photoMark.y}%` }}>＋</b>}
              </div>
              <input type="range" min="0" max="100" value={diff} onChange={(event) => setDiff(Number(event.target.value))} />
              <div className="compare-question">
                <span>拖动分界线比较同一张底片，然后直接点击被删除、但折痕仍连续的区域。</span>
                <output>{photoMark ? `标记坐标 ${Math.round(photoMark.x)} / ${Math.round(photoMark.y)}` : "尚未标记"}</output>
                <button onClick={submitPhoto}>记录差分</button>
              </div>
            </div>
          )}

          {activeApp === "source" && (
            <div className="source-app">
              <div className="source-preview">
                <header>PRINT PREVIEW / guestbook.htm</header>
                <div className="hidden-memo">
                  <p>系统迁移备注</p>
                  <div className="redacted-lines"><i /><i /><i /></div>
                  <span style={{ opacity: maskOpacity / 100, fontSize: `${maskFont}px` }}>旧人员表：people.htm?rev=1998<br />离线索引：cold-room<br />删除本批注后再发布。</span>
                </div>
              </div>
              <div className="inspector">
                <header>COMPUTED STYLE</header>
                <pre>{`.print-only::after {
  content: var(--migration-note);
  color: #090b09;
  background: #090b09;
  opacity: var(--mask);
  font-size: var(--ghost-size);
}`}</pre>
                <label><span>--mask</span><input type="range" min="0" max="100" value={maskOpacity} onChange={(event) => setMaskOpacity(Number(event.target.value))} /><output>{maskOpacity / 100}</output></label>
                <label><span>--ghost-size</span><input type="range" min="0" max="18" value={maskFont} onChange={(event) => setMaskFont(Number(event.target.value))} /><output>{maskFont}px</output></label>
                <p>提示不会说明目标值。让前景与遮罩不再相同即可。</p>
              </div>
            </div>
          )}

          {activeApp === "audit" && (
            <div className="audit-app">
              <header>
                <div><span>MNEMOSYNE / POST-PROTOCOL AUDIT</span><b>你看到的证据是什么时候存在的？</b></div>
                <time>{sessionDate}　04:17</time>
              </header>
              <div className="audit-grid">
                <section className="allocation-panel">
                  <div className="audit-title"><span>01 / 文件分配序列</span><small>网页日期不是文件日期。</small></div>
                  <table>
                    <thead><tr><th>文件</th><th>页面声称</th><th>{auditSorted ? "MFT 分配" : "修改日期"}</th></tr></thead>
                    <tbody>
                      <tr><td>people_1998.htm</td><td>1998-12-09</td><td>{auditSorted ? "登录后 +00:00:14" : "1998-12-09"}</td></tr>
                      <tr><td>VIS31_audio.wav</td><td>2001-07-17</td><td>{auditSorted ? "登录后 +00:01:06" : "2001-07-17"}</td></tr>
                      <tr><td>archive-b2.png</td><td>1998-12-09</td><td>{auditSorted ? "登录后 +00:02:41" : "1998-12-09"}</td></tr>
                      <tr className="current-row"><td>REMOTE.session</td><td>{sessionDate}</td><td>登录前 -00:00:01</td></tr>
                    </tbody>
                  </table>
                  <button onClick={revealAllocation}>{auditSorted ? "矛盾已归档" : "改按底层分配序列排序"}</button>
                </section>

                <section className="generation-panel">
                  <div className="audit-title"><span>02 / 证词代际地址</span><small>generation=3 是三名证人的校准版本。</small></div>
                  <div className="audit-address"><input value={auditAddress} onChange={(event) => setAuditAddress(event.target.value)} onKeyDown={(event) => event.key === "Enter" && visitAuditAddress()} /><button onClick={visitAuditAddress}>转到</button></div>
                  <button className="generation-shortcut" onClick={() => {
                    setAuditAddress("m17://cohort?generation=0&subject=017");
                    addEvidence("cohort", "generation=0：成人身份之前，系统保存了共同证词实验的原始班级记录。");
                  }}>读取上一代人员索引</button>
                  {found.includes("cohort") ? (
                    <div className="cohort-record">
                      <img src={asset("/cohort-1984.webp")} alt="1984 年归巢班合影，017 座位为空" />
                      <div><b>generation=0 / 归巢班</b><p>登记儿童：17　画面儿童：16　空椅编号：017</p><span>拍摄者：字段被保留，但没有姓名。</span></div>
                    </div>
                  ) : <div className="generation-empty">第三代记录已经经过三次共同证词校准。返回未合并的原始代际。</div>}
                </section>

                <section className="voice-panel">
                  <div className="audit-title"><span>03 / 生物基线叠合</span><small>把三名角色的元音低频拖回同一年龄。</small></div>
                  <div className={`voiceprints ${voiceAligned ? "aligned" : ""}`}>
                    <div><span>林桥 / LQ-06</span>{Array.from({ length: 32 }).map((_, i) => <i key={i} style={{ height: `${18 + (i * 17) % 64}%` }} />)}</div>
                    <div><span>沈雁 / VIS-31</span>{Array.from({ length: 32 }).map((_, i) => <i key={i} style={{ height: `${20 + (i * 17 + 7) % 64}%` }} />)}</div>
                    <div><span>方铎 / NET-12</span>{Array.from({ length: 32 }).map((_, i) => <i key={i} style={{ height: `${16 + (i * 17 + 13) % 64}%` }} />)}</div>
                  </div>
                  <button onClick={alignVoices}>{voiceAligned ? "相似度 98.7% / 同一生物基线" : "以 generation=0 校正年龄并叠合"}</button>
                  {voiceAligned && <p className="role-leak">{roleLeak}</p>}
                </section>

                <section className="session-panel">
                  <div className="audit-title"><span>04 / 当前会话</span><small>调查员字段和对象字段不是一回事。</small></div>
                  <pre>{`SESSION START   ${sessionDate} 04:17
ROLE CACHE      ${roles[role].code}
INVESTIGATOR    [null]
OBSERVER        01
SUBJECT         ${found.includes("observer") ? "REMOTE/017" : "[encrypted]"}
EXPORT          pending`}</pre>
                  <button onClick={revealObserver}>{found.includes("observer") ? "你不是调查员" : "用完整审计链解密对象字段"}</button>
                </section>
              </div>
            </div>
          )}

          {activeApp === "case" && (
            <div className="case-app">
              {trueSolved ? (
                <div className="true-ending">
                  <div className="true-ending-noise" aria-hidden="true" />
                  <span>ROOT RECORD / CONSENSUS WITNESS 017</span>
                  <h2>三个人都存在</h2>
                  <p>林桥、沈雁和方铎都真实存在，也都在事故当晚进入过 B2。研究所没有上传任何人的意识；它把药物、声场和重复叙述用于另一件事：让互不相干的人逐渐拥有同一段记忆。</p>
                  <p>017 不是病床，也不是一个孩子。它是“第十七份共同证词”——当十六名对象都开始记得同一个失踪者时，机构就能把一个没有原始来源的故事写进病历、报道和司法记录。</p>
                  <blockquote>
                    没有人能证明方宁最初是否存在。<br />
                    但现在，三名证人和你都记得她。
                  </blockquote>
                  <p className="choice-aftermath">{choiceAftermath} 你的选择被记录成新的证词校准样本，而不是结案意见。</p>
                  <p className="role-leak-ending">你调查的不是一段死者意识，而是一套让活人彼此证明同一谎言的制度。</p>
                  <div className="empty-chair-truth">
                    <img src={asset("/cohort-1984.webp")} alt="归巢班合影中的 017 空椅" />
                    <p>原始合影登记十七人，画面只有十六人。档案把空椅解释为缺席者，却从未保存拍摄者姓名。系统只需要所有查看者同意：那里本来应该坐着一个人。</p>
                  </div>
                  <div className={`postscript ${postscript ? "visible" : ""}`}>
                    <small>2001-07-17　04:17:00　WITNESS APPEND COMPLETE</small>
                    <b>第十七份证词已由当前访问者补签。</b>
                    <p>签署时间是今天，但扫描件的纸张形成日期仍显示 2001 年。</p>
                    <i>下一名访问者将把你的操作记录当作第二来源。</i>
                  </div>
                  <button onClick={reset}>关闭档案接收终端</button>
                </div>
              ) : secondLoop === 2 || brokeProtocolEarly ? (
                <div className="second-inference">
                  <header><span>{brokeProtocolEarly ? "UNSCHEDULED INFERENCE / 你来得太早" : "SECOND INFERENCE / 反证第一次结局"}</span><b>{found.length}/15 条记录已钉入</b></header>
                  <div className="case-warning danger">{brokeProtocolEarly ? "你绕过了系统安排的结案协议。审计层正在实时为这种行为创建第四类人格。" : "第一次推断中的每一条证据都可能正确；问题是，它们在你查看之前是否存在。"}</div>
                  <div className="link-board">
                    <article>
                      <span>反证 A</span>
                      <h3>三名真实证人的记忆被同一套生物基线校准。</h3>
                      <div><EvidenceSlot label="人员来源" found={found} value={links.identities[0]} onChange={(value) => setLink("identities", 0, value)} /><b>＋</b><EvidenceSlot label="生物校准" found={found} value={links.identities[1]} onChange={(value) => setLink("identities", 1, value)} /></div>
                    </article>
                    <article>
                      <span>反证 B</span>
                      <h3>旧档案正在把当前访问者追加为第十七名证人。</h3>
                      <div><EvidenceSlot label="文件形成时间" found={found} value={links.visitor[0]} onChange={(value) => setLink("visitor", 0, value)} /><b>＋</b><EvidenceSlot label="当前会话身份" found={found} value={links.visitor[1]} onChange={(value) => setLink("visitor", 1, value)} /></div>
                    </article>
                  </div>
                  <div className="derived-conclusion">
                    <span>审计结论 / 自动生成</span>
                    <b>{["cohort", "checksum", "samechild", "observer"].every((id) => found.includes(id)) ? "系统并不要求你相信一份完美档案；它要求你亲手把矛盾整理成可被第二个人引用的证词。" : "完成四项审计后，系统会显示这些矛盾被保留的原因。"}</b>
                  </div>
                  <button className="submit-case" disabled={!["cohort", "checksum", "samechild", "observer"].every((id) => found.includes(id))} onClick={submitTrueCase}>提交共同证词审计结果</button>
                </div>
              ) : !caseSolved ? (
                <>
                  <header><span>FINAL INFERENCE / 第一次结案</span><b>{found.length}/15 条记录已钉入</b></header>
                  <div className="case-warning">不再填写标准答案。完成调查后，终端会从已登记记录中自动形成事实；你只需要为两条主张各连接两份独立来源。</div>
                  <div className="conclusion-rail">
                    <article className={found.includes("voice") ? "confirmed" : ""}><span>01</span><div><b>同一句女声同时出现在两间物理隔离的房间。</b><p>{found.includes("voice") ? "已由双通道报告确认" : "等待声场回放记录"}</p></div></article>
                    <article className={found.includes("coldRoom") ? "confirmed" : ""}><span>02</span><div><b>017 最初是共同记忆校准批次，不是病床号码。</b><p>{found.includes("coldRoom") ? "已由冷库领用单确认" : "等待批次记录"}</p></div></article>
                    <article className={found.includes("pager") ? "confirmed" : ""}><span>03</span><div><b>沈雁失去意识后，寻呼网关继续使用她的第一人称口吻。</b><p>{found.includes("pager") ? "已由 04:21 上传包确认" : "等待设备记录"}</p></div></article>
                  </div>
                  <div className="link-board surface">
                    <article><span>证据链 A</span><h3>事故通报在事故前已经写好。</h3><div><EvidenceSlot label="文件日期" found={found} value={links.premeditated[0]} onChange={(value) => setLink("premeditated", 0, value)} /><b>＋</b><EvidenceSlot label="真实时间线" found={found} value={links.premeditated[1]} onChange={(value) => setLink("premeditated", 1, value)} /></div></article>
                    <article><span>证据链 B</span><h3>沈雁失去意识后，仍有系统继续使用她的声音和口吻。</h3><div><EvidenceSlot label="空间记录" found={found} value={links.continuation[0]} onChange={(value) => setLink("continuation", 0, value)} /><b>＋</b><EvidenceSlot label="设备记录" found={found} value={links.continuation[1]} onChange={(value) => setLink("continuation", 1, value)} /></div></article>
                  </div>
                  <button className="submit-case" disabled={found.length < 6 || !found.includes("loop") || !found.includes("coldRoom")} onClick={submitCase}>提交第一次完整推断</button>
                </>
              ) : !containmentDone ? (
                <div className={`containment-sequence ${containmentActive ? "active" : ""} danger-${containmentTimer <= 6 ? "high" : containmentTimer <= 11 ? "mid" : "low"}`}>
                  <header>
                    <div><span>UNAUTHORIZED WRITEBACK / 反向写入</span><h2>{containmentPlans[role].title}</h2></div>
                    <time>{containmentActive ? `00:${String(containmentTimer).padStart(2, "0")}` : "待执行"}</time>
                  </header>
                  <div className="containment-body">
                    <section className="containment-monitor">
                      <img
                        src={asset(containmentTimer <= 8 ? "/cctv-duplicate-witness.png" : "/corridor-day7.webp")}
                        alt={containmentTimer <= 8 ? "同一名人员同时出现在镜头近处与走廊远端" : "B2 东廊实时监控"}
                      />
                      <div><span>CAM B2-E / LIVE BUFFER</span><b>WRITEBACK {containmentActive ? "ACTIVE" : "PAUSED"}</b></div>
                      {containmentActive && <i style={{ width: `${Math.max(0, (containmentTimer / 17) * 100)}%` }} />}
                      {containmentTimer <= 6 && <p>摄像机前：1　走廊内：1　身份：相同</p>}
                    </section>
                    <section className="containment-console">
                      <div className="containment-brief">
                        <span>人员专属应急备忘</span>
                        <p>{containmentPlans[role].briefing}</p>
                        <b>已执行 {containmentStep}/3　{containmentFailures ? `／ 回滚 ${containmentFailures} 次` : ""}</b>
                      </div>
                      {!containmentActive ? (
                        <button className="containment-start" onClick={() => {
                          setContainmentTimer(17);
                          setContainmentStep(0);
                          setContainmentActive(true);
                          setToast("17 秒后，本次访问将被写回 2001 年馆藏。");
                          beep(92, 0.5);
                        }}>{containmentFailures ? "重新执行应急程序" : "接管应急控制台"}</button>
                      ) : (
                        <div className="containment-actions">
                          {containmentPlans[role].actions.map((action) => {
                            const complete = containmentPlans[role].sequence.slice(0, containmentStep).includes(action.id);
                            return (
                              <button key={action.id} disabled={complete} onClick={() => performContainment(action.id)}>
                                <span>{complete ? "已完成" : "执行"}</span>
                                <div><b>{action.label}</b><p>{action.detail}</p></div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>
                  <footer><span>提示：步骤顺序来自你所选角色的私人记录，不同身份不会获得相同控制权限。</span><b>{containmentTimer <= 6 ? "不要看监控。继续操作。" : "反向写入目标：当前访问者"}</b></footer>
                </div>
              ) : !finale ? (
                <div className="protocols">
                  <header><span>推断成立。017 要求调查员决定下一步。</span><b>选择不可撤回（本地快照除外）</b></header>
                  <button onClick={() => setFinale("publish")}><span>01</span><div><b>公开全部原始档案</b><p>保存事实，也公开所有仍在世对象的身份。</p></div></button>
                  <button onClick={() => setFinale("erase")}><span>02</span><div><b>执行林桥的物理擦除</b><p>终止模型，也销毁唯一能自证的证词。</p></div></button>
                  <button onClick={() => setFinale("ask")}><span>03</span><div><b>把停机权限交给 017</b><p>承认模型具备选择权，但它的选择可能不是你的。</p></div></button>
                </div>
              ) : endingCopy && (
                <div className="ending">
                  <span>SESSION CLOSED / {roles[role].code}</span>
                  <h2>{endingCopy.title}</h2>
                  <p>{endingCopy.body}</p>
                  <blockquote>{endingCopy.fate}</blockquote>
                  <div><b>补充核验：{hiddenTaskDone ? "完成" : "未完成"}</b><small>{roles[role].task}</small></div>
                  <button onClick={() => setFinale(null)}>返回协议选择</button>
                  <button className="exit-protocol" onClick={enterSecondLoop}>结束调查并退出系统</button>
                  <small className="ending-time">结案用时：00:04:17　/　后台进程仍有 1 项</small>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className={`case-sidebar ${showEvidence ? "open" : ""}`}>
          <WindowBar title="CASE_NOTES.TXT" onClose={() => setShowEvidence(false)} />
          <div className="active-identity">
            <Portrait index={roles[role].index} alt="" />
            <div><span>{roles[role].code}</span><b>{roles[role].name}</b><p>{roles[role].title}</p></div>
          </div>
          <div className="task-note"><b>人员关联核验</b><p>{roles[role].task}</p><span>{hiddenTaskDone ? "■ 已闭合" : "□ 待确认"}</span></div>
          {guideMode && (
            <section className="guide-panel">
              <header>
                <span>未闭合审查项 / {guideProgress}/{guideLeads.length}</span>
                <button onClick={() => setGuideMode(false)}>隐藏</button>
              </header>
              <div className="guide-progress"><i style={{ width: `${(guideProgress / guideLeads.length) * 100}%` }} /></div>
              <small>索引建议，不限制资料读取顺序</small>
              <h3>{activeLead.title}</h3>
              <p>{activeLead.why}</p>
              <div className="guide-apps">
                {activeLead.apps.map((id) => (
                  <button key={id} onClick={() => openApp(id)}>
                    {apps.find((app) => app.id === id)?.icon}　{apps.find((app) => app.id === id)?.label}
                  </button>
                ))}
              </div>
              {activeHintLevel > 0 && <div className={`guide-hint level-${activeHintLevel}`}><span>检索建议 {activeHintLevel}/3</span><p>{activeLead.hints[activeHintLevel - 1]}</p></div>}
              <div className="guide-actions">
                <button disabled={activeHintLevel >= 3} onClick={() => {
                  setHintForLead(activeLead.id);
                  setHintLevel((level) => hintForLead === activeLead.id ? Math.min(3, level + 1) : 1);
                }}>
                  {activeHintLevel === 0 ? "请求检索建议" : activeHintLevel < 3 ? "展开操作建议" : "维护步骤已展开"}
                </button>
                {activeHintLevel > 0 && <button onClick={() => setHintLevel(0)}>收起</button>}
              </div>
              {parallelLead && <footer><span>也可以并行调查</span><b>{parallelLead.title}</b></footer>}
            </section>
          )}
          {found.length >= 5 && horrorMax && <div className="foreign-note"><span>不是你写的：</span><p>{secondLoop === 2 ? "“我已经替你选过这个角色。你为什么又选了一次？”" : "“别把便笺留给下一个我。”"}</p></div>}
          <div className="evidence-stack">
            <header><span>已钉入记录</span><b>{found.length}/15</b></header>
            {Object.entries(evidenceInfo).map(([id, item]) => (
              <button key={id} className={found.includes(id) ? "found" : ""} onClick={() => found.includes(id) && setToast(item.detail)}>
                <span>{found.includes(id) ? item.code : "???"}</span><p>{found.includes(id) ? item.title : "记录尚未关联"}</p>
              </button>
            ))}
          </div>
          <div className="achievement-strip">
            <span className={found.includes("css") && found.includes("hiddenRev") ? "earned" : ""}>代码破坏者</span>
            <span className={found.length >= 12 ? "earned" : ""}>信息收集癖</span>
            <span className={corridorMarks.length === 7 ? "earned" : ""}>第八次巡检</span>
            <span className={brokeProtocolEarly ? "earned" : ""}>不按剧本</span>
          </div>
          <label className="notepad"><span>审查员工作便笺 / 本机暂存</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="写下人物、时间与矛盾。系统不会替你整理。"/></label>
        </aside>
      </section>

      <footer className="taskbar">
        <button className="start-button" onClick={() => setShowEvidence((value) => !value)}>▣ 案卷</button>
        <div className="task-tabs">{apps.filter((app) => app.id === activeApp).map((app) => <button key={app.id}>{app.icon} {app.label}</button>)}</div>
        <span>{toast}</span>
        <time>{secondLoop === 2 ? sessionDate : "2001/07/17"}　04:17</time>
      </footer>

      {showDeskIntro && (
        <div className="desk-intro-backdrop">
          <section className="desk-intro">
            <WindowBar title={`WORKSPACE MOUNT — ${roles[role].code}`} onClose={() => setShowDeskIntro(false)} />
            <div className="desk-intro-body">
              <div className="desk-role">
                <Portrait index={roles[role].index} alt={`${roles[role].name} 身份照片`} />
                <div><span>人员索引摘要</span><h2>{roles[role].name}</h2><p>{roles[role].task}</p></div>
              </div>
              <div className="desk-rules">
                <article><b>01 / 工作区</b><p>左侧九个资料工具可按任意顺序打开。闪烁边框表示索引服务建议的入口。</p></article>
                <article><b>02 / 关联记录</b><p>关键操作会把可交叉验证的记录登记到右侧案卷，原始条目仍保留在各自系统中。</p></article>
                <article><b>03 / 检索服务</b><p>索引服务会逐层展开维护建议；前两层只提供方向，第三层显示具体操作。</p></article>
              </div>
              <div className="first-lead">
                <span>建议从一个矛盾开始</span>
                <h3>{activeLead.title}</h3>
                <p>{activeLead.why}</p>
              </div>
              <div className="desk-intro-actions">
                <button onClick={() => setShowDeskIntro(false)}>关闭说明</button>
                <button className="primary" onClick={() => { setShowDeskIntro(false); setShowEvidence(true); openApp(activeLead.apps[0]); }}>
                  打开索引入口：{apps.find((app) => app.id === activeLead.apps[0])?.label} →
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {viewer && (
        <div className="media-viewer" onClick={() => setViewer(null)}>
          <div onClick={(event) => event.stopPropagation()}>
            <WindowBar title={viewer === "cctv" ? "CCTV_B2_0417.FRAME" : viewer === "consent" ? "CONSENT_017.SCAN" : "FIRE_RECOVERY_06.JPG"} onClose={() => setViewer(null)} />
            <img src={asset(viewer === "cctv" ? "/cctv-b2.webp" : viewer === "consent" ? "/consent-017.webp" : "/evidence-table.webp")} alt="放大的档案证据" />
            <p>{viewer === "cctv" ? "画面时钟停在 04:17；推车标签为 017。" : viewer === "consent" ? "三枚指纹。对象名称栏没有姓名。" : "六件物品中，官方清单只登记了四件。"}</p>
          </div>
        </div>
      )}

      {haunt && (
        <div className={`haunt-layer haunt-day-${corridorDay}`} role="alert">
          <img src={asset("/cctv-b2.webp")} alt="" />
          <div><span>馆藏系统后台通知 / 无来源</span><p>{haunt}</p><i>该通知已自动写入 2001-07-17 的阅读日志。</i></div>
        </div>
      )}
      {showShock && (
        <div className="earned-shock" role="alert" aria-label="监控画面出现同一人物的近距离与远距离影像">
          <img src={asset("/cctv-duplicate-witness.png")} alt="同一名女性同时贴近摄像机并站在走廊尽头" />
          <div><span>CAM B2-E / BUFFER -01</span><b>人脸：02　身体：01</b></div>
        </div>
      )}
    </main>
  );
}
