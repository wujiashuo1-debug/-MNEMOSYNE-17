import type { Metadata } from "next";
import type { CSSProperties } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const gameHref = `${basePath}/`;

export const metadata: Metadata = {
  title: "调查员手册 / MNEMOSYNE-17 全流程攻略",
  description: "MNEMOSYNE-17 的完整流程、谜题答案、证据位置、结局条件与隐藏成就说明。",
};

const surfaceEvidence = [
  ["WEB-01", "闭站公告的旧日期", "选择任意角色并完成三段身份记忆验证后自动获得；也可在旧内网首页点击“关于地下二层线路事故的情况说明”。"],
  ["WEB-02", "被删除的 1998 快照", "旧内网 → 人员名录。把地址 people.htm?rev=2001 改为 people.htm?rev=1998，按回车或点“转到”。"],
  ["DB-03", "冷库药品批次", "档案检索输入“冷库”，打开 M-017《冷库领用单 / 批次 017》。"],
  ["DB-04", "04:21 上传包", "档案检索输入“04:17”，打开 PKT-31《VIS-31 / 延迟上传包》。"],
  ["LOG-05", "六分十四秒漂移", "门禁校时 → 执行漂移校正 → 直接点选 B2 门禁 04:12:00 / 实际 04:05:46 那一行 → 登记所选记录。"],
  ["AUD-06", "同时出现的女声", "声场回放拖到 00:14—00:19，分别监听“观察室”和“服务器室”，再生成双通道重叠报告。"],
  ["IMG-07", "被擦除的第三人", "图像对照拖动遮罩到中部，直接点击中央人物所在的差分区域，再记录差分。"],
  ["DOC-08", "017 同意书", "档案检索输入“冷库”，打开 C-017《复合同意书》。"],
  ["DOM-09", "打印样式中的批注", "样式检查：把 --mask 调到 0.12 以下，把 --ghost-size 调到 11px 以上。"],
  ["WEB-10", "不存在的访客留言", "旧内网 → 访客留言 → 点击“检查留言来源”。"],
  ["CCTV-11", "七次相同的巡廊", "完成“每日巡廊”全部七段画面标注与文字记录，标注表见下方。"],
] as const;

const corridorAnswers = [
  ["第 1 天", "标记左上墙钟；记录“04:17”", "建立所有片段共用的时间基线。"],
  ["第 2 天", "标记右侧档案车；写明“车声移动但车未移动”", "轮声移动了，但画面中的档案车没有移动。"],
  ["第 3 天", "标记尽头凸面镜；记录“镜中人脸”", "走廊检测为 0，镜中却被人脸检测到 1 人。"],
  ["第 4 天", "标记 106 门；记录“图纸为实心墙”", "106 后出现了建筑图纸不承认的空间。"],
  ["第 5 天", "标记凸面镜；记录“查看时才渲染”", "系统先检测到“被观看”，才渲染镜中人物。"],
  ["第 6 天", "标记任一门窗人脸；记录“门禁显示无人”", "门后声纹与空房记录冲突。"],
  ["第 7 天", "标记 106；记录“同一走廊递归”", "普通摄像机无法拍到无限递归的自身画面。"],
] as const;

const auditEvidence = [
  ["ARC-12", "1984 归巢班合影", "系统审计 → 身份代际地址。把 generation=3 改为 generation=0，保留 subject=017，然后点“转到”。"],
  ["MFT-13", "晚于登录的旧档案", "系统审计 → 文件分配序列 → 点击“改按底层分配序列排序”。"],
  ["BIO-14", "三种人生，一枚声纹", "先取得 ARC-12，再在声纹区点击“以 generation=0 校正年龄并叠合”。"],
  ["SYS-15", "REMOTE/017", "先完成文件排序和声纹叠合，再在当前会话区点击“用完整审计链解密对象字段”。"],
] as const;

function ManualSection({
  id,
  number,
  title,
  summary,
  children,
  danger = false,
}: {
  id: string;
  number: string;
  title: string;
  summary: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <details id={id} className={`manual-section ${danger ? "danger" : ""}`}>
      <summary>
        <span>{number}</span>
        <div><h2>{title}</h2><p>{summary}</p></div>
        <i>展开</i>
      </summary>
      <div className="manual-section-body">{children}</div>
    </details>
  );
}

export default function GuidePage() {
  return (
    <main className="manual-shell" style={{ "--archive-image": `url("${basePath}/archive-b2.png")` } as CSSProperties}>
      <div className="crt-lines" aria-hidden="true" />
      <header className="manual-topbar">
        <a href={gameHref}>← 返回游戏</a>
        <span>MNEMOSYNE-17 / INVESTIGATOR MANUAL</span>
        <b>完整剧透档案</b>
      </header>

      <section className="manual-hero">
        <div>
          <span>UNSEALED DOCUMENT / REV. 017</span>
          <h1>调查员<br /><em>全流程手册</em></h1>
          <p>从匿名磁盘到 REMOTE/017：所有谜题答案、证据位置、第一次结案、审计层真相、角色隐藏任务与成就条件。</p>
        </div>
        <aside>
          <b>剧透警告</b>
          <p>下方会直接公开谜底和真结局。第一次游玩建议先使用游戏内三层提示，卡住后再展开对应章节。</p>
          <a href="#quick-route">先看最短通关路线 ↓</a>
        </aside>
      </section>

      <nav className="manual-index" aria-label="攻略目录">
        <a href="#start">开局与角色</a>
        <a href="#surface">表层证据</a>
        <a href="#corridor">七日巡廊</a>
        <a href="#first-case">第一次结案</a>
        <a href="#audit">审计层</a>
        <a href="#true-case">真结局</a>
        <a href="#achievements">成就</a>
      </nav>

      <section id="quick-route" className="quick-route">
        <header><span>QUICK ROUTE</span><h2>最短完整通关路线</h2></header>
        <ol>
          <li><b>看事故录像：</b>完整播放 01:06 的内部说明片，挂载身份索引，再打开所选人员的 3 份关联记录。</li>
          <li><b>拿表层证据：</b>优先取得 WEB-02、DB-03、DB-04、LOG-05、AUD-06、IMG-07、DOM-09。</li>
          <li><b>跑完巡廊：</b>在七段画面上落点并提交文字巡检记录，取得 CCTV-11。</li>
          <li><b>第一次结案：</b>三题答案为“模型生成 / 调和模型 / BP 上传包”；证据对为 WEB-01＋LOG-05、AUD-06＋DB-04。</li>
          <li><b>选择任一道德协议：</b>观看结局后点击“结束调查并退出系统”，进入 DAY 2。</li>
          <li><b>完成审计：</b>generation=0、文件排序、声纹叠合、解密 REMOTE/017。</li>
          <li><b>最终反证：</b>ARC-12＋BIO-14、MFT-13＋SYS-15；动机选“采集发现真相后的道德反应”。</li>
        </ol>
      </section>

      <section className="manual-content">
        <ManualSection id="start" number="01" title="开局、角色与私人任务" summary="角色不改变谜题答案，但会改变叙事视角、私人任务和结局余波。">
          <div className="manual-copy">
            <h3>进入游戏</h3>
            <p>播放并看完开场内部说明录像。录像会说明归巢实验、B2 事故、三份冲突身份记录与磁盘再次写入的时间线；播放结束后才能挂载人员索引。</p>
            <p>角色选择后必须打开该角色的三段矛盾记忆，才能挂载身份。选择完成后会自动取得第一条证据 WEB-01。</p>
            <h3>三个角色的隐藏任务</h3>
            <div className="role-task-grid">
              <article><span>LQ-06</span><b>林桥 / 研究员</b><p>取得 DOM-09“打印样式中的批注”即可完成私人任务。</p></article>
              <article><span>VIS-31</span><b>沈雁 / 记者</b><p>搜索过“冷库”，并取得 DB-04“04:21 上传包”。</p></article>
              <article><span>NET-12</span><b>方铎 / 黑客</b><p>取得 WEB-02“被删除的 1998 快照”。</p></article>
            </div>
            <div className="manual-note">私人任务只影响第一次结局中的角色余波，不会阻止真结局。</div>
          </div>
        </ManualSection>

        <ManualSection id="surface" number="02" title="11 条表层证据完整位置" summary="第一次结案只要求至少 8 条，但收齐能补全人物关系和成就。">
          <div className="evidence-manual">
            {surfaceEvidence.map(([code, title, method]) => (
              <article key={code}><span>{code}</span><div><h3>{title}</h3><p>{method}</p></div></article>
            ))}
          </div>
          <div className="manual-note">档案检索只支持原词匹配。有效关键词包括：停电、冷库、方宁、04:17、蓝门、沈雁、倒影。</div>
        </ManualSection>

        <ManualSection id="corridor" number="03" title="七日巡廊标注表" summary="七段可以任意顺序完成；每段需要画面落点与包含关键事实的短记录。">
          <div className="corridor-manual">
            {corridorAnswers.map(([day, answer, reason]) => (
              <article key={day}><span>{day}</span><b>{answer}</b><p>{reason}</p></article>
            ))}
          </div>
        </ManualSection>

        <ManualSection id="first-case" number="04" title="第一次完整推断与三个道德结局" summary="需要至少 8 条证据、CCTV-11，以及正确的三题和两组证据对。" danger>
          <div className="manual-copy">
            <h3>三道推断题</h3>
            <ol>
              <li>04:16 的沈雁为何同时出现在两间房？<b>一个声音来自模型生成。</b></li>
              <li>“017”最初指代什么？<b>三份记忆的调和模型。</b></li>
              <li>本人失去意识后仍继续叙述的证据？<b>04:21 BP 机上传包。</b></li>
            </ol>
            <h3>证据对</h3>
            <ul>
              <li>事故通报提前写好：<b>WEB-01 闭站公告</b> ＋ <b>LOG-05 门禁漂移</b></li>
              <li>沈雁继续被使用：<b>AUD-06 同时女声</b> ＋ <b>DB-04 04:21 上传包</b></li>
            </ul>
            <h3>道德协议</h3>
            <div className="ending-grid">
              <article><span>协议一</span><b>公开全部档案</b><p>事实被保存，但所有对象失去匿名。</p></article>
              <article><span>协议二</span><b>执行物理擦除</b><p>模型终止，唯一能够自证的证词也消失。</p></article>
              <article><span>协议三/四</span><b>把权限交给 017</b><p>证词获得选择权；收集足够证据时会出现更完整的余波。</p></article>
            </div>
            <div className="manual-note important">看完任一结局后，必须点击“结束调查并退出系统”。这不是退出按钮，而是进入第二轮审计层的入口。</div>
          </div>
        </ManualSection>

        <ManualSection id="audit" number="05" title="DAY 2：系统审计的四条根证据" summary="第二轮不再调查事故，而是调查这些证据是否在你点击之前存在。" danger>
          <div className="evidence-manual">
            {auditEvidence.map(([code, title, method]) => (
              <article key={code}><span>{code}</span><div><h3>{title}</h3><p>{method}</p></div></article>
            ))}
          </div>
          <div className="manual-copy">
            <h3>不按剧本路线</h3>
            <p>系统审计从第一轮开始就可以打开。若在第一次道德结局前收齐 ARC-12、MFT-13、BIO-14、SYS-15，会触发“UNSCHEDULED INFERENCE”，并解锁“不按剧本”成就。</p>
          </div>
        </ManualSection>

        <ManualSection id="true-case" number="06" title="第二次反证与真结局" summary="把三名成人的来源与当前访问者的身份分别连接起来。" danger>
          <div className="manual-copy">
            <h3>提交条件</h3>
            <p>至少钉入 12/15 条记录，并已取得 CCTV-11。推荐先完成表层结案，再收齐四条审计证据。</p>
            <h3>两组最终反证</h3>
            <ul>
              <li>三名成人是同一生命的三种预测：<b>ARC-12 归巢班合影</b> ＋ <b>BIO-14 同一枚声纹</b></li>
              <li>真正实验对象是当前访问者：<b>MFT-13 文件分配序列</b> ＋ <b>SYS-15 REMOTE/017</b></li>
            </ul>
            <h3>最后一题</h3>
            <p>系统故意留下矛盾的原因选择：<b>“发现真相后的道德选择，才是它要采集的反应。”</b></p>
            <blockquote>真相：林桥、沈雁与方铎并非三名真实成人，而是一名八岁儿童对三种成年人生的预测。事故档案会在玩家选择身份后生成；系统真正等待的是有人主动收养这段记忆。</blockquote>
            <div className="manual-note important">真结局后点击“把椅子留给下一位访问者”会清除普通存档，但保留系统伤痕。下一次角色页会认识 REMOTE/017。</div>
          </div>
        </ManualSection>

        <ManualSection id="achievements" number="07" title="隐藏成就与全收集" summary="四项成就都不会阻止通关，其中一项需要提前闯入审计层。">
          <div className="achievement-manual">
            <article><b>代码破坏者</b><p>同时取得 DOM-09 与 WEB-02。</p></article>
            <article><b>信息收集癖</b><p>钉入至少 12 条证据。</p></article>
            <article><b>第八次巡检</b><p>完成七日巡廊全部 7 段。</p></article>
            <article><b>不按剧本</b><p>第一次结案前收齐四条审计证据。</p></article>
          </div>
        </ManualSection>
      </section>

      <footer className="manual-footer">
        <div><span>END OF UNSEALED DOCUMENT</span><p>攻略读完了。现在的问题不是你是否知道答案，而是你会替谁承担它。</p></div>
        <a href={gameHref}>返回 MNEMOSYNE-17 →</a>
      </footer>
    </main>
  );
}
