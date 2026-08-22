const strength = (id, name, sets, target, note, weightUnit = "lb") => ({
  id,
  name,
  sets,
  target,
  note,
  type: "strength",
  weightUnit,
});

const core = (id, name, sets, target, note) => ({
  id,
  name,
  sets,
  target,
  note,
  type: "core",
});

const upperCardio = () => ({
  id: "post-cardio",
  name: "力量后有氧",
  sets: 1,
  target: "15-20分钟",
  note: "保持能说短句的强度。晚上游泳时缩短为8-10分钟收尾。",
  type: "cardio",
});

const legCardio = () => ({
  id: "post-cardio",
  name: "腿日轻有氧",
  sets: 1,
  target: "8-12分钟",
  note: "轻松走或单车，不做高坡冲刺，让腿部开始恢复。",
  type: "cardio",
});

const optionalSwim = (note = "以轻松恢复为主，不追速度，也不游到力竭。") => ({
  id: "swim-session",
  name: "晚间游泳",
  sets: 1,
  target: "500米左右",
  note,
  type: "cardio",
  optional: true,
});

window.TRAINING_CYCLE = [
  {
    id: "push-a",
    shortTitle: "推A",
    title: "推A · 胸部主导",
    focus: "胸部优先，保持胸廓稳定，正式组大约保留2次余力。",
    tags: ["胸", "侧肩", "三头"],
    exercises: [
      strength("assisted-dip", "辅助双杠臂屈伸", 3, "8-12次", "挺胸、髋向后，微前倾角度全程不变；肩前侧不舒服就缩短幅度。"),
      strength("chest-press", "坐姿推胸器", 3, "8-12次", "腰贴靠背、胸廓撑开；胸收紧就停，不送肩硬推远。"),
      strength("incline-press", "上斜推胸器", 2, "10-12次", "腰贴、肋骨略收，肘稍抬高沿上胸线推；回程不贪深。"),
      strength("lateral-raise", "侧平举", 3, "12-20次", "微前倾，手肘带动向前、向外、向上；哑铃碰腿即返。", "kg"),
      strength("triceps-pushdown", "绳索下压", 2, "10-15次", "肘部固定在身侧，底端伸肘并短暂停顿。"),
      upperCardio(),
      optionalSwim("轻松游即可。胸肩明显疲劳时降低划水力度或跳过。"),
    ],
  },
  {
    id: "pull-a",
    shortTitle: "拉A",
    title: "拉A · 背阔肌主导",
    focus: "先建立背阔肌张力，再开始拉动；躯干稳定比重量更重要。",
    tags: ["背阔肌", "后束", "二头"],
    exercises: [
      strength("reverse-grip-pulldown", "反握高位下拉", 3, "8-12次", "微前倾，背先预紧再让肘往里下拉；回程收腹不耸肩。"),
      strength("narrow-neutral-row", "窄中立握坐姿划船", 3, "8-12次", "脚主动蹬稳，背先预紧；微前倾向斜下拉，不后仰顶腰。"),
      strength("straight-arm-pulldown", "直臂下压", 2, "12-15次", "手腕扣住、肘微抬，背先预紧；动髋配合但不要甩腰。"),
      strength("rear-delt-extension", "绳索后束伸肩", 2, "15-20次", "轻重量、肩胛下沉固定；回程小，让后束一直有张力。"),
      strength("biceps-curl", "哑铃二头弯举", 2, "10-15次", "上臂保持稳定，完整收缩后控制下放。", "kg"),
      upperCardio(),
      optionalSwim("背部训练后只做轻松游，肩背发沉就减少距离。"),
    ],
  },
  {
    id: "legs-a",
    shortTitle: "腿A",
    title: "腿A · 股四头肌主导",
    focus: "腿部主训练，保持膝盖与脚尖方向一致，不在疲劳时硬加深度。",
    tags: ["股四头肌", "腿后侧", "核心"],
    exercises: [
      strength("leg-press", "坐姿腿举", 3, "8-12次", "全脚掌踩稳，臀部和下背不离开靠垫。"),
      strength("leg-curl", "坐姿腿弯举", 3, "10-15次", "大腿固定，顶峰收紧一秒，再慢慢伸膝。"),
      strength("leg-extension", "腿屈伸", 2, "12-15次", "膝关节对准转轴，顶端收紧，不用惯性踢起。"),
      strength("calf-raise", "小腿提踵", 3, "10-15次", "底部充分拉伸，顶端停顿，脚踝直上直下。"),
      core("crunch", "卷腹", 2, "12-20次", "肋骨靠近骨盆，用腹部卷起，不拉脖子。"),
      legCardio(),
      optionalSwim("蛙泳腿也会参与。腿内侧或膝盖疲劳时轻松游或不游。"),
    ],
  },
  {
    id: "push-b",
    shortTitle: "推B",
    title: "推B · 肩部主导",
    focus: "肩部优先，先稳定再加重；推举已经覆盖前束，不额外堆前平举。",
    tags: ["肩", "上胸", "三头"],
    exercises: [
      strength("shoulder-press", "坐姿哑铃肩推", 3, "8-12次", "腰贴靠背、手腕稳；下到眼睛附近，上端留一点不锁死。", "kg"),
      strength("incline-press", "上斜推胸器", 3, "8-12次", "腰贴、肋骨略收，肘稍抬高沿上胸线推；回程不贪深。"),
      strength("low-cable-fly", "低位绳索夹胸", 2, "12-15次", "滑轮约膝高，收住肋骨，沿弧线夹到鼻子正前方。"),
      strength("lateral-raise", "侧平举", 3, "12-20次", "微前倾，手肘带动向前、向外、向上；哑铃碰腿即返。", "kg"),
      strength("overhead-triceps", "绳索过顶臂屈伸", 2, "10-15次", "上臂固定在头侧，只伸屈手肘，腰部不要反弓。"),
      upperCardio(),
      optionalSwim("肩部训练后以技术和放松为主，不做冲刺。"),
    ],
  },
  {
    id: "pull-b",
    shortTitle: "拉B",
    title: "拉B · 上背主导",
    focus: "以肩胛后缩和上背收紧为主，停止在躯干开始代偿之前。",
    tags: ["上背", "后束", "二头"],
    exercises: [
      strength("neutral-pulldown", "中立握高位下拉", 3, "10-12次", "微前倾、腹部绷紧，拉到口鼻附近；回程留一点张力。"),
      strength("upper-back-row", "中立宽握坐姿划船", 3, "10-15次", "肘打开，肩胛后缩主导；头腰固定，回程只到约三分之二。"),
      strength("reverse-fly", "坐姿反向飞鸟", 3, "12-20次", "手肘与肩同高，脚往前、微前倾；向远、向外展开，不夹背。"),
      strength("hammer-curl", "哑铃锤式弯举", 2, "10-15次", "掌心相对，肘部固定，避免耸肩和甩腰。", "kg"),
      upperCardio(),
      optionalSwim("如果划水时背部持续发酸，当天缩短距离。"),
    ],
  },
  {
    id: "legs-b",
    shortTitle: "腿B",
    title: "腿B · 臀腿后侧主导",
    focus: "臀腿后侧优先，躯干与骨盆保持稳定，腿日结束不硬爬高坡。",
    tags: ["臀", "腿后侧", "核心"],
    exercises: [
      strength("hack-squat", "哈克深蹲", 3, "8-12次", "肩背贴稳，膝盖沿脚尖方向移动，用全脚掌站起。"),
      strength("hip-thrust", "臀推器械", 3, "8-12次", "顶端收紧臀部，不用腰椎过伸换取高度。"),
      strength("leg-curl", "坐姿腿弯举", 3, "10-15次", "控制回程，臀部不要离开坐垫。"),
      strength("calf-raise", "小腿提踵", 2, "12-20次", "每次都完成底部拉伸和顶端收缩。"),
      core("plank", "平板支撑", 2, "30-60秒", "肋骨收住，臀部夹紧，姿势开始变形就结束。"),
      legCardio(),
      optionalSwim("只安排轻松游。蛙泳蹬夹让腿明显疲劳时直接休息。"),
    ],
  },
];

window.WEEKEND_PLANS = {
  saturday: {
    id: "saturday-recovery",
    shortTitle: "恢复",
    title: "休息或轻松游",
    focus: "今天不补力量训练。想游就轻松游，不游也完全正常。",
    tags: ["恢复", "游泳可选"],
    exercises: [
      {
        id: "rest-day",
        name: "恢复日",
        sets: 1,
        target: "放松一天",
        note: "正常走路、吃饭和睡觉，不补做工作日错过的训练。",
        type: "recovery",
      },
      optionalSwim("可选300-500米恢复游，不追速度，游完应该比下水前更轻松。"),
    ],
  },
  sunday: {
    id: "sunday-rest",
    shortTitle: "休息",
    title: "完整休息",
    focus: "至少保留一个完全休息日，让力量和精神状态一起恢复。",
    tags: ["完全休息"],
    exercises: [
      {
        id: "rest-day",
        name: "完整休息",
        sets: 1,
        target: "今天不训练",
        note: "可以轻松散步，但不安排正式力量、有氧或补课。",
        type: "recovery",
      },
    ],
  },
};

window.CYCLE_CONFIG = {
  anchorDate: "2026-08-17",
  anchorIndex: 0,
};
