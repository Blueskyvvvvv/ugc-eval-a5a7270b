'use strict';

// The stored records remain unchanged; these names are only used for display.
const toolNames = {
  'media.extract_clip@1':'抽取视频片段', 'media.extract_frames@1':'采样视频帧',
  'media.detect_shots@1':'检测视频切镜',
  'media.sample_metric@1':'按指标抽取证据帧',
  'vlm.plan_ugc_metric@1':'整理用例检查标准',
  'vlm.inspect_metric@1':'逐项视觉判读并计算分数',
  'media.crop_region@1':'裁剪画面', 'media.resize_view@1':'调整画面大小', 'media.detect_faces@1':'人脸检测',
  'vlm.judge@1':'视觉模型评分（版本 1）', 'vlm.judge@2':'视觉模型评分（版本 2）',
  'media.pair_frames@1':'成对抽帧并生成左右对照图', 'media.cut_frames@1':'按提示词镜头抽帧', 'vlm.observe@1':'视觉模型逐项判读',
  'vlm.inspect@1':'视觉模型一次判读全部维度', 'vlm.score@1':'按评分标准给各维度评分'
};
const checkNames = {identity_edit:'参考人物相似性及编辑要求完成情况', content_preservation:'非编辑内容保留', temporal_continuity:'时间连续性', visual_quality:'相较原视频的画质变化'};
const isVlmTool = tool => /^vlm\.(judge|observe|inspect|score|plan_ugc_metric|inspect_metric)@/.test(tool || '');
const VIDEO_GENERATION_METRICS=['visual_quality','temporal_continuity','product_fidelity','person_identity','task_completion','storyboard','prohibitions'];
const videoMetricName=id=>({visual_quality:'帧内画面质量',temporal_continuity:'运动与时序质量'}[id]||metricName(id));
const isS2ValidationTemplate=t=>t.template_id===`ugc.${t.metric_id}`&&t.version===1;
function checkName(id) {
  const found=(state.flows||[]).flatMap(f=>f.checks?.checks||f.checks?.dimensions||[]).find(c=>c.id===id);
  return found?.name || checkNames[id] || '判断项';
}
const metricNames = {visual_quality:'画面质量', temporal_continuity:'视频连续性', motion_plausibility:'动作合理性', edit_success:'编辑目标达成', content_preservation:'内容保留'};
const fieldNames = {
  id:'名称', name:'名称', display_name:'名称', description:'说明', rationale:'选择说明', score_meaning:'分数含义',
  status:'状态', decision:'判断', overall_decision:'总体判断', score:'分数', overall_score:'总体得分', threshold:'通过阈值', score_range:'评分范围',
  reason:'评分理由', unscorable_reason:'无法评分的原因', material_sufficiency:'材料是否充分', materials_used:'使用的材料', evidence:'评分证据', asset_ref:'证据材料',
  input:'输入', inputs:'输入', output:'生成结果视频', outputs:'输出', result:'结果', data:'结果数据', request:'实际请求', response:'回答',
  sample:'样例材料', cases:'样例', sample_id:'样例', case_id:'样例', dataset_id:'测试集', plan_id:'流程版本', run_id:'运行记录',
  source:'输入视频', source_video:'输入视频', output_video:'生成结果视频', references:'参考图', reference_images:'参考图',
  source_frames:'输入视频采样帧', output_frames:'生成结果采样帧', frames:'采样帧', asset:'素材', image:'图片', video:'视频',
  ideal_example:'理想效果参考', ideal_image:'理想效果图片', ideal_video:'理想效果视频', ideal_video_frames:'理想效果采样帧',
  person_closeup:'人物近景', overview:'全景画面', output_source:'生成结果来源', original_instruction:'实际输入文案', instruction:'实际输入文案',
  prompt:'评价要求', system_prompt:'系统提示词', prompts:'提示词', prompt_ref:'评价要求', system_prompt_ref:'系统提示词',
  sampling:'采样设置', mode:'方式', fps:'采样频率', count:'采样数量', max_frames:'最大采样数', max_images:'最多图片数',
  times_ms:'采样时间', time_ms:'时间', requested_time_ms:'请求时间', actual_time_ms:'实际时间', root_time_ms:'原视频时间', duration_ms:'时长',
  range_ms:'时间范围', source_range_ms:'输入视频范围', output_range_ms:'生成结果范围', requested_range_ms:'请求范围', actual_range_ms:'实际范围',
  box:'裁剪区域（左、上、右、下）', actual_box_px:'实际裁剪区域（像素）', output_face_roi:'人物区域', roi:'画面区域',
  width:'宽度', height:'高度', long_edge:'目标长边', input_size:'输入尺寸', output_size:'输出尺寸', frame_count:'视频帧数', actual_count:'实际采样数', scale:'缩放比例', interpolation:'缩放方法',
  tool:'工具', steps:'步骤', step_id:'步骤', needs:'依赖步骤', optional_needs:'可选依赖步骤', optional_inputs:'可选输入', dimension_ids:'评价指标', expected_dimensions:'评价指标',
  rubric:'评分规则', dimensions:'评价指标', aggregation:'汇总方式', comparison:'比较方式', null_policy:'缺失分数处理', overall_requires_all_dimensions:'总体分数要求全部指标',
  identity_materials:'人物身份材料要求', max_calls:'最多调用次数', max_cost:'费用上限', budget:'运行预算',
  material_policy:'材料策略', insufficient:'材料不足时', missing_closeup:'缺少近景时', missing_inputs:'缺少的材料', rule_ref:'规则来源',
  metadata:'素材信息', annotations:'补充说明', media:'素材', kind:'素材类型', format:'格式', video_transport:'视频输入方式',
  created_at:'创建时间', started_at:'开始时间', ended_at:'结束时间', timestamp:'时间', elapsed_ms:'耗时',
  attempts:'执行尝试', number:'次数', error:'错误说明', code:'错误类型', path:'问题位置', message:'说明', retryable:'可重试', retry_planned:'计划重试', outcome:'结果',
  execution_mode:'运行方式', planning_source:'规划来源', source_type:'来源', model:'模型', backend_profile:'评分模型配置', backend_version:'评分服务版本',
  timeout_seconds:'超时时间', max_payload_bytes:'请求大小上限', ordered_frames:'按顺序提供视频帧', temporal_judgment:'支持时序判断', cost_per_call_upper_bound:'单次费用上限',
  progress:'进度', finished:'已完成', total:'总数', failed:'失败数', summary:'运行汇总', completeness:'完整程度',
  expected_dimension_n:'预期指标数', recorded_dimension_n:'已记录指标数', scorable_dimension_n:'可评分指标数', unscorable_dimension_n:'无法评分指标数',
  protocol_errors:'结果格式问题', templates:'参考实现', version:'版本', template_id:'指标实现', metric_id:'评价指标',
  applicable_tasks:'适用任务', material_roles:'适用材料', input_contract:'输入要求', output_contract:'输出说明', scoring_guidance:'评分建议',
  metrics:'评价指标', metric_reasons:'指标选择理由', open_questions:'待确认事项', feedback:'反馈', task_description:'任务描述',
  payload:'记录内容', transport:'传输信息', coverage:'采样覆盖', parent_mapping:'与原素材的对应关系', dimensions_used:'使用的指标',
  frame:'帧信息', output_time_ms:'输出时间', parent_frame_index:'原视频帧序号', parent_time_ms:'原视频时间', root_frame_index:'源视频帧序号',
  root_pts:'原始时间戳', root_time_base:'原始时间单位', operation:'处理方式', output_to_parent:'到上一级素材的映射', output_to_root:'到原素材的映射',
  parent_asset:'上一级素材', parent_size:'上一级素材尺寸', root_asset:'原素材', root_box_px:'原素材对应区域（像素）', root_size:'原素材尺寸', timeline:'时间对应关系',
  material:'材料', seq:'记录序号', attempt:'尝试次数', denominator:'样例总数', text:'文本', provenance:'来源记录', parameters:'实际参数', runtime_versions:'执行环境版本',
  common_valid_ids:'共同有效样例', common_valid_n:'共同有效样例数', means:'平均分', evidence_by_sample:'各样例证据', mean:'平均分', unscorable_ids:'无法评分的样例', valid_ids:'有效样例', valid_n:'有效样例数',
  available_count:'可用帧数', requested_count:'请求帧数', requested_times_ms:'请求采样时间', requested_to_frame:'请求时间与帧的对应关系', selection:'选择方式',
  duration_seconds:'时长', sufficient:'材料充分', views:'实际使用的画面', input_schema:'输入要求', output_types:'输出内容', input_types:'输入内容',
  response_error:'回答错误', finish_reason:'结束原因', response_model:'响应模型', usage:'用量', completion_tokens:'输出词元数', prompt_tokens:'输入词元数', total_tokens:'词元总数', tool_version:'使用的工具',
  input_refs:'输入来源', optional_input_refs:'可选输入来源', required_missing:'缺少的必填材料', record:'记录', response_contract_version:'回答格式版本',
  output_set_id:'生成结果集合', output_set_ids:'生成结果集合', output_sets:'生成结果', sample_n:'样例数量', plan:'流程配置', common_comparison:'共同样例比较', pairwise_comparisons:'两两比较', content:'内容',
  refs:'材料引用', ref:'材料来源', type:'类型', title:'名称', required:'必填', default:'默认值', minimum:'最小值', maximum:'最大值'
};
const enumNames = {
  queued:'等待执行', planned:'已规划', preparing:'准备样例', planning:'生成流程', trial:'样例试跑中', running:'执行中', completed:'已完成',
  failed:'执行失败', partial_failed:'部分失败', interrupted:'已中断，结果可能未知', cancelled:'已取消', not_run:'未执行', imported:'历史导入',
  ok:'已完成', error:'执行失败', skipped:'已跳过', pass:'通过', fail:'未通过', unscorable:'无法评分', accepted:'已采纳', invalid:'不符合要求', started:'已开始',
  live:'在线请求', chat_completions:'在线请求', recorded:'历史回放', recorded_response:'历史回放', fixtures:'样例回放', synthetic_fixture:'本地测试', uniform:'均匀采样', at_times:'按指定时间采样', fps:'按频率采样',
  sampled_frames:'采样帧', full_frames:'完整视频帧', image:'图片', video:'视频', candidate:'候选版本',
  complete:'已完整核对', incomplete:'有漏项或格式问题', invalid_response:'回答无法采用', frame:'帧', adjacent_pair:'相邻时刻',
  output_video:'生成结果视频', source_video:'输入视频', reference_images:'参考图', ideal_image:'理想效果图片', ideal_video:'理想效果视频',
  nearest_pts_tie_earlier:'选择时间最接近的帧，相同时取较早帧',
  common_valid_sample_ids_per_dimension:'按各指标的共同有效样例比较', exclude_from_dimension_mean:'计算均值时排除无效分数',
  use_full_context_if_sufficient:'全景材料充分时使用全景判断', identity_detail_insufficient:'人物身份细节不足',
  step_started:'开始执行步骤', step_inputs:'记录步骤输入', step_finished:'步骤执行完成', step_failed:'步骤执行失败',
  attempt_started:'开始尝试', attempt_finished:'尝试完成', case_started:'开始处理样例', case_finished:'样例处理完成',
  run_queued:'等待执行', run_started:'开始运行', run_finished:'运行结束', vlm_request:'视觉模型请求',
  unknown:'未知', success:'成功', true:'开启', false:'关闭', extract_frame:'视频采样帧', crop_region:'裁剪画面', resize_view:'调整画面大小', identity:'原样保留', stop:'正常结束',
  'video-vlm-qwen@2':'Qwen 视觉模型（版本 2）'
};
const errorNames = {
  deferred_after_connection_failure:'连续性请求连接失败，尚缺真实回答；本轮已停止重复发送',
  missing_required_input:'缺少必需输入', case_incomplete:'样例评测未完成', unknown_evidence:'引用了未提供的证据',
  invalid_roi:'裁剪区域无效', invalid_range:'时间范围无效', invalid_media:'素材格式无效', invalid_media_role:'素材类型与用途不符',
  invalid_sampled_frames:'采样帧来源或顺序无效', invalid_structure:'数据格式不正确', invalid_request:'请求内容不正确',
  backend_timeout:'模型服务请求超时', backend_unavailable:'模型服务不可用', backend_capacity:'材料超出模型容量',
  backend_capability:'模型服务不支持所需能力', sampling_required:'需要提供视频采样方式',
  decode_failed:'素材解码失败', encode_failed:'素材编码失败', asset_not_found:'素材不存在', record_not_found:'记录不存在',
  idempotency_conflict:'请求与已有记录不一致', record_exists:'记录已存在', trial_incomplete:'样例试跑未完成',
  invalid_response:'模型回答格式不正确', internal_error:'处理失败',
  duration_mismatch:'两段视频时长不一致', frame_gap:'找不到对应时间的帧', instruction_not_decomposed:'流程中没有这条编辑指令的拆解',
  invalid_pairs:'对照图编号或时间无效', missing_references:'缺少参考图', font_unavailable:'缺少中文字体', unknown_check:'未知的判断项',
  sampling_capacity:'采样数量超过上限', previous_call_unknown:'先前请求结果未知，未继续发送', backend_http_error:'模型服务返回错误',
  out_of_range:'时间超出视频范围', unsupported_plan:'流程类型不支持该操作'
};
const hiddenFields = new Set(['sha256','plan_sha256','prompt_sha256','backend_sha256','artifact_sha256','schema_version','call_id','uri','raw_response_ref','root','input_root','profile_id','backend_profile_ref','rubric_ref','idempotency_key','source_plan_sha256','input_asset_id','view_asset_id','input_asset_ids','input_sha256','payload_sha256','response_id','transport_ref','backend_profile_sha256']);
const longTextFields = new Set(['prompt','system_prompt','instruction','original_instruction','reason','unscorable_reason','description','rationale','scoring_guidance','feedback','task_description','score_meaning','message','identity_materials']);
let rawRecords = new Map(), rawSerial = 0;

function toolName(value) { return toolNames[value] || '未识别的工具'; }
function metricName(value) {
  const found = [...(state.metrics||[]),...(state.flow?.metadata?.metrics||[])].find(x=>x.metric_id === value);
  return found?.name && /[\u3400-\u9fff]/.test(found.name) ? found.name : metricNames[value] || '未命名指标';
}
function localizeProse(value) {
  let text=String(value ?? '');
  text=text.replace(/(?<![A-Za-z0-9_])(references|source_frames|output_frames)\.(\d+)(?![A-Za-z0-9_.])/g,
    (_,role,index)=>`${{references:'参考图',source_frames:'输入视频采样帧',output_frames:'生成结果采样帧'}[role]} ${Number(index)+1}`);
  const words={...metricNames, 'media.extract_clip@1':'抽取视频片段','media.extract_frames@1':'采样视频帧','media.crop_region@1':'裁剪画面','media.resize_view@1':'调整画面大小','media.detect_faces@1':'人脸检测','vlm.judge@1':'视觉模型评分','vlm.judge@2':'视觉模型评分',
    'sample.output_face_roi':'生成结果中的人物区域','rubric.identity_materials':'人物身份材料规则','evidence.material':'单条证据材料',
    output_frames:'生成结果采样帧',source_frames:'输入视频采样帧',person_closeup:'人物近景',material_policy:'材料策略',missing_closeup:'缺少近景时',
    rule_ref:'规则来源',insufficient:'材料不足时',unscorable:'无法评分',references:'参考图',materials_used:'使用的材料',max_calls:'最多调用次数',max_images:'最多图片数'};
  const terms=Object.keys(words).sort((a,b)=>b.length-a.length).map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  return text.replace(new RegExp(`(?<![A-Za-z0-9_])(?:${terms})(?![A-Za-z0-9_.])`,'g'),term=>words[term]);
}
function localizeError(value) {
  return localizeProse(value).replace(/(?<![A-Za-z0-9_])box(?![A-Za-z0-9_])/g,'裁剪区域')
    .replace(/\b[a-f0-9]{32,}\b/gi,'[内部记录]').replace(/\b(?:asset|run|trial|generation)-[a-z0-9_-]+/gi,'相关记录');
}
function niceFilename(name, fallback) {
  if (!name) return fallback;
  const base=String(name).split(/[\\/]/).pop();
  if (/^[a-f0-9]{24,}(?:\.[a-z0-9]+)?$/i.test(base) || /^(?:asset|artifact|output|frame|image|video|img)[-_]?[a-f0-9]{12,}/i.test(base) || /^[a-z0-9_-]{40,}(?:\.[a-z0-9]+)?$/i.test(base)) return fallback;
  return base;
}
function entityName(value, kind='样例', index=0) {
  const s=String(value || '');
  let name;
  if (/face|换脸/i.test(s)) name='换脸' + kind;
  else if (/person|换人/i.test(s)) name='换人' + kind;
  else if (/[\u3400-\u9fff]/.test(s) && !/[a-f0-9]{24,}/i.test(s)) name=s;
  else if (/^[A-Za-z][A-Za-z0-9 _.-]{0,35}(?::r\d+)?$/.test(s) && !/^(st\d+|asset|run|trial|generation|sample|case)[-_]/i.test(s) && !/[a-f0-9]{16,}/i.test(s)) name=s.replace(/:r\d+$/,'');
  else name=kind + ' ' + (index + 1);
  const version=/:r(\d+)$/.exec(s);
  if (version) name += '－第 ' + version[1] + ' 版';
  return name;
}
function caseName(caseId) {
  const names=read('case-names',{}), named=state.cases.find(x=>x.case_id===caseId)?.display_name || names[caseId];
  const index=Math.max(0,state.cases.findIndex(x=>x.case_id===caseId));
  const base=named||entityName(caseId,'样例',index);
  const matches=state.cases.filter((x,i)=>(x.display_name||names[x.case_id]||entityName(x.case_id,'样例',i))===base);
  return matches.length>1?`${base}（样例 ${Math.max(0,matches.findIndex(x=>x.case_id===caseId))+1}）`:base;
}
function flowName(planId) {
  const index=Math.max(0,state.flows.findIndex(x=>x.plan.plan_id===planId));
  const match=/^(.*):r(\d+)$/.exec(planId||'');
  const fromJob=state.generation?.request?.plan_id===planId ? state.generation.display_name : null;
  const named=match && (state.flows.find(x=>x.plan.plan_id===planId)?.display_name || fromJob || read('flow-names',{})[match[1]]);
  if(named) {
    const same=state.flows.filter(x=>x.plan.plan_id.endsWith(':r'+match[2]) && (x.display_name||read('flow-names',{})[x.plan.plan_id.replace(/:r\d+$/,'')])===named);
    const suffix=same.length>1?`（流程 ${Math.max(0,same.findIndex(x=>x.plan.plan_id===planId))+1}）`:'';
    return `${named}－第 ${match[2]} 版${suffix}`;
  }
  return entityName(planId,'流程',index);
}
function runName(run, {short=false}={}) {
  if (!run) return '运行记录';
  const index=Math.max(0,(state.runs || []).findIndex(x=>x.run_id===run.run_id));
  const datasetId=run.request?.dataset_id;
  if (datasetId) {
    const dataset=state.datasets.find(x=>x.dataset_id===datasetId);
    const title=dataset?.display_name || read('dataset-names',{})[datasetId] || dataset?.description?.split(/[；。]/)[0] || datasetId;
    if (!dataset?.display_name) return `${title}－批量评测（记录 ${index+1}）`;
    // 列表下方一行已显示运行时间，短名不再重复。
    const repeated=!short && (state.runs || []).filter(x=>x.request?.dataset_id===datasetId).length>1;
    return repeated ? `${title} · ${fmtTime(run.created_at)}` : title;
  }
  const caseId=run.request?.case_id || run.cases?.[0]?.case_id || run.run_id;
  const action=/trial/i.test(run.run_id || '') ? '样例试跑' : '评测运行';
  return `${caseName(caseId)}－${action}（记录 ${index+1}）`;
}
function stepName(step, index=0) {
  const identifier=String(step?.id || step?.step_id || '');
  const name=toolName(step?.tool);
  if (step?.tool==='media.pair_frames@1') return '成对抽帧与左右对照图';
  if (step?.tool==='media.cut_frames@1') return '按提示词镜头抽帧';
  if (step?.tool==='vlm.observe@1') return checkName(step?.inputs?.check_id || step?.request?.inputs?.check_id || identifier.replace(/^observe_/,''))+'判读';
  if (step?.tool==='vlm.inspect@1') return '四个维度一次视觉判读';
  if (step?.tool==='vlm.score@1') return '各维度评分与问题说明';
  if (step?.tool==='vlm.inspect_metric@1') return '逐项视觉判读与程序算分';
  const ref=JSON.stringify(step?.inputs || step?.request?.inputs || {});
  if (/judge|score|评|评分/i.test(identifier) || name.startsWith('视觉模型评分')) {
    const dims=step?.dimension_ids || step?.request?.inputs?.dimension_ids || [];
    return dims.length===1 ? `${metricName(dims[0])}评分` : '视觉模型评分';
  }
  if (/closeup|crop.*face|face.*crop/i.test(identifier)) return '裁剪人物近景';
  if (/extract.*output|output.*frame/i.test(identifier) || (name==='采样视频帧' && /sample\.output_video/.test(ref))) return '采样生成结果帧';
  if (/extract.*source|source.*frame/i.test(identifier) || (name==='采样视频帧' && /sample\.source_video/.test(ref))) return '采样输入视频帧';
  return name==='未识别的工具' ? `步骤 ${index+1}（工具未识别）` : `${name} ${index+1}`;
}
function referenceName(ref, steps=[]) {
  if (typeof ref !== 'string') return '来源未记录';
  const parts=ref.split('.');
  if (parts[0]==='sample') {
    const dict={output_video:'生成结果视频',source_video:'输入视频',reference_images:'参考图',original_instruction:'实际输入文案',output_face_roi:'生成结果中的人物区域',source_range_ms:'输入视频范围',output_range_ms:'生成结果范围',ideal_image:'理想效果图片',ideal_video:'理想效果视频'};
    let result=dict[parts[1]] || '样例材料';
    if (/^\d+$/.test(parts[2] || '')) result += ' ' + (Number(parts[2])+1);
    return result;
  }
  if (parts[0]==='plan') return parts[1]==='rubric' ? '当前流程的评分规则' : '当前流程配置';
  if (parts[0]==='steps') {
    const index=steps.findIndex(s=>(s.id || s.step_id)===parts[1]);
    const step=index>=0?steps[index]:{id:parts[1],tool:''};
    let name=(index>=0?`步骤 ${index+1}－`:'')+stepName(step,Math.max(0,index));
    const n=parts.findIndex(p=>p==='frames');
    if (n>=0) name += /^\d+$/.test(parts[n+1]||'') ? `－采样帧 ${Number(parts[n+1])+1}` : '－全部采样帧';
    const face=parts.findIndex(p=>p==='faces');
    if (face>=0 && /^\d+$/.test(parts[face+1]||'')) name += `－第 ${Number(parts[face+1])+1} 张人脸${parts[face+2]==='crop_box'?'（含边距）':parts[face+2]==='box'?'（紧贴人脸）':''}`;
    if (parts.at(-1)==='preview') name += '－检测预览';
    return name + '的输出';
  }
  if (/^references\.\d+$/.test(ref)) return '参考图 ' + (Number(parts[1])+1);
  if (/^source_frames\.\d+$/.test(ref)) return '输入视频采样帧 ' + (Number(parts[1])+1);
  if (/^output_frames\.\d+$/.test(ref)) return '生成结果采样帧 ' + (Number(parts[1])+1);
  const names={references:'全部参考图',reference_images:'参考图',source:'输入视频',source_video:'输入视频',output:'生成结果视频',output_video:'生成结果视频',source_frames:'输入视频采样帧',output_frames:'生成结果采样帧',person_closeup:'人物近景',overview:'全景画面',box:'裁剪区域',ideal_image:'理想效果图片',ideal_video:'理想效果视频'};
  return names[ref] || '其他材料（详见原始记录）';
}
function fieldName(key, index=0) {
  if (fieldNames[key]) return fieldNames[key];
  if (metricNames[key]) return metricNames[key];
  if (/^[\u3400-\u9fff\s（）()、，：:0-9]+$/.test(key)) return key;
  return `其他信息 ${index+1}`;
}
function displayScalar(value, key, ctx={}) {
  if (value===null || value===undefined) return '未记录';
  if (typeof value==='boolean') return value?'开启':'关闭';
  if (typeof value==='number') {
    if (key==='fps') return `每秒 ${value} 帧`;
    if (key==='max_images') return `${value} 张`;
    if (['count','max_frames','actual_count','frame_count'].includes(key)) return `${value} 帧`;
    if (['width','height','long_edge'].includes(key)) return `${value} 像素`;
    if (key==='timeout_seconds' || key==='duration_seconds') return `${value} 秒`;
    if (key.endsWith('_ms')) return Number.isInteger(value/1000) ? `${value/1000} 秒` : `${value} 毫秒`;
    return String(value);
  }
  const s=String(value);
  if (key==='ref') return referenceName(s,ctx.steps || []);
  if (key==='tool' || (key==='tool_version' && toolNames[s])) return toolName(s);
  if (key==='id' && metricNames[s]) return metricName(s);
  if (['case_id','sample_id'].includes(key)) return caseName(s);
  if (key==='template_id') {
    const named=read('template-names',{})[s];
    const metric=Object.keys(metricNames).find(id=>s.includes(id));
    return named || (metric ? `${metricName(metric)}实现` : '自定义指标实现');
  }
  if (key==='plan_id') return flowName(s);
  if (key==='run_id') return runName((state.runs || []).find(x=>x.run_id===s) || {run_id:s});
  if (key==='step_id') { const i=(ctx.steps||[]).findIndex(x=>(x.id||x.step_id)===s); return stepName(i>=0?ctx.steps[i]:{id:s},Math.max(i,0)); }
  if (key==='prompt_ref' || key==='system_prompt_ref') return key==='prompt_ref'?'见评价要求':'见系统提示词';
  if (key==='rule_ref') return '见评分规则中的材料要求';
  if (key==='code') return errorNames[s] || '未识别的错误类型（详见原始记录）';
  if (key==='message') return localizeError(s);
  if (key==='path') {
    const last=s.split('.').at(-1);
    return fieldNames[last] || '相关字段（详见原始记录）';
  }
  if (enumNames[s]) return enumNames[s];
  if (metricNames[s]) return metricName(s);
  if (/^(sample|plan|steps)\./.test(s) || /^(references|source_frames|output_frames)\.\d+$/.test(s)) return referenceName(s,ctx.steps||[]);
  if (s.startsWith('/api/') || /^[a-f0-9]{32,}$/i.test(s) || /^(asset|run|trial|generation|proposal)-[a-f0-9]{16,}$/i.test(s)) return '已保存，见原始记录';
  if (['prompt','system_prompt','instruction','original_instruction'].includes(key)) return s;
  if (longTextFields.has(key) || /[\u3400-\u9fff]/.test(s)) return localizeProse(s);
  if (key==='model' || key==='format') return s;
  if (/^[A-Za-z][A-Za-z0-9_.:@/-]*$/.test(s)) return '未识别的内容（详见原始记录）';
  return s;
}
function formatScalarArray(arr,key,ctx) {
  if (['input_size','output_size','parent_size','root_size'].includes(key)) return arr.map(String).join(' × ') + ' 像素';
  if (key==='score_range') return arr.map(String).join(' 至 ');
  if (key==='box' || key==='actual_box_px' || key==='roi') return arr.map(String).join('，');
  if (key.endsWith('_ms')) return arr.map(x=>displayScalar(x,key,ctx)).join(' 至 ');
  if (['needs','optional_needs'].includes(key)) return arr.map(x=>displayScalar(x,'step_id',ctx)).join('、');
  if (['dimension_ids','expected_dimensions'].includes(key)) return arr.map(metricName).join('、');
  if (key==='materials_used' || key==='missing_inputs') return arr.map(x=>referenceName(x,ctx.steps||[])).join('、');
  return arr.map(x=>displayScalar(x,key,ctx)).join('、');
}
function renderValue(value, key='', ctx={}) {
  if (value===null || value===undefined) return '<span class="dim">未记录</span>';
  if (typeof value==='string' && ['response','raw_response','assistant_response','content'].includes(key) && /^[\[{]/.test(value.trim())) {
    try { return renderValue(JSON.parse(value),key,ctx); } catch { /* Keep non-JSON answers readable. */ }
  }
  if (Array.isArray(value)) {
    if (!value.length) return '<span class="dim">无</span>';
    if (value.every(x=>x===null || typeof x!=='object')) return `<span>${escapeHtml(formatScalarArray(value,key,ctx))}</span>`;
    return `<div class="structured-list">${value.map((v,i)=>`<div class="structured-item"><strong>${escapeHtml((key==='steps' || v?.tool && (v?.id || v?.step_id)) ? `步骤 ${i+1} · ${stepName(v,i)}` : key==='dimensions' && v?.id ? metricName(v.id) : `${fieldName(key)} ${i+1}`)}</strong>${renderValue(v,key,ctx)}</div>`).join('')}</div>`;
  }
  if (typeof value==='object') {
    if (key==='prompts') return `<div class="structured-list">${Object.entries(value).map(([ref,text],i)=>`<div class="structured-item"><strong>${ref.toLowerCase().includes('system')?'系统提示词':'评价要求'} ${i+1}</strong>${renderValue(text,ref.toLowerCase().includes('system')?'system_prompt':'prompt',ctx)}</div>`).join('')}</div>`;
    if (value.ref && Object.keys(value).length===1) return `<span>${escapeHtml(referenceName(value.ref,ctx.steps || []))}</span>`;
    if (typeof value.uri==='string' && value.uri.startsWith('/api/') && value.kind) return `<span>${escapeHtml(value.kind==='image'?'图片素材':value.kind==='video'?'视频素材':'已保存素材')}</span>${value.metadata ? renderValue(value.metadata,'metadata',ctx) : ''}`;
    const hasSize=typeof value.width==='number' && typeof value.height==='number';
    const entries=Object.entries(value).filter(([k])=>!hiddenFields.has(k) && k!=='asset_id' && k!=='id' && k!=='prompt_ref' && k!=='system_prompt_ref' && !(hasSize && (k==='width'||k==='height')));
    if (!entries.length && !hasSize) return '<span class="dim">无其他信息</span>';
    return `<dl class="fields-list">${hasSize?`<div class="field-row"><dt>画面尺寸</dt><dd>${escapeHtml(value.width)} × ${escapeHtml(value.height)} 像素</dd></div>`:''}${entries.map(([k,v],i)=>`<div class="field-row"><dt>${escapeHtml(fieldName(k,i))}</dt><dd>${renderValue(v,k,ctx)}</dd></div>`).join('')}</dl>`;
  }
  const text=displayScalar(value,key,ctx);
  return longTextFields.has(key) || text.includes('\n') ? `<div class="long-text">${escapeHtml(text)}</div>` : `<span>${escapeHtml(text)}</span>`;
}
function rawDownload(value, title='原始记录') {
  const key=String(++rawSerial); rawRecords.set(key,value);
  return `<button class="link-button raw-download" data-action="download-record" data-record="${key}" data-filename="${escapeHtml(title)}">下载原始记录</button>`;
}
function pruneRawRecords() {
  const used=new Set([...document.querySelectorAll('[data-record]')].map(x=>x.dataset.record));
  for(const key of rawRecords.keys())if(!used.has(key))rawRecords.delete(key);
}
function structuredDetail(title,value,open=false,ctx={}) {
  return `<details ${open?'open':''}><summary>${escapeHtml(title)}</summary>${linkAssets(value,ctx)}${responseLinks(value)}${renderValue(value,'',ctx)}${rawDownload(value,title)}</details>`;
}
function mediaKindLabel(asset, index) {
  return niceFilename(asset.name, `${asset.kind==='image'?'已上传图片':'已上传视频'} ${index+1}`);
}
function referenceOptions(key,steps,index) {
  const earlier=steps.slice(0,index);
  const clips=earlier.filter(s=>s.tool==='media.extract_clip@1').map(s=>`steps.${s.id}.data.asset`);
  const images=earlier.filter(s=>s.tool==='media.crop_region@1'||s.tool==='media.resize_view@1').map(s=>`steps.${s.id}.data.asset`);
  const frames=earlier.filter(s=>s.tool==='media.extract_frames@1');
  const frameImages=frames.map(s=>`steps.${s.id}.data.frames.0.asset`);
  const frameLists=frames.map(s=>`steps.${s.id}.data.frames`);
  const faceBoxes=earlier.filter(s=>s.tool==='media.detect_faces@1').flatMap(s=>[`steps.${s.id}.data.faces.0.crop_box`,`steps.${s.id}.data.faces.0.box`]);
  if (['video','source','output','ideal_video'].includes(key)) return ['sample.output_video','sample.source_video','sample.ideal_video',...clips];
  if (['image','person_closeup','ideal_image'].includes(key)) return ['sample.ideal_image',...frameImages,...images];
  if (key==='references')return ['sample.reference_images'];
  if (['source_frames','output_frames','ideal_video_frames','overview'].includes(key))return frameLists;
  if (key==='instruction')return ['sample.original_instruction'];
  if (key==='rubric')return ['plan.rubric'];
  if (key==='box')return ['sample.output_face_roi',...faceBoxes];
  if (key==='range_ms')return ['sample.source_range_ms','sample.output_range_ms',...earlier.filter(s=>s.tool==='media.detect_shots@1').map(s=>`steps.${s.id}.data.segments.0.range_ms`)];
  return [];
}
function editFieldName(key,index=0) {
  const units={fps:'采样频率（每秒帧数）',count:'采样数量（帧）',max_frames:'最大采样数（帧）',max_images:'最多图片数（张）',
    times_ms:'采样时间（毫秒）',range_ms:'时间范围（毫秒）',source_range_ms:'输入视频范围（毫秒）',output_range_ms:'生成结果范围（毫秒）',
    width:'宽度（像素）',height:'高度（像素）',long_edge:'目标长边（像素）',timeout_seconds:'超时时间（秒）',
    box:'裁剪区域（左、上、右、下；坐标范围 0 至 1）'};
  return units[key] || (key.endsWith('_ms')?`${fieldName(key,index)}（毫秒）`:fieldName(key,index));
}
function editableValue(value,path=[],key='',ctx={}) {
  const encoded=escapeHtml(JSON.stringify(path));
  if (value===null || value===undefined) return '<span class="dim">未设置</span>';
  if (Array.isArray(value)) {
    if (['needs','optional_needs','dimension_ids','expected_dimensions'].includes(key)) {
      const choices=key.includes('dimension') ? [...new Set([...value,...(state.metrics||[]).map(x=>x.metric_id),...(state.flow?.metadata?.metrics||[]).map(x=>x.metric_id)])] : [...new Set([...value,...(ctx.steps||[]).map(x=>x.id)])];
      return `<select multiple size="${Math.min(5,Math.max(2,choices.length))}" data-edit-type="list" data-edit-path="${encoded}">${choices.map(x=>`<option value="${escapeHtml(x)}" ${value.includes(x)?'selected':''}>${escapeHtml(key.includes('dimension')?metricName(x):displayScalar(x,'step_id',ctx))}</option>`).join('')}</select><small>可多选</small>`;
    }
    if (!value.length) return '<span class="dim">无</span>';
    const itemName=(i)=>['range_ms','source_range_ms','output_range_ms'].includes(key)?`${i===0?'起始':'结束'}时间（毫秒）`:key==='box'?`${['左','上','右','下'][i]}边界`:key==='score_range'?`${i===0?'最低':'最高'}分`:key.endsWith('_ms')?`时间 ${i+1}（毫秒）`:`${fieldName(key)} ${i+1}`;
    return `<div class="edit-group">${value.map((item,i)=>`<div class="edit-item"><span class="dim">${escapeHtml(key==='steps'?stepName(item,i):itemName(i))}</span>${editableValue(item,[...path,i],key,ctx)}</div>`).join('')}</div>`;
  }
  if (typeof value==='object') {
    if (value.ref && Object.keys(value).length===1) {
      const choices=[value.ref,...referenceOptions(key,ctx.steps||[],Number(path[1])||0)];
      return `<select data-edit-path="${escapeHtml(JSON.stringify([...path,'ref']))}">${[...new Set(choices)].map(x=>`<option value="${escapeHtml(x)}" ${x===value.ref?'selected':''}>${escapeHtml(referenceName(x,ctx.steps||[]))}</option>`).join('')}</select>`;
    }
    return `<div class="edit-group">${Object.entries(value).filter(([k])=>!hiddenFields.has(k) && k!=='id' && k!=='tool' && k!=='prompt_ref' && k!=='system_prompt_ref').map(([k,v],i)=>`<label>${escapeHtml(editFieldName(k,i))}${editableValue(v,[...path,k],k,ctx)}</label>`).join('')}</div>`;
  }
  if (typeof value==='boolean') return `<select data-edit-path="${encoded}" data-edit-type="boolean"><option value="true" ${value?'selected':''}>开启</option><option value="false" ${!value?'selected':''}>关闭</option></select>`;
  if (typeof value==='number') return `<input type="number" step="any" value="${escapeHtml(value)}" data-edit-type="number" data-edit-path="${encoded}">`;
  if (key==='mode') return `<select data-edit-path="${encoded}">${[value,...['uniform','at_times','fps'].filter(x=>x!==value)].map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(enumNames[x] || '未识别的方式')}</option>`).join('')}</select>`;
  if (key==='video_transport') return `<select data-edit-path="${encoded}">${[value,...['sampled_frames','full_frames'].filter(x=>x!==value)].map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(enumNames[x] || '未识别的方式')}</option>`).join('')}</select>`;
  if (['missing_closeup','insufficient','rule_ref'].includes(key)) return `<span>${escapeHtml(displayScalar(value,key,ctx))}</span>`;
  if (['needs','optional_needs'].includes(key)) return `<span>${escapeHtml(displayScalar(value,'step_id',ctx))}</span>`;
  if (key==='dimension_ids' || key==='expected_dimensions') return `<span>${escapeHtml(metricName(value))}</span>`;
  if (longTextFields.has(key)) { const shown=localizeProse(value); return `<textarea rows="4" data-edit-path="${encoded}" data-original-display="${escapeHtml(encodeURIComponent(shown))}">${escapeHtml(shown)}</textarea>`; }
  if (enumNames[value] || /^[A-Za-z][A-Za-z0-9_.:@/-]*$/.test(value)) return `<span>${escapeHtml(displayScalar(value,key,ctx))}</span>`;
  return `<input type="text" value="${escapeHtml(value)}" data-edit-path="${encoded}">`;
}
function updateEditedValue(element) {
  const path=JSON.parse(element.dataset.editPath); let value=element.value;
  if(element.dataset.originalDisplay && value===decodeURIComponent(element.dataset.originalDisplay))return;
  if (element.dataset.editType==='number') {
    if (value.trim()==='' || !Number.isFinite(Number(value))) throw new Error('请填写有效数字。');
    value=Number(value);
  } else if (element.dataset.editType==='boolean') value=value==='true';
  else if (element.dataset.editType==='list') value=[...element.selectedOptions].map(x=>x.value);
  let target=state.editedFlow;
  path.slice(0,-1).forEach(k=>target=target[k]); target[path[path.length-1]]=value;
}
function flowEditor(flow,edited=null) {
  state.editedFlow=edited || structuredClone({steps:flow.plan.steps,rubric:flow.rubric});
  const ctx={steps:state.editedFlow.steps};
  const version=/:r(\d+)$/.exec(nextVersion(flow.plan.plan_id))[1];
  return `<label>新版本号<input id="new-version" type="number" min="1" step="1" value="${escapeHtml(version)}"></label>` +
    `<h3 class="section-title">步骤与参数<small>${state.editedFlow.steps.length} 步</small></h3><div class="timeline">${state.editedFlow.steps.map((s,i)=>`<details class="block step-card" ${i===0?'open':''}><summary><span class="step-index">${i+1}</span><span class="step-title">${escapeHtml(stepName(s,i))}</span><span class="step-brief">${escapeHtml(toolName(s.tool))}</span></summary><div class="step-body">${editableValue(s,['steps',i],'step',ctx)}<div class="actions"><button class="btn small" data-action="clone-step" data-index="${i}">复制此步骤</button><button class="btn small" data-action="remove-step" data-index="${i}">删除此步骤</button></div></div></details>`).join('')}</div>` +
    `<div class="fields"><label>添加步骤<select id="new-step-tool">${state.tools.map(t=>`<option value="${escapeHtml(t.name)}">${escapeHtml(toolName(t.name))}</option>`).join('')}</select></label><div class="actions"><button class="btn" data-action="add-step">添加所选工具步骤</button></div></div>` +
    `<details class="block step-card"><summary><span class="step-title">评分规则</span></summary><div class="step-body">${editableValue(state.editedFlow.rubric,['rubric'],'rubric',ctx)}</div></details>` +
    `<h3 class="section-title">提示词</h3>` + Object.entries(state.editPrompts||flow.prompts).map(([ref,text],i)=>`<label>${ref.toLowerCase().includes('system')?'系统提示词':'评价要求'} ${i+1}<textarea data-prompt="${escapeHtml(ref)}" rows="6">${escapeHtml(text)}</textarea></label>`).join('') + `<div class="actions"><button class="btn primary" data-action="save-flow">另存新版本</button></div>`;
}
function repaintFlowEditor() {
  const version=val('new-version'),prompts=Object.fromEntries([...document.querySelectorAll('[data-prompt]')].map(x=>[x.dataset.prompt,x.value]));
  state.editPrompts={...state.editPrompts,...prompts};
  $('flow-editor').innerHTML=flowEditor(state.flow,state.editedFlow);$('new-version').value=version;
}
function addToolStep(tool) {
  const steps=state.editedFlow.steps, step={id:'step_'+crypto.randomUUID().replaceAll('-',''),tool,needs:[],optional_needs:[],inputs:{},optional_inputs:{},dimension_ids:[],prompt_ref:null,system_prompt_ref:null,material_policy:null};
  if(tool==='media.extract_clip@1')step.inputs={video:{ref:'sample.output_video'},range_ms:[0,1000]};
  else if(tool==='media.extract_frames@1')step.inputs={video:{ref:'sample.output_video'},sampling:{mode:'uniform',count:3}};
  else if(tool==='media.detect_shots@1')step.inputs={video:{ref:'sample.output_video'},mode:'default'};
  else if(tool==='media.crop_region@1'||tool==='media.resize_view@1') {
    const frame=[...steps].reverse().find(s=>s.tool==='media.extract_frames@1');
    if(!frame)throw new Error('请先添加采样视频帧步骤，才能从采样结果中选择图片。');
    step.needs=[frame.id];step.inputs=tool==='media.crop_region@1' ? {image:{ref:`steps.${frame.id}.data.frames.0.asset`},box:[0,0,1,1]} : {image:{ref:`steps.${frame.id}.data.frames.0.asset`},long_edge:512};
  } else if(tool==='media.detect_faces@1') {
    const frame=[...steps].reverse().find(s=>s.tool==='media.extract_frames@1');
    if(!frame)throw new Error('请先添加采样视频帧步骤，才能在采样结果中检测人脸。');
    step.needs=[frame.id];step.inputs={image:{ref:`steps.${frame.id}.data.frames.0.asset`},score_threshold:0.7,min_face_px:0,crop_padding:0.3,preview:true};
  } else if(tool.startsWith('vlm.judge@')) {
    const original=steps.find(s=>s.tool.startsWith('vlm.judge@'))||state.flow.plan.steps.find(s=>s.tool.startsWith('vlm.judge@'));
    if(!original)throw new Error('请先保留一个带提示词的评分步骤，再添加新的评分步骤。');
    const current=Object.fromEntries([...document.querySelectorAll('[data-prompt]')].map(x=>[x.dataset.prompt,x.value]));
    step.prompt_ref=`prompts/${step.id}.md`;step.system_prompt_ref=`prompts/${step.id}-system.md`;
    state.editPrompts[step.prompt_ref]=current[original.prompt_ref]||state.editPrompts[original.prompt_ref]||'请按所选指标评价实际提供的材料。';
    state.editPrompts[step.system_prompt_ref]=current[original.system_prompt_ref]||state.editPrompts[original.system_prompt_ref]||'只根据实际提供的材料评分，证据不足时说明。';
    step.inputs={rubric:{ref:'plan.rubric'},instruction:{ref:'sample.original_instruction'},output:{ref:'sample.output_video'},video_transport:'full_frames'};
    step.optional_inputs={references:{ref:'sample.reference_images'},source:{ref:'sample.source_video'}};
  } else throw new Error('该工具暂不支持添加为步骤。');
  steps.push(step);repaintFlowEditor();
  if(tool.startsWith('vlm.judge@'))notice('已添加评分步骤；请选择它负责的指标，并从原评分步骤中取消这些指标。');
}
function currentToolForm() {
  if (!state.tool) return '<p>请先选择工具。</p>';
  const name=state.tool.name;
  if (name.startsWith('media.extract_clip')) return `<div class="fields"><label>起始时间（秒）<input id="tool-start" type="number" step="any" min="0" value="0"></label><label>结束时间（秒）<input id="tool-end" type="number" step="any" min="0" value="1"></label></div>`;
  if (name.startsWith('media.extract_frames')) return `<label>采样方式<select id="tool-sampling"><option value="uniform">均匀采样</option><option value="fps">按频率采样</option><option value="at_times">按指定时间采样</option></select></label><div id="sampling-fields"></div>`;
  if (name==='media.detect_shots@1') return '<label>检测模式<select id="tool-shot-mode"><option value="default">镜头及转场标签</option><option value="clean_shot">仅保留普通镜头</option></select></label>';
  if (name.startsWith('media.crop_region')) return `<p>裁剪坐标以图片宽高为 1，依次填写左、上、右、下。</p><div class="fields">${['左边界','上边界','右边界','下边界'].map((x,i)=>`<label>${x}<input id="tool-box-${i}" type="number" step="any" min="0" max="1" value="${[0,0,0.5,1][i]}"></label>`).join('')}</div>`;
  if (name.startsWith('media.detect_faces')) return `<p>选择一张图片，可以是参考图或从视频中抽出的帧。检测在本机 CPU 上运行，不上传图片。</p><div class="fields"><label>最低置信度（0.05 至 0.99）<input id="tool-face-score" type="number" step="0.05" min="0.05" max="0.99" value="0.7"></label><label>忽略短边小于（像素，0 表示全部保留）<input id="tool-face-min" type="number" step="1" min="0" value="0"></label><label>裁剪边距（按人脸宽高的比例）<input id="tool-face-padding" type="number" step="0.05" min="0" max="2" value="0.3"></label></div><label class="check"><input id="tool-face-preview" type="checkbox" checked> 生成标出人脸位置的预览图（原图不变）</label>`;
  if (name.startsWith('media.resize_view')) return `<label>目标长边（像素）<input id="tool-edge" type="number" min="1" step="1" value="512"></label><p>缩放时保持原有宽高比例。</p>`;
  if (name.startsWith('vlm.judge')) return `<p>使用已保存样例和流程中的评分规则。试用会调用已配置的评分模型，并逐帧提交视频；请使用帧数不超过模型图片数量上限的短视频。</p><label>样例<select id="judge-case">${state.cases.map(c=>`<option value="${escapeHtml(c.case_id)}">${escapeHtml(caseName(c.case_id))}</option>`).join('')}</select></label><label>流程版本<select id="judge-flow">${state.flows.map(f=>`<option value="${escapeHtml(f.plan.plan_id)}">${escapeHtml(flowName(f.plan.plan_id))}</option>`).join('')}</select></label><button class="btn" data-action="judge-load">读取流程中的评分设置</button><div id="judge-fields"></div>`;
  return '<p>该工具暂不支持表单试用。</p>';
}
function samplingFields() {
  const mode=val('tool-sampling');
  $('sampling-fields').innerHTML=mode==='uniform' ? '<label>采样数量（帧）<input id="tool-count" type="number" min="1" step="1" value="3"></label>' : mode==='fps' ? '<label>采样频率（每秒帧数）<input id="tool-fps" type="number" min="0.001" step="any" value="1"></label>' : '<label>采样时间（秒，多个时间用逗号分隔）<input id="tool-times" placeholder="例如 0, 1.5, 3"></label>';
}
function selectedNumber(id) {
  const value=val(id); if (!value || !Number.isFinite(Number(value))) throw new Error('请填写有效的工具参数。');
  return Number(value);
}
async function toolInputs() {
  const name=state.tool.name;
  if (name.startsWith('vlm.judge')) {
    if (!state.judgePreset) throw new Error('请先读取流程中的评分设置。');
    const preset=state.judgePreset, text=$('judge-prompt').value, instruction=$('judge-instruction').value;
    if (!text.trim() || !instruction.trim()) throw new Error('请填写评价要求和实际输入文案。');
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    const promptHash=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
    return {...preset.inputs,call_id:id('call'),prompt:text,system_prompt:$('judge-system').value || null,instruction,prompt_sha256:promptHash};
  }
  const assetId=val('tool-asset'); if (!assetId) throw new Error('请先选择已上传素材。');
  const chosen=state.assets.find(x=>x.asset_id===assetId), image=name.includes('crop_region') || name.includes('resize_view') || name.includes('detect_faces');
  if (chosen?.kind !== (image?'image':'video')) throw new Error(image?'该工具需要图片素材。':'该工具需要视频素材。');
  const asset={asset_id:assetId};
  if (name.includes('crop_region')) return {image:asset,box:[0,1,2,3].map(i=>selectedNumber('tool-box-'+i))};
  if (name.includes('resize_view')) return {image:asset,long_edge:selectedNumber('tool-edge')};
  if (name.includes('detect_faces')) return {image:asset,score_threshold:selectedNumber('tool-face-score'),min_face_px:selectedNumber('tool-face-min'),crop_padding:selectedNumber('tool-face-padding'),preview:$('tool-face-preview').checked};
  if (name.includes('extract_clip')) return {video:asset,range_ms:[selectedNumber('tool-start')*1000,selectedNumber('tool-end')*1000]};
  if (name==='media.detect_shots@1') return {video:asset,mode:val('tool-shot-mode')};
  if (name.includes('extract_frames')) {
    const mode=val('tool-sampling'); let sampling;
    if (mode==='uniform') sampling={mode,count:selectedNumber('tool-count')};
    else if (mode==='fps') sampling={mode,fps:selectedNumber('tool-fps')};
    else {const values=val('tool-times').split(/[,，]/).map(x=>x.trim());if (!values.length || values.some(x=>!x || !Number.isFinite(Number(x)))) throw new Error('请填写有效的采样时间。');sampling={mode,times_ms:values.map(x=>Number(x)*1000)};}
    return {video:asset,sampling};
  }
  throw new Error('该工具暂不支持表单试用。');
}
async function loadJudgePreset() {
  const [flow,caseData]=await Promise.all([api('/api/flows/'+route(val('judge-flow'))),api('/api/cases/'+route(val('judge-case')))]);
  const step=flow.plan.steps.find(s=>s.tool===state.tool.name) || flow.plan.steps.find(s=>s.tool.startsWith('vlm.judge'));
  if (!step) throw new Error('该流程没有视觉模型评分步骤。');
  const sample=caseData.sample, output=caseData.output, sm=sample.media||{}, om=output.media||{};
  function asset(x) {return x?.asset_id ? {asset_id:x.asset_id}:null;}
  const generated=asset(om.output_video || om.video); if (!generated) throw new Error('样例中没有生成结果视频。');
  const inputs={plan_sha256:flow.plan_sha256,dimension_ids:step.dimension_ids,rubric:flow.rubric,output:generated,video_transport:'full_frames'};
  if(step.material_policy)inputs.material_policy=step.material_policy;
  const references=(sm.reference_images||[]).map(asset).filter(Boolean); if(references.length)inputs.references=references;
  const source=asset(sm.source_video); if(source)inputs.source=source;
  const ideal=caseData.ideal_example; const idealAsset=asset(ideal); if (idealAsset && state.tool.name.endsWith('@2')) inputs[ideal.kind==='video'?'ideal_video':'ideal_image']=idealAsset;
  state.judgePreset={inputs};
  $('judge-fields').innerHTML=`${structuredDetail('评价指标和评分规则',{dimension_ids:inputs.dimension_ids,rubric:inputs.rubric},true,{steps:flow.plan.steps})}<label>系统提示词<textarea id="judge-system" rows="5">${escapeHtml(flow.prompts[step.system_prompt_ref] || '')}</textarea></label><label>评价要求<textarea id="judge-prompt" rows="7">${escapeHtml(flow.prompts[step.prompt_ref] || '')}</textarea></label><label>实际输入文案<textarea id="judge-instruction" rows="4">${escapeHtml(sample.original_instruction || '')}</textarea></label>`;
}

// 步骤摘要只使用对应步骤保存的请求、结果和实际模型请求事件。
function stepRequestInputs(step, events=[]) {
  if (step?.request?.inputs) return step.request.inputs;
  for (const event of [...events].reverse()) {
    if (event.kind==='attempt_started' && event.payload?.request?.inputs) return event.payload.request.inputs;
    if (event.kind==='step_inputs' && event.payload?.inputs) return event.payload.inputs;
  }
  return {};
}
function stepOutput(step, events=[]) {
  const attempts=step?.attempts || [];
  if (attempts.length) return attempts[attempts.length-1]?.data || null;
  for (const event of [...events].reverse()) {
    if (event.kind==='attempt_finished' && event.payload?.result?.data) return event.payload.result.data;
  }
  return null;
}
function stepPurpose(step, inputs={}) {
  const tool=step?.tool || '';
  if (tool==='media.extract_frames@1') return '从视频中抽取关键帧，供后续步骤查看和评价。';
  if (tool==='media.extract_clip@1') return '截取视频中指定的片段。';
  if (tool==='media.detect_shots@1') return '用 OmniShotCut v1.5 定位视频中实际出现的镜头区间。';
  if (tool==='media.sample_metric@1') return '按模板参数选取整帧，记录实际时间、镜头分组与切点两侧证据。';
  if (tool==='vlm.plan_ugc_metric@1') return '根据当前用例原文提取与本指标对应的检查项，保存原文出处。';
  if (tool==='vlm.inspect_metric@1') return '模型回答每个检查项，程序核对帧编号、统计覆盖率并换算分数。';
  if (tool==='media.crop_region@1') return '裁剪图片中的指定区域。';
  if (tool==='media.resize_view@1') return '按目标长边缩放图片，保持画面比例。';
  if (tool==='media.detect_faces@1') return '找出图片中的全部人脸位置，供后续裁剪和放大；不判断是谁，也不跨帧跟踪。';
  if (tool==='media.pair_frames@1') return '把原视频和结果视频按相同相对时间成对抽帧，每个时刻生成一张左原视频、右结果视频的对照图；原帧另外保留。';
  if (tool==='vlm.observe@1') return `用视觉模型逐项判断“${checkName(inputs.check_id || step?.inputs?.check_id)}”，每项回答 1、0 或无法判断并写依据；不打分，由程序核对覆盖范围并统计。`;
  if (tool==='media.cut_frames@1') return '没有原视频时，按提示词写明的镜头时间，从生成视频每个镜头内部均匀抽帧，每帧标注编号、时间和所属镜头。';
  if (tool==='vlm.inspect@1') return '一次请求把参考图和全部采样画面交给视觉模型，同时返回各维度的整体结论、主要问题及其采样编号范围和无法判断的范围；不写逐帧依据，由程序核对编号并统计范围。';
  if (tool==='vlm.score@1') return '只发送文字：按保存的评分标准，用上一步的问题、范围和程序统计给各维度打 0–10 分并说明扣分问题；不发送图片，由程序核对规则、问题编号、数量和算术。';
  if (tool.startsWith('vlm.judge@')) {
    const dimensions=inputs.dimension_ids || step?.dimension_ids || [];
    return dimensions.length ? `用视觉模型评价${dimensions.map(metricName).join('、')}。` : '用视觉模型评价所选材料。';
  }
  return '处理本步骤的输入材料。';
}
function stepSource(inputs, sample, planned=false, steps=[]) {
  const video=inputs?.video;
  if (planned) return video?.ref ? referenceName(video.ref,steps) : video ? '指定视频' : '来源未记录';
  if (!video || !sample) return '来源未记录';
  const root=video.metadata?.parent_mapping?.root_asset;
  const same=(a,b)=>a && b && ((a.asset_id && a.asset_id===b.asset_id) || (a.uri && a.uri===b.uri));
  if (same(video,sample.output_video) || same(root,sample.output_video)) return '生成结果视频';
  if (same(video,sample.source_video) || same(root,sample.source_video)) return '输入视频';
  if (same(video,sample.ideal_video) || same(root,sample.ideal_video)) return '理想效果视频';
  return '来源未记录';
}
function timeText(ms) {
  if (typeof ms!=='number' || !Number.isFinite(ms)) return '时间未记录';
  const seconds=Number((ms/1000).toFixed(3));
  return `${seconds*1000===ms?'':'约 '}${seconds} 秒`;
}
function samplingText(sampling) {
  if (!sampling || typeof sampling!=='object' || sampling.ref) return '采样方式与频率未记录';
  const parts=[];
  if (sampling.mode==='uniform') parts.push(`按数量均匀采样 · ${sampling.count==null?'目标数量未记录':`目标 ${sampling.count} 帧`} · 未设固定频率`);
  else if (sampling.mode==='fps') parts.push(`按频率采样 · ${sampling.fps==null?'频率未记录':`每秒 ${sampling.fps} 帧`}`);
  else if (sampling.mode==='at_times') parts.push((Array.isArray(sampling.times_ms) ? `按指定时间采样 · ${sampling.times_ms.map(timeText).join('、')}` : '按指定时间采样 · 时间未记录')+' · 未设固定频率');
  else parts.push('采样方式与频率未记录');
  if (sampling.max_frames!=null) parts.push(`最多 ${sampling.max_frames} 帧`);
  return parts.join(' · ');
}
function stepSettings(step, inputs, sample, planned=false, steps=[]) {
  const tool=step?.tool || '';
  if (tool==='media.extract_frames@1') return `${stepSource(inputs,sample,planned,steps)} · ${samplingText(inputs.sampling)}`;
  if (tool==='media.pair_frames@1') return `每秒 ${inputs.fps ?? '未记录'} 帧 · 采用两段视频共同可用的时间区间 [开始, 结束) · 左原视频、右结果视频`;
  if (tool==='media.cut_frames@1') return `约每秒 ${inputs.density ?? 1.6} 帧 · 每个镜头 2–6 帧 · 最多 ${inputs.max_frames ?? 30} 帧`;
  if (tool==='media.detect_shots@1') return `${inputs.mode==='clean_shot'?'仅保留普通镜头':'保留镜头、转场与边界标签'} · 推理窗口重叠 10 帧`;
  if (tool==='media.sample_metric@1') {
    const s=inputs.sampling||{};
    if(s.mode==='uniform')return `全片均匀取帧 · ${s.target_fps?`约每秒 ${s.target_fps} 帧 · `:''}最多 ${s.count} 帧`;
    if(s.mode==='shots')return `每个实际镜头在 ${(s.positions||[]).map(x=>`${Math.round(x*100)}%`).join('、')} 处取帧 · 全片概览 ${s.overview_count||0} 帧 · 超过 ${s.target_batch_frames??30} 帧时先保留每个镜头的代表帧`;
    if(s.mode==='motion')return `${s.windows} 个等长时间段 · 镜头内每秒 ${s.fps} 帧，取 ${s.frames_per_window} 帧 · 检查异常候选边界及 ${s.hard_cut_examples} 个硬切，前后各 ${s.frames_per_side} 帧`;
  }
  if (tool==='vlm.plan_ugc_metric@1') return `分析 ${metricName(inputs.focus)} 的用例要求 · 温度 0 · 文字输入`;
  if (tool==='vlm.inspect_metric@1') {
    const metric=(step.dimension_ids||inputs.dimension_ids||[])[0];
    const ref=inputs.reference_index!=null?` · 使用第 ${inputs.reference_index+1} 张参考图`:
      ['person_identity','product_fidelity'].includes(metric)?' · 按任务绑定参考图':'';
    const more=inputs.supplement_frames?` · 证据不足时最多补查 3 个窗口，各取最多 ${inputs.supplement_frames} 帧，每秒 ${inputs.supplement_fps} 帧，最长 ${timeText(inputs.supplement_window_ms)}`:'';
    return `温度 0 · 每次最多 ${inputs.max_video_frames} 张视频帧、${inputs.max_checks} 个检查项 · 最低可判定覆盖率 ${Math.round(inputs.min_coverage*100)}%${ref}${more}`;
  }
  if (tool==='media.extract_clip@1') {
    const range=inputs.range_ms;
    const text=Array.isArray(range) ? `${timeText(range[0])} 至 ${timeText(range[1])}` : range?.ref ? referenceName(range.ref,steps) : '时间范围未记录';
    return `${stepSource(inputs,sample,planned,steps)} · 截取范围：${text}`;
  }
  if (tool==='media.crop_region@1') {
    const box=inputs.box;
    return `裁剪区域（左、上、右、下，按宽高归一化）：${Array.isArray(box)?box.join('，'):box?.ref?referenceName(box.ref,steps):'未记录'}`;
  }
  if (tool==='media.resize_view@1') return `目标长边：${typeof inputs.long_edge==='number'?`${inputs.long_edge} 像素`:inputs.long_edge?.ref?referenceName(inputs.long_edge.ref,steps):'未记录'}`;
  if (tool==='media.detect_faces@1') {
    const image=inputs.image?.ref?`图片：${referenceName(inputs.image.ref,steps)} · `:'';
    return `${image}最低置信度 ${inputs.score_threshold ?? 0.7} · ${inputs.min_face_px?`忽略短边小于 ${inputs.min_face_px} 像素的人脸`:'保留全部大小的人脸'} · 裁剪边距 ${inputs.crop_padding ?? 0.3} 倍人脸宽高`;
  }
  return '';
}
function stepMediaURL(asset) {
  if (!asset || typeof asset!=='object') return null;
  if (typeof asset.uri==='string' && asset.uri.startsWith('/api/')) return asset.uri;
  // 静态报告中的媒体：站点内相对路径或外部存储链接。
  if (window.STATIC_SNAPSHOT && typeof asset.uri==='string' && /^(media\/|videos\/|https:\/\/)/.test(asset.uri)) return asset.uri;
  if (asset.asset_id && (state.assets || []).some(x=>x.asset_id===asset.asset_id)) return '/api/assets/'+encodeURIComponent(asset.asset_id)+'/preview';
  return null;
}
function stepThumbs(items) {
  if (!items.length) return '';
  return `<div class="step-thumbs">${items.map(item=>{
    const url=stepMediaURL(item.asset), label=`${item.label}${item.time==null?'':` · ${timeText(item.time)}`}`;
    return `<figure>${url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="查看${escapeHtml(label)}大图"><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(label)}"></a>`:'<div class="step-missing-image">图片未保留</div>'}<figcaption>${escapeHtml(label)}</figcaption></figure>`;
  }).join('')}</div>`;
}
function stepVideo(asset, label) {
  const url=stepMediaURL(asset);
  return url ? `<figure class="step-video"><video controls preload="none" aria-label="${escapeHtml(label)}" src="${escapeHtml(url)}"></video><figcaption>${escapeHtml(label)}</figcaption></figure>` : '';
}
function sampleVideos(sample={}) {
  const videos=[stepVideo(sample.source_video,'输入视频'),stepVideo(sample.output_video,'生成结果视频')].filter(Boolean);
  return videos.length ? `<div class="sample-videos">${videos.join('')}</div>` : '';
}
function materialGroup(material) {
  if (/^frame-\d+$/.test(material||'')) return '生成结果证据帧';
  if (/^references(?:\.\d+)?$/.test(material||'')) return '参考图';
  if (/^(source|source_frames)(?:\.\d+)?$/.test(material||'')) return '输入视频采样帧';
  if (/^(output|output_frames)(?:\.\d+)?$/.test(material||'')) return '生成结果采样帧';
  if (/^ideal_video(?:_frames)?(?:\.\d+)?$/.test(material||'')) return '理想效果视频采样帧';
  if (/^comparisons(?:\.\d+)?$/.test(material||'')) return '左右对照图（左原视频、右结果视频）';
  if (material==='ideal_image') return '理想效果图片';
  if (material==='person_closeup') return '人物近景';
  return '其他实际输入图片';
}
function messageText(message) {
  if (typeof message?.content==='string') return message.content;
  return Array.isArray(message?.content) ? message.content.filter(x=>x.type==='text' && typeof x.text==='string').map(x=>x.text).join('\n') : null;
}
function actualVlmRequest(event) {
  const messages=event?.payload?.request?.messages;
  if (!Array.isArray(messages)) return null;
  const system=messages.filter(m=>m.role==='system').map(messageText).filter(x=>x!==null).join('\n');
  const images=[];
  let prompt=null, instruction=null, userImageSeen=false;
  for (const message of messages) {
    const parts=typeof message.content==='string' ? [{type:'text',text:message.content}] : Array.isArray(message.content) ? message.content : [];
    for (const part of parts) {
      if (part.type==='image_ref' || part.type==='image_url') {images.push(part);if(message.role==='user')userImageSeen=true;}
      if (message.role!=='user' || part.type!=='text' || typeof part.text!=='string' || prompt!==null) continue;
      try {
        const value=JSON.parse(part.text);
        if (value && typeof value==='object' && typeof value.prompt==='string') {
          prompt=value.prompt; if (typeof value.instruction==='string') instruction=value.instruction;
        } else if (!userImageSeen) prompt=part.text;
      } catch { if (!userImageSeen) prompt=part.text; }
    }
  }
  return {system:system || null,prompt,instruction,images};
}
function promptBox(title, value, missing='未记录', wide=false) {
  return `<section class="step-prompt${wide?' wide':''}"><h4>${escapeHtml(title)}${typeof value==='string'&&!wide?`<small>${value.length} 字，可滚动或拖动下边缘查看</small>`:''}</h4><div class="step-prompt-text" tabindex="0" aria-label="${escapeHtml(title)}">${escapeHtml(value??missing)}</div></section>`;
}
function vlmMaterials(images) {
  if (!images.length) return '<p class="step-note">实际请求未记录可核对的图片。</p>';
  const groups=[];
  images.forEach((item,index)=>{
    const name=materialGroup(item.material), previous=groups[groups.length-1];
    const group=previous?.name===name ? previous : (groups.push({name,items:[]}),groups[groups.length-1]);
    group.items.push({asset:item.asset_ref,label:`第 ${index+1} 张`,time:item.actual_time_ms});
  });
  return `<p class="step-note">实际发送 ${images.length} 张图片，按请求顺序排列。</p>`+
    groups.map(group=>`<div class="step-material-group"><strong>${escapeHtml(group.name)} · ${group.items.length} 张</strong>${stepThumbs(group.items)}</div>`).join('');
}
function stepFailure(step) {
  if (!step) return '结果尚未记录。';
  if (!['error','failed','skipped','interrupted','cancelled'].includes(step.status) && !step.error) return '';
  const reason=step.error?.code==='deferred_after_connection_failure'?errorNames[step.error.code]:(step.error?.message ? localizeError(step.error.message) : (errorNames[step.error?.code] || '原因未记录'));
  return `${step.status==='skipped'?'已跳过':'未完成'}：${reason}${/[。！？.!?]$/.test(reason)?'':'。'}`;
}
function stepResults(step, events, caseResult) {
  const output=stepOutput(step,events), failure=stepFailure(step);
  if (failure) return `<p class="step-note">${escapeHtml(failure)}</p>`;
  if (!output) return '<p class="step-note">实际结果未记录。</p>';
  if (step.tool==='media.extract_frames@1') {
    const frames=Array.isArray(output.frames)?[...output.frames]:null;
    const count=typeof output.actual_count==='number'?output.actual_count:frames?.length;
    if (!frames) return `<p class="step-note">${count==null?'实际产出数量未记录':`记录产出 ${escapeHtml(count)} 帧，图片未保留`}。</p>`;
    frames.sort((a,b)=>(typeof a.actual_time_ms==='number'?a.actual_time_ms:Infinity)-(typeof b.actual_time_ms==='number'?b.actual_time_ms:Infinity));
    return `<p class="step-note">实际产出 ${escapeHtml(count)} 帧${count!==frames.length?`，其中 ${frames.length} 张图片已保留`:''}。</p>`+
      stepThumbs(frames.map((f,i)=>({asset:f.asset,label:`第 ${i+1} 帧`,time:f.actual_time_ms})));
  }
  if (step.tool==='media.detect_faces@1') return faceResults(output);
  if (step.tool==='media.detect_shots@1') return shotResults(output);
  if (step.tool==='media.pair_frames@1') return pairResults(output);
  if (step.tool==='media.cut_frames@1') return cutResults(output);
  if (step.tool==='vlm.observe@1') return observeResults(output);
  if (step.tool==='vlm.inspect@1') return inspectResults(output);
  if (step.tool==='vlm.score@1') return scoreStepResults(output);
  if (step.tool.startsWith('vlm.judge@')) {
    const dims=Array.isArray(output.dimensions)?output.dimensions:(caseResult?.dimensions||[]).filter(d=>d.step_id===step.step_id);
    if (!dims.length) return '<p class="step-note">未记录可用评分结果。</p>';
    // 汇总结果可能在模型回答之后被改判（例如材料不足判为无法评分），两者都按原文展示。
    const final=id=>(caseResult?.dimensions||[]).find(x=>x.id===id && x.step_id===step.step_id);
    return dims.map(d=>{
      const f=final(d.id), changed=f && (f.score!==d.score || (f.decision==='unscorable')!==(d.score==null));
      const note=changed?`<p class="final-note"><strong>汇总结果：</strong>${f.score==null?'无法评分':`${escapeHtml(f.score)} 分${f.decision?` · ${escapeHtml(status(f.decision))}`:''}`}${f.reason?`。${escapeHtml(f.reason)}`:''}</p>`:'';
      return `<div class="step-score"><div class="row"><strong>${escapeHtml(metricName(d.id))}</strong><span class="score">${d.score==null?'无法评分':escapeHtml(d.score)}</span>${d.decision?statusPill(d.decision):''}${changed?'<span class="dim">模型回答</span>':''}</div><p>${escapeHtml(d.reason || d.unscorable_reason || '评分理由未记录')}</p>${note}</div>`;
    }).join('');
  }
  const asset=output.asset;
  if (asset?.kind==='video') return stepVideo(asset,'处理后的视频') || '<p class="step-note">结果视频未保留。</p>';
  if (asset?.kind==='image') {
    const size=asset.metadata?.width && asset.metadata?.height ? ` · ${asset.metadata.width} × ${asset.metadata.height} 像素` : '';
    return stepThumbs([{asset,label:'处理后的图片'+size}]);
  }
  return '<p class="step-note">产物未记录。</p>';
}
function pairResults(output) {
  const pairs=Array.isArray(output.pairs)?output.pairs:[], range=output.interval?.source_range_ms, videos=output.videos||{};
  const fps=output.interval?.fps, err=output.selection?.max_error_ms||{};
  const video=v=>v?`${v.frame_count} 帧，约 ${Number(v.average_fps).toFixed(2)} 帧/秒，时长 ${timeText(v.duration_ms)}`:'未记录';
  let html=`<p class="step-note">每秒 ${escapeHtml(fps)} 帧，实际采样 ${escapeHtml(pairs.length)} 对；采样区间 [${escapeHtml(timeText(range?.[0]))}, ${escapeHtml(timeText(range?.[1]))})，时间点 ${escapeHtml(pairs.map(p=>(p.time_ms/1000).toFixed(3)).join('、'))} 秒。</p>`;
  html+=`<p class="step-note">原视频：${escapeHtml(video(videos.source))}；结果视频：${escapeHtml(video(videos.output))}。每个时刻各取实际时间最接近的帧（相同时取较早帧），与期望时间的差不超过半帧（原视频 ${escapeHtml(Number(err.source).toFixed(1))} 毫秒、结果视频 ${escapeHtml(Number(err.output).toFixed(1))} 毫秒）。</p>`;
  const shifted=pairs.filter(p=>Math.abs(p.offset_ms)>0.001);
  if (shifted.length) html+=`<p class="step-note">有 ${shifted.length} 对左右实际时间不同，最大相差 ${escapeHtml(Math.max(...shifted.map(p=>Math.abs(p.offset_ms))).toFixed(1))} 毫秒。</p>`;
  return html+stepThumbs(pairs.map(p=>({asset:p.comparison,label:`#${String(p.index).padStart(2,'0')}`,time:p.time_ms})));
}
function cutResults(output) {
  const pairs=Array.isArray(output.pairs)?output.pairs:[], cuts=output.interval?.cuts||[], v=output.videos?.output;
  const video=v?`${v.frame_count} 帧，约 ${Number(v.average_fps).toFixed(2)} 帧/秒，时长 ${timeText(v.duration_ms)}`:'未记录';
  let html=`<p class="step-note">生成视频：${escapeHtml(video)}。${cuts.length?`按提示词的 ${cuts.length} 个镜头，在每个镜头内部均匀取帧，共 ${pairs.length} 帧：`:`提示词没有镜头表，整段均匀取 ${pairs.length} 帧。`}</p>`;
  if (cuts.length) html+=`<ul class="issue-list">${cuts.map(c=>`<li>镜头 ${escapeHtml(c.index)}（${escapeHtml(sec(c.start_ms/1000))}–${escapeHtml(sec(c.end_ms/1000))} 秒）${escapeHtml(c.title)}：${escapeHtml(c.frames)} 帧</li>`).join('')}</ul>`;
  if ((output.interval?.cuts_beyond_video||[]).length) html+=`<p class="step-note">镜头 ${escapeHtml(output.interval.cuts_beyond_video.join('、'))} 超出视频时长，未取帧。</p>`;
  return html+stepThumbs(pairs.map(p=>({asset:p.comparison,label:`#${String(p.index).padStart(2,'0')}${p.cut?` · 镜头 ${p.cut.index}`:''}`,time:p.time_ms})));
}
const valueText = (field, value) => value===1 ? field.one : value===0 ? field.zero : value==='unknown' ? '无法判断' : value==='n/a' ? '不适用' : '缺失';
function unitText(unit) { return Array.isArray(unit) ? `#${String(unit[0]).padStart(2,'0')}→#${String(unit[1]).padStart(2,'0')}` : `#${String(unit).padStart(2,'0')}`; }
function segmentText(segments, unitWord) {
  return (segments||[]).map(([a,b])=>a===b?`#${String(a).padStart(2,'0')}`:`#${String(a).padStart(2,'0')}–#${String(b).padStart(2,'0')}`).join('、') || '无';
}
function observeResults(output) {
  const stats=output.statistics, issues=output.issues||[], records=output.records||[];
  const unitWord=stats?.unit==='adjacent_pair'?'组相邻时刻':'帧';
  let html=`<p class="step-note">状态：${statusPill(output.status)}${stats?` 应判断 ${escapeHtml(stats.expected_units)} ${unitWord}，有效记录 ${escapeHtml(stats.recorded_units)}${stats.missing_units.length?`，缺少 ${escapeHtml(stats.missing_units.map(unitText).join('、'))}`:''}${stats.duplicate_units.length?`，重复 ${escapeHtml(stats.duplicate_units.map(unitText).join('、'))}`:''}。`:''}统计由程序按逐项记录计算；“无法判断”单独计数，不算通过或未通过。</p>`;
  if (output.request_summary) html+=`<p class="step-note">本次请求发送 ${escapeHtml(output.request_summary.image_count)} 张图（参考图 ${escapeHtml(output.request_summary.reference_count)} 张、${output.request_summary.has_source===false?'采样帧':'对照图'} ${escapeHtml(output.request_summary.comparison_count)} 张）。</p>`;
  if (!stats) return html+(issues.length?`<ul class="issue-list">${issues.map(i=>`<li>${escapeHtml(localizeError(i.message))}</li>`).join('')}</ul>`:'');
  const fields=Object.entries(stats.fields||{});
  html+=`<table class="face-table observe-table"><thead><tr><th>判断问题</th><th>需关注的回答</th><th>需关注</th><th>无需关注</th><th>无法判断</th><th>不适用</th><th>缺失</th><th>需关注的${unitWord}</th></tr></thead><tbody>${fields.map(([id,f])=>{
    const hit=f.attention===1?f.count_1:f.count_0, other=f.attention===1?f.count_0:f.count_1;
    return `<tr><td>${escapeHtml(f.question)}</td><td>${escapeHtml(f.attention===1?f.one:f.zero)}</td><td><b>${escapeHtml(hit)}</b></td><td>${escapeHtml(other)}</td><td>${escapeHtml(f.unknown)}</td><td>${escapeHtml(f.not_applicable)}</td><td>${escapeHtml(f.missing)}</td><td>${escapeHtml(segmentText(f.segments_attention))}</td></tr>`;}).join('')}</tbody></table>`;
  const rollups=Object.values(stats.rollups||{});
  if (rollups.length) html+=`<ul class="issue-list">${rollups.map(r=>r.kind==='completion'
    ? `<li>${escapeHtml(r.label)}：全部完成 ${r.all_done}，部分完成 ${r.partial}，未完成 ${r.none}，无法判断 ${r.unknown}（单位：${unitWord}）</li>`
    : `<li>${escapeHtml(r.label)}：${escapeHtml(r.count)} ${unitWord}${r.units.length?`（${escapeHtml(r.units.map(unitText).join('、'))}）`:''}；另有 ${escapeHtml(r.unknown_or_missing)} ${unitWord}存在无法判断或缺失、不能确定</li>`).join('')}</ul>`;
  const kinds=Object.entries(stats.note_kinds||{});
  if (kinds.length) html+=`<p class="step-note">问题类别（按涉及的${unitWord}计，同一${unitWord}可属于多类）：${escapeHtml(kinds.map(([k,v])=>`${k} ${v.count}`).join('、'))}</p>`;
  if (issues.length) html+=`<p class="step-note">核对发现的问题：</p><ul class="issue-list">${issues.map(i=>`<li>${escapeHtml(localizeError(i.message))}</li>`).join('')}</ul>`;
  const meta=Object.fromEntries(fields);
  html+=`<details class="block"><summary>逐${unitWord}依据（${records.length} 条）</summary><table class="face-table observe-table"><thead><tr><th>${unitWord==='帧'?'对照图':'相邻时刻'}</th><th>需关注或无法判断的回答</th><th>说明</th><th>总体观察</th></tr></thead><tbody>${records.map(r=>{
    const flagged=Object.entries(r.values||{}).filter(([id,v])=>meta[id] && (v===meta[id].attention || ['unknown','missing'].includes(v)));
    const normal=Object.values(r.values||{}).filter(v=>v===0||v===1).length-flagged.filter(([,v])=>v===0||v===1).length;
    const allValues=Object.entries(r.values||{}).filter(([id])=>meta[id]);
    const full=`<details><summary>全部判断（${allValues.length} 项）</summary>${allValues.map(([id,v])=>`<p>${escapeHtml(meta[id].question)}：<b>${v===0||v===1?`${v} · `:''}${escapeHtml(valueText(meta[id],v))}</b></p>`).join('')}</details>`;
    return `<tr><td>${escapeHtml(r.label)}</td><td>${flagged.length?flagged.map(([id,v])=>`<div>${escapeHtml(meta[id].question.slice(0,24))}…：<b>${escapeHtml(valueText(meta[id],v))}</b></div>`).join(''):'无'}${normal?`<div class="dim">其余 ${normal} 项无需关注</div>`:''}${full}</td><td>${(r.notes||[]).map(n=>`<div>${escapeHtml([n.kind,n.region].filter(Boolean).join(' · '))}${n.kind||n.region?'：':''}${escapeHtml(n.basis)}</div>`).join('')||'—'}</td><td>${escapeHtml(r.basis||'未记录')}</td></tr>`;}).join('')}</tbody></table></details>`;
  return html;
}
function faceResults(output) {
  const faces=Array.isArray(output.faces)?output.faces:[], size=output.source?.image_size, frame=output.source?.frame;
  const where=[size?`图片 ${size[0]} × ${size[1]} 像素`:'',frame?`来自视频第 ${frame.root_frame_index+1} 帧，${timeText(frame.root_time_ms)}`:''].filter(Boolean).join(' · ');
  let html=`<p class="step-note">检测到 ${escapeHtml(faces.length)} 张人脸${where?`（${escapeHtml(where)}）`:''}。${faces.length?'按画面从左到右编号，编号不代表人物身份。':'这是正常的检测结果，不是执行错误。'}</p>`;
  if (faces.length) html+=`<table class="face-table"><thead><tr><th>编号</th><th>置信度</th><th>人脸位置（左、上、右、下，像素）</th><th>裁剪区域（含边距，按宽高归一化）</th><th>提示</th></tr></thead><tbody>${faces.map(f=>{
    const notes=[f.truncated?'人脸被图片边缘截断':'',f.small_face?'人脸较小，细节可能不足':''].filter(Boolean).join('；')||'—';
    return `<tr><td>${escapeHtml(f.index+1)}</td><td>${escapeHtml(Number(f.score).toFixed(2))}</td><td>${escapeHtml((f.box_px||[]).map(v=>Math.round(v)).join('，'))}</td><td>${escapeHtml((f.crop_box||[]).map(v=>Number(v).toFixed(3)).join('，'))}</td><td>${escapeHtml(notes)}</td></tr>`;}).join('')}</tbody></table>`;
  if (output.preview) html+=stepThumbs([{asset:output.preview,label:'检测预览（红框为人脸，黄框为裁剪区域）'}]);
  return html;
}
function shotResults(output) {
  const detector=output.detector, segments=output.segments||[];
  const labels={General:'普通镜头',Dissolve:'叠化',Wipes:'划像',Push:'推移',Slide:'滑动',Zoom:'缩放',Fade:'淡入淡出',Doorway:'门形转场',Padding:'未有效分类'};
  const boundaries={New_Start:'视频开始',Hard_Cut:'硬切',Transition_Source:'转场来源',Transition:'转场',Sudden_Jump:'画面突跳',Padding:'未有效分类'};
  const info=[detector?.model,detector?.device,detector?.implementation].filter(Boolean).join(' · ');
  const summary=`<p class="step-note">${escapeHtml(info)} · ${segments.length} 个区间 · 视频时长 ${escapeHtml(timeText(output.duration_ms))}</p>`;
  if (!segments.length) return summary+'<p class="step-note">此模式下没有返回可用镜头区间。</p>';
  return summary+`<table class="face-table"><thead><tr><th>区间</th><th>实际时间</th><th>帧号（从 0 开始，不含结束帧）</th><th>片段类型</th><th>起点关系</th></tr></thead><tbody>${segments.map(segment=>
    `<tr><td>${escapeHtml(segment.index)}</td><td>${escapeHtml(timeText(segment.range_ms[0]))} 至 ${escapeHtml(timeText(segment.range_ms[1]))}</td><td>${escapeHtml(segment.start_frame)} 至 ${escapeHtml(segment.end_frame_exclusive)}</td><td>${escapeHtml(labels[segment.segment_label]||segment.segment_label)}</td><td>${escapeHtml(boundaries[segment.boundary_label]||segment.boundary_label||'—')}</td></tr>`
  ).join('')}</tbody></table>`;
}
function plannedMaterials(inputs) {
  const names={references:'参考图',source:'输入视频',source_frames:'输入视频采样帧',output:'生成结果视频',output_frames:'生成结果采样帧',person_closeup:'人物近景',ideal_image:'理想效果图片',ideal_video:'理想效果视频',ideal_video_frames:'理想效果视频采样帧',pairs:'按时间排列的全部左右对照图',instruction:'实际编辑要求'};
  const found=Object.keys(inputs||{}).filter(k=>names[k]).map(k=>names[k]);
  if(inputs.evidence)found.push('实际取帧、时间和镜头分组');
  if(inputs.case_standard)found.push('本用例的检查标准');
  return found.length ? found.join('、') : '计划材料未记录';
}
function metricPlannedMaterials(step) {
  const inputs=step.inputs;
  if(step.tool==='vlm.plan_ugc_metric@1')return '本用例的原始生成要求';
  const names=['带实际时间戳的证据帧'];
  if(inputs.case_standard)names.push('本用例的检查标准');
  if(step.dimension_ids?.[0]==='person_identity')names.push('人物参考图和用例要求');
  if(step.dimension_ids?.[0]==='product_fidelity')names.push('商品参考图和用例要求');
  return names.join('、');
}
function stepLine(label, body) {
  return body ? `<div class="step-line"><div class="k">${escapeHtml(label)}</div><div class="v">${body}</div></div>` : '';
}
function stepContent(planStep, step, events=[], sample=null, prompts={}, caseResult=null, planSteps=[]) {
  const planned=!step, shown=step || planStep || {}, inputs=planned?(planStep?.inputs||{}):stepRequestInputs(step,events);
  let html=stepLine('目的',`<p class="step-purpose">${escapeHtml(stepPurpose(shown,inputs))}</p>`);
  const settings=stepSettings(shown,inputs,sample,planned,planSteps);
  if (settings) html+=stepLine(planned?'计划设置':'实际设置',`<p class="step-setting">${escapeHtml(settings)}</p>`);
  if (isVlmTool(shown.tool)) {
    if (planned) {
      const materials=['vlm.plan_ugc_metric@1','vlm.inspect_metric@1'].includes(shown.tool)?metricPlannedMaterials(shown):plannedMaterials(inputs);
      html+=stepLine('计划材料',`<p class="step-setting">${escapeHtml(materials)}<span class="dim">（实际以运行记录为准）</span></p>`);
      let boxes='';
      if (planStep.system_prompt_ref) boxes+=promptBox('计划系统提示词',prompts[planStep.system_prompt_ref]);
      if (planStep.prompt_ref) boxes+=promptBox('计划评价要求',prompts[planStep.prompt_ref]);
      if (boxes) html+=stepLine('提示词',`<div class="step-prompts">${boxes}</div>`);
      return `<div class="step-body">${html}</div>`;
    }
    const requests=events.filter(e=>['vlm_request','vlm_response_reused'].includes(e.kind));
    if (!requests.length) html+=stepLine('实际输入','<p class="step-note">实际模型请求及发送的图片未记录。</p>');
    requests.forEach((event,i)=>{
      const request=actualVlmRequest(event);
      if (event.kind==='vlm_response_reused') html+=stepLine('结果来源','<p class="step-note">复用已保存的真实模型回答：本次请求文本及全部图片内容与原请求相同，没有再次调用模型。</p>');
      if (requests.length>1) html+=`<h4>第 ${i+1} 次实际请求</h4>`;
      if (!request) {html+=stepLine('实际输入','<p class="step-note">实际模型请求及发送的图片未记录。</p>');return;}
      html+=stepLine('实际输入',shown.tool==='vlm.score@1'&&!request.images.length?'<p class="step-note">只发送文字和结构化记录，没有图片。</p>':vlmMaterials(request.images));
      const usage=stepOutput(step,events)?.transport?.usage;
      if (usage && event.kind==='vlm_request') html+=stepLine('用量',`<p class="step-note">输入 ${escapeHtml(usage.prompt_tokens)} 词元，输出 ${escapeHtml(usage.completion_tokens)} 词元。</p>`);
      let boxes=promptBox('系统提示词',request.system,'实际系统提示词未记录')+promptBox('评价要求',request.prompt,'实际评价要求未记录');
      if (request.instruction!==null) boxes+=promptBox('本次编辑指令',request.instruction,'未记录',true);
      html+=stepLine('实际提示词',`<div class="step-prompts">${boxes}</div>`);
    });
  }
  if (!planned) html+=stepLine('结果',stepResults(step,events,caseResult));
  return `<div class="step-body">${html}</div>`;
}
// 折叠状态下的一句话结果，只取本步骤记录的产出。
function stepBrief(step, events=[]) {
  const failure=stepFailure(step);
  if (failure) return failure;
  const output=stepOutput(step,events);
  if (!output) return '';
  if (step.tool==='media.extract_frames@1') {
    const count=typeof output.actual_count==='number'?output.actual_count:output.frames?.length;
    return count==null?'':`产出 ${count} 帧`;
  }
  if (step.tool==='media.detect_faces@1') return typeof output.face_count==='number'?`检测到 ${output.face_count} 张人脸`:'';
  if (step.tool==='media.detect_shots@1') return `${output.detector?.model || '切镜检测'} · ${output.segment_count} 个区间`;
  if (step.tool==='media.pair_frames@1') return typeof output.count==='number'?`产出 ${output.count} 对对照图`:'';
  if (step.tool==='media.cut_frames@1') return typeof output.count==='number'?`产出 ${output.count} 帧`:'';
  if (step.tool==='vlm.inspect@1') return `${status(output.status)} · ${(output.dimensions||[]).length} 个维度 · 主要问题 ${(output.dimensions||[]).reduce((n,d)=>n+(d.issues||[]).filter(i=>!i.informational).length,0)} 条`;
  if (step.tool==='vlm.score@1') return (output.dimensions||[]).map(d=>`${d.name} ${scoreText(d)}`).join(' · ') || status(output.status);
  if (step.tool==='vlm.observe@1') {
    const s=output.statistics;
    return s?`${status(output.status)} · 有效记录 ${s.recorded_units}/${s.expected_units}`:status(output.status);
  }
  if ((step.tool||'').startsWith('vlm.judge@')) {
    const dims=Array.isArray(output.dimensions)?output.dimensions:[];
    return dims.map(d=>`${metricName(d.id)} ${d.score==null?'无法评分':d.score}`).join(' · ');
  }
  if (output.asset?.kind==='image') return '产出 1 张图片';
  if (output.asset?.kind==='video') return '产出 1 段视频';
  return '';
}
function plannedBrief(step, steps) {
  if (step.tool==='vlm.observe@1') return '逐项判断 · 不打分';
  if (step.tool==='vlm.inspect@1') return '一次请求 · 四个维度的主要问题与范围';
  if (step.tool==='vlm.score@1') return '纯文字请求 · 各维度 0–10 分';
  if ((step.tool||'').startsWith('vlm.judge@')) return (step.dimension_ids||[]).map(metricName).join('、');
  return stepSettings(step,step.inputs||{},null,true,steps);
}
function caseMaterials(sample={}) {
  const refs=(sample?.reference_images||[]).map((asset,i)=>({asset,label:`参考图 ${i+1}`}));
  const parts=[];
  if (refs.length) parts.push(`<div><strong>参考图 · ${refs.length} 张</strong>${stepThumbs(refs)}</div>`);
  const videos=sampleVideos(sample||{});
  if (videos) parts.push(`<div><strong>视频</strong>${videos}</div>`);
  return parts.length?`<div class="case-materials">${parts.join('')}</div>`:'';
}
function plannedSteps(flow, {title='计划步骤', metricModels=null}={}) {
  const steps=flow?.plan?.steps || [];
  if (!steps.length) return '<p class="empty">计划步骤未记录。</p>';
  return `<h3 class="section-title">${escapeHtml(title)}<small>${steps.length} 步</small></h3><div class="timeline">${steps.map((step,index)=>{
    const model=metricModels && (step.tool==='media.detect_shots@1'?'uva-cv-lab/OmniShotCut_v1.5':isVlmTool(step.tool)?metricModels.model:'');
    const brief=model?`${model} · ${plannedBrief(step,steps)}`:plannedBrief(step,steps);
    return `<details class="block step-card"><summary><span class="step-index">${index+1}</span><span class="step-title">${escapeHtml(metricModels?toolName(step.tool):stepName(step,index))}</span><span class="step-brief">${escapeHtml(brief)}</span></summary>${stepContent(step,null,[],null,flow.prompts||{},null,steps)}</details>`;
  }).join('')}</div>`;
}

// 第五版：一次视觉判读的主要问题与范围，以及按评分标准形成的各维度分数。
const severityNames = {slight:'轻微', obvious:'明显', severe:'严重', pending:'待确认'};
const FULL_SCORE_TEXT = '在本次采样与已判断项目中未发现需扣分的问题';
function scoreText(d) {
  if (d.status==='scored') return `${d.score}/10`;
  return d.status==='unscorable' ? '暂不评分' : '评分无效';
}
function segmentRange(segments, unit) {
  const p=n=>`#${String(n).padStart(2,'0')}`;
  return (segments||[]).map(([a,b])=>unit==='adjacent_pair'?(a===b?`${p(a)}→${p(a+1)}`:`${p(a)}→${p(b+1)}`):(a===b?p(a):`${p(a)}–${p(b)}`)).join('、') || '无';
}
function timeRangeText(ranges) {
  return (ranges||[]).map(([a,b])=>a===b?`${(a/1000).toFixed(2)} 秒`:`${(a/1000).toFixed(2)}–${(b/1000).toFixed(2)} 秒`).join('、');
}
function unitCountText(count, total, unit) {
  return `${count}/${total} ${unit==='adjacent_pair'?'组相邻时刻':'帧'}`;
}
function briefIssueItem(issue, unit, total) {
  const n=(issue.units||[]).length;
  const extra=[issue.pattern, issue.estimated?'范围为估计':'', issue.informational?'只作说明，不扣分':''].filter(Boolean).join(' · ');
  const quantity=issue.estimated?`候选范围含 ${unitCountText(n,total,unit)}，非确定受影响数量`:unitCountText(n,total,unit);
  return `<li><b>${escapeHtml(issue.category)} ${escapeHtml(issue.category_name||'')}</b>：${escapeHtml(issue.problem||'未写说明')}<div class="dim">范围 ${escapeHtml(segmentRange(issue.segments,unit))}（${escapeHtml(timeRangeText(issue.time_ranges_ms))}，${escapeHtml(quantity)}${extra?` · ${escapeHtml(extra)}`:''}）</div></li>`;
}
function briefDimension(d) {
  const total=d.expected_units, unit=d.unit, issues=d.issues||[], unknown=d.unknown||[];
  let html=`<div class="brief-dim"><div class="row"><strong>${escapeHtml(d.name)}</strong>${d.status!=='recorded'?statusPill('incomplete',d.status==='missing'?'回答缺少该维度':'有格式问题'):''}</div>`;
  html+=`<p>${escapeHtml(d.conclusion||'未写结论')}</p>`;
  html+=issues.length?`<ul class="issue-list">${issues.map(i=>briefIssueItem(i,unit,total)).join('')}</ul>`:'<p class="step-note">未返回问题。</p>';
  if (unknown.length) html+=`<p class="step-note">无法判断：${unknown.map(u=>`${escapeHtml(segmentRange(u.segments,unit))}（${escapeHtml(u.reason||'原因未写')}）`).join('；')}</p>`;
  if (d.statistics) html+=`<p class="step-note">去重后涉及问题 ${escapeHtml(unitCountText(d.statistics.problem_unit_count,total,unit))}；无法判断 ${escapeHtml(d.statistics.unknown_unit_count)}。各问题的范围合并计数，不相加。</p>`;
  if (d.statistics?.has_estimated_problems) html+='<p class="step-note">另有问题范围仅为估计，未计入上面的确定数量；暂不给分，需确认范围。</p>';
  if ((d.problems||[]).length) html+=`<ul class="issue-list">${d.problems.map(x=>`<li>${escapeHtml(localizeError(x.message))}</li>`).join('')}</ul>`;
  return html+'</div>';
}
function inspectResults(output) {
  let html=`<p class="step-note">状态：${statusPill(output.status)}${output.request_summary?` 本次请求发送 ${escapeHtml(output.request_summary.image_count)} 张图（参考图 ${escapeHtml(output.request_summary.reference_count)} 张、${output.request_summary.has_source===false?'采样帧':'对照图'} ${escapeHtml(output.request_summary.comparison_count)} 张），一次返回 ${escapeHtml((output.request_summary.dimension_ids||[]).length)} 个维度。`:''}模型只返回主要问题和编号范围，没有逐帧依据；没有提到的采样视为本次未发现问题。</p>`;
  if (!(output.dimensions||[]).length && (output.issues||[]).length) return html+`<ul class="issue-list">${output.issues.map(i=>`<li>${escapeHtml(localizeError(i.message))}</li>`).join('')}</ul>`;
  return html+(output.dimensions||[]).map(briefDimension).join('');
}
function scoreDetail(d) {
  const f=d.facts||{}, a=d.answer||{};
  const word=f.check_id==='temporal_continuity'?'adjacent_pair':'frame';
  let html=`<p><b>${escapeHtml(scoreText(d))}</b> ${escapeHtml(d.status==='scored'&&d.score===10&&!(a.deductions||[]).some(x=>x.points>0)?FULL_SCORE_TEXT:(a.summary||a.unscorable_reason||''))}</p>`;
  if (f.expected_units!=null) html+=`<p class="step-note">有效单元 ${escapeHtml(unitCountText(f.valid_units,f.expected_units,word))}${f.uncovered?.length?`；排除 ${f.uncovered.map(u=>`${escapeHtml(unitText(u.unit))}（${escapeHtml(u.reason)}）`).join('、')}`:''}${f.scorable?'':`；${escapeHtml(f.unscorable_reason||'')}`}。</p>`;
  const rules=Object.fromEntries((f.categories||[]).map(c=>[c.rule_id,c]));
  const rows=(a.deductions||[]).map(x=>{const c=rules[x.rule_id]||{};return `<tr><td>${escapeHtml(x.rule_id)} ${escapeHtml(c.name||'')}</td><td>${escapeHtml(x.problem||'')}</td><td>${escapeHtml(segmentRange(c.segments,word))}<div class="dim">${escapeHtml(c.extent==='occurrences'?`${c.occurrences} 处`:unitCountText(c.unit_count,c.valid_units,word))} · 档位 ${escapeHtml(c.tier)}</div></td><td>${escapeHtml(severityNames[x.severity]||x.severity)}</td><td>−${escapeHtml(x.points)}</td><td>${escapeHtml((x.issues||[]).join('、'))}</td></tr>`;}).join('');
  if (rows) html+=`<table class="face-table observe-table"><thead><tr><th>规则</th><th>问题</th><th>影响范围</th><th>严重程度</th><th>扣分</th><th>依据的问题</th></tr></thead><tbody>${rows}</tbody></table>`;
  const notes=(f.categories||[]).filter(c=>c.informational&&c.unit_count);
  if (notes.length) html+=`<p class="step-note">只作说明、不扣分：${notes.map(c=>`${escapeHtml(c.rule_id)} ${escapeHtml(c.name)} ${escapeHtml(segmentRange(c.segments,word))}`).join('；')}</p>`;
  if (a.coverage_note) html+=`<p class="step-note">覆盖说明：${escapeHtml(a.coverage_note)}</p>`;
  if ((d.issues||[]).length) html+=`<p class="step-note">程序核对发现的问题（该维度评分不采用）：</p><ul class="issue-list">${d.issues.map(i=>`<li>${escapeHtml(localizeError(i.message))}</li>`).join('')}</ul>`;
  return html;
}
function scoreStepResults(output) {
  const std=output.standard;
  let html=`<p class="step-note">状态：${statusPill(output.status)}${std?` 使用评分标准“${escapeHtml(std.title)}”第 ${escapeHtml(std.version)} 版（试用）。`:''}程序核对规则编号、问题编号、数量和算术，不一致的维度不采用分数，也不替模型改分。</p>`;
  html+=(output.dimensions||[]).map(d=>`<details class="block"><summary>${escapeHtml(d.name)} · ${escapeHtml(scoreText(d))}</summary>${scoreDetail(d)}</details>`).join('');
  if ((output.issues||[]).length && !(output.dimensions||[]).length) html+=`<ul class="issue-list">${output.issues.map(i=>`<li>${escapeHtml(localizeError(i.message))}</li>`).join('')}</ul>`;
  return html;
}
function scoreTiles(c, context) {
  const scores=c.result.scores, briefs=Object.fromEntries((c.result.checks||[]).map(k=>[k.check_id,k]));
  const dims=scores.dimensions?.length?scores.dimensions:(c.result.checks||[]).map(k=>({check_id:k.check_id,name:k.name,status:'not_run'}));
  const tiles=dims.map(d=>{
    const a=d.answer||{}, f=d.facts||{}, word=d.check_id==='temporal_continuity'?'adjacent_pair':'frame';
    const deducted=(f.categories||[]).filter(x=>!x.informational&&x.unit_count);
    const main=d.status==='scored'?(d.score===10&&!(a.deductions||[]).some(x=>x.points>0)?FULL_SCORE_TEXT:a.summary):d.status==='unscorable'?(a.unscorable_reason||f.unscorable_reason):d.status==='not_run'?'评分未执行':'评分回答与规则或统计不一致，未采用';
    const range=deducted.map(x=>`${x.rule_id} ${segmentRange(x.segments,word)}`).join('；');
    const tone=d.status==='scored'?'':' fail';
    return `<div class="score-tile observe-tile${tone}"><span class="metric">${escapeHtml(d.name)}</span>`+
      `<span class="value"><span class="score">${d.status==='scored'?escapeHtml(d.score):'—'}</span>${d.status==='scored'?'<span class="of">/ 10</span>':''}</span>`+
      `<span class="observe-line">${escapeHtml(main||'')}</span>${range?`<span class="observe-line dim">影响范围：${escapeHtml(range)}</span>`:''}`+
      `<button class="link-button" data-action="evidence" data-case="${escapeHtml(c.case_id)}" data-step="${escapeHtml(scores.step_id)}" data-context="${context}">查看评分依据</button></div>`;
  }).join('');
  const std=scores.standard;
  const details=dims.filter(d=>d.facts).map(d=>`<details class="block"><summary>${escapeHtml(d.name)} · 评分依据与视觉判读</summary>${scoreDetail(d)}${briefs[d.check_id]?.brief?`<h4>视觉判读</h4>${briefDimension({...briefs[d.check_id].brief,name:d.name,unit:briefs[d.check_id].unit,expected_units:briefs[d.check_id].statistics?.expected_units,statistics:briefs[d.check_id].statistics,status:briefs[d.check_id].status==='complete'?'recorded':'incomplete',problems:briefs[d.check_id].issues})}`:''}</details>`).join('');
  return `<div class="score-grid">${tiles}</div>${details}<p class="step-note">${std?`评分标准：${escapeHtml(std.title)} 第 ${escapeHtml(std.version)} 版，试用参数，尚未与业务判断校准。`:''}各维度独立 0–10 分，不计算总分或是否合格；结论只覆盖每秒 4 帧的采样时刻。</p>`;
}

// 展示转换结束；以下为工作台交互。
'use strict';
const $ = id => document.getElementById(id);
const state = {cases: [], datasets: [], flows: [], metrics: [], tools: [], assets: [], generation: null, run: null, trial: null, flow: null, metric: null, tool: null, proposal: null, timer: null, polling: false};
const labels = {queued:'排队中', preparing:'准备样例', planning:'生成流程', trial:'样例试跑中', running:'运行中', completed:'已完成', failed:'失败', partial_failed:'部分失败', interrupted:'已中断，结果可能未知', cancelled:'已取消', not_run:'未运行', imported:'历史导入', ok:'完成', error:'错误', skipped:'跳过', pass:'通过', fail:'未通过', unscorable:'无法评分', accepted:'已采纳', invalid:'不符合要求', started:'已开始'};
const generationActive = s => ['queued','running','preparing','planning','trial'].includes(s);
let runRequestSerial = 0;
let generationRequestSerial = 0;
let trialRequestSerial = 0;
const status = s => enumNames[s] || '状态未识别';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const statusTones = {ok:['completed','ok','pass','accepted','success','complete'], bad:['failed','error','fail','partial_failed','invalid','invalid_response'], run:['queued','running','preparing','planning','trial','started','planned'], warn:['interrupted','unscorable','incomplete','not_run']};
function statusPill(s, text=status(s)) {
  const tone=Object.keys(statusTones).find(k=>statusTones[k].includes(s));
  return `<span class="status${tone?' tone-'+tone:''}">${escapeHtml(text)}</span>`;
}
function fmtTime(value) {
  const date=value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '时间未记录';
  const two=n=>String(n).padStart(2,'0');
  return `${date.getMonth()+1}月${date.getDate()}日 ${two(date.getHours())}:${two(date.getMinutes())}`;
}
function durationText(start, end) {
  const ms=new Date(end)-new Date(start);
  if (!start || !end || !Number.isFinite(ms) || ms<0) return '';
  const seconds=Math.round(ms/1000);
  return seconds<60 ? `${seconds} 秒` : `${Math.floor(seconds/60)} 分 ${seconds%60} 秒`;
}
const j = value => escapeHtml(JSON.stringify(value ?? '未知', null, 2));
const val = id => $(id).value.trim();
const id = prefix => prefix + '-' + crypto.randomUUID().replaceAll('-', '');
const route = value => encodeURIComponent(value);
const saved = (key, value) => localStorage.setItem('editing-workbench:' + key, JSON.stringify(value));
const read = (key, fallback = null) => { try { return JSON.parse(localStorage.getItem('editing-workbench:' + key)) ?? fallback; } catch { return fallback; } };
const notice = (text, kind = '') => { const e = $('message'); e.hidden = false; e.className = kind; e.textContent = text; };
const errorMessage = err => { const message=String(err.message || '请求失败').replace(/[a-f0-9]{32,}/gi,'[内部记录]').replace(/\b(?:asset|run|trial|generation)-[a-z0-9_-]+/gi,'相关记录').replace(/\bcase\b/gi,'样例').replace(/\b(?:sha256|JSON)\b/gi,'记录'); return /[\u3400-\u9fff]/.test(message) ? localizeError(message) : '操作未完成，请检查所选内容和参数。'; };
// 静态报告（导出到静态网站）：所有数据来自页面里的快照，不访问工作台接口。
function staticApi(path, body) {
  if (body !== undefined) throw new Error('这是导出的静态报告，只能查看，不能提交或修改。');
  const snap = window.STATIC_SNAPSHOT;
  if (path in snap) return structuredClone(snap[path]);
  const events = /^\/api\/runs\/([^/?]+)\/events\?/.exec(path);
  if (events) return {events: [], last_seq: snap[`/api/runs/${events[1]}?view=compact`]?.last_seq ?? 0};
  const summary = /^\/api\/runs\/([^/?]+)\/summary$/.exec(path);
  if (summary && snap[`/api/runs/${summary[1]}?view=compact`]) { const r=snap[`/api/runs/${summary[1]}?view=compact`]; return {status:r.status, progress:r.progress, last_seq:r.last_seq}; }
  throw new Error('静态报告中没有这项内容。');
}
async function api(path, body, options = {}) {
  if (window.STATIC_SNAPSHOT) return staticApi(path, body);
  const headers = {};
  let payload;
  if (body !== undefined) {
    headers['X-Workbench-Request'] = '1';
    if (options.binary) payload = body;
    else { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    if (options.code) headers['X-Confirmation-Code'] = options.code;
  }
  let response;
  try { response = await fetch(path, {method: body === undefined ? 'GET' : 'POST', headers, body: payload, cache:'no-store'}); }
  catch { const e = new Error('连接中断，提交结果可能未知。请先查看已有任务，系统不会自动重发。'); e.unknown = true; throw e; }
  const data = await response.json();
  if (!response.ok) { const e = new Error(data.message || '请求失败'); e.status = response.status; e.code = data.code; throw e; }
  return data;
}
async function busy(button, fn) {
  if (button.disabled) return;
  button.disabled = true;
  try { await fn(); } catch (e) { notice(errorMessage(e), 'error'); } finally { button.disabled = false; }
}
function switchPage(page) {
  document.querySelectorAll('.page').forEach(e => e.hidden = e.id !== 'page-' + page);
  document.querySelectorAll('nav button').forEach(e => e.classList.toggle('selected', e.dataset.page === page));
  // 分析报告是独立的全屏页面：隐藏工作台导航，留出展示空间；刷新时由地址中的 #report= 恢复。
  document.body.classList.toggle('report-mode', page === 'report');
  if(page!=='automatic-evaluation')autoSetReportMode(false);
  if (page !== 'report' && location.hash.startsWith('#report=')) history.replaceState(null, '', location.pathname);
  if (page !== 'ugc-planning' && location.hash.startsWith('#ugc-planning')) history.replaceState(null, '', location.pathname);
  saved('page', page === 'report' ? 'run' : page);
}
function options(node, values, value, label, placeholder = '请选择') {
  const old = node.value;
  node.innerHTML = `<option value="">${placeholder}</option>` + values.map((x,i) => `<option value="${escapeHtml(value(x))}">${escapeHtml(label(x,i))}</option>`).join('');
  if ([...node.options].some(x => x.value === old)) node.value = old;
}
function updateChoices() {
  const c=x=>x.case_id, f=x=>x.plan.plan_id, d=x=>x.dataset_id;
  for (const name of ['generation-case','run-case']) options($(name),state.cases,c,x=>caseName(x.case_id));
  // 新版本排在前面，未选择时默认最新版本；旧版本保留可查看。
  const ordered=[...state.flows].sort((a,b)=>Number(/:r(\d+)$/.exec(b.plan.plan_id)?.[1]||0)-Number(/:r(\d+)$/.exec(a.plan.plan_id)?.[1]||0));
  options($('run-flow'),ordered,f,x=>flowName(x.plan.plan_id)+(x.checks?(x.checks.dimensions?'（一次视觉判读，评分）':'（逐项判读，不打分）'):''));
  if(!$('run-flow').value && ordered.length)$('run-flow').value=ordered[0].plan.plan_id;
  options($('ugc-dataset'),state.datasets,d,x=>x.display_name||x.description||x.dataset_id);
  options($('run-dataset'),state.datasets,d,(x,i)=>read('dataset-names',{})[x.dataset_id] || entityName(x.description || x.dataset_id,'测试集',i));
  $('dataset-cases').innerHTML=state.cases.map(x=>`<option value="${escapeHtml(c(x))}">${escapeHtml(caseName(c(x)))}</option>`).join('');
  options($('tool-asset'),state.assets,x=>x.asset_id,x=>mediaKindLabel(x,state.assets.indexOf(x)),'请选择已上传素材');
}
// getMeta 返回已转义的 HTML，显示在名称下方。
function buttonList(items, action, getId, getLabel, active, getMeta=null) {
  return items.length ? items.map(item => `<button data-action="${action}" data-id="${escapeHtml(getId(item))}" class="${getId(item) === active ? 'active' : ''}"><span class="list-title">${escapeHtml(getLabel(item))}</span>${getMeta?`<span class="list-meta">${getMeta(item)}</span>`:''}</button>`).join('') : '<p class="empty">暂无记录。</p>';
}
function filterRunList() {
  const words=(($('run-search')||{}).value||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
  let shown=0;
  for (const item of document.querySelectorAll('#run-list > button')) {
    const hit=words.every(w=>item.textContent.toLowerCase().includes(w));
    item.hidden=!hit; shown+=hit;
  }
  const none=$('run-list-none');
  if (none) none.hidden=!(words.length && !shown);
}
function runListMeta(run) {
  const plan=run.request?.plan_id || run.flow?.plan?.plan_id;
  return `${statusPill(run.status)}<span>${escapeHtml(fmtTime(run.created_at))}</span>${plan?`<span>${escapeHtml(flowName(plan))}</span>`:''}`;
}
function flowListHTML(flows, active) {
  const groups=[];
  for (const flow of flows) {
    const root=flow.plan.plan_id.replace(/:r\d+$/,'');
    let group=groups.find(g=>g.root===root);
    if (!group) groups.push(group={root,items:[]});
    group.items.push(flow);
  }
  if (!groups.length) return '<p class="empty">暂无记录。</p>';
  return groups.map(group=>{
    const title=flowName(group.items[0].plan.plan_id).replace(/－第 \d+ 版/,'');
    return `<div class="list-group"><div class="list-group-title">${escapeHtml(title)} · ${group.items.length} 个版本</div>${buttonList(group.items,'flow',x=>x.plan.plan_id,x=>flowName(x.plan.plan_id),active,x=>`<span>${escapeHtml((x.plan.steps||[]).length)} 个步骤</span><span>${x.checks?(x.checks.dimensions?`${escapeHtml(x.checks.dimensions.length)} 个维度 · 一次视觉判读${x.scoring?' · 评分':''}`:`${escapeHtml(x.checks.checks.length)} 个判断项 · 不打分`):`${escapeHtml((x.metadata?.metrics||[]).length)} 个指标`}</span>`)}</div>`;
  }).join('');
}
async function refreshCatalogs() {
  const [cases, datasets, flows, metrics, tools] = await Promise.all(['/api/cases','/api/datasets','/api/flows','/api/metrics','/api/tools'].map(x => api(x)));
  const caseNames=read('case-names',{}), flowNames=read('flow-names',{}), items=[], flowRoots=new Set();
  const usable=name=>typeof name==='string' && !!name.trim() && name.length<=200 && !/[\x00-\x1f]/.test(name);
  for(const item of cases) if(!item.display_name && usable(caseNames[item.case_id]))items.push({kind:'case',id:item.case_id,display_name:caseNames[item.case_id]});
  for(const item of flows) {
    const root=item.plan.plan_id.replace(/:r\d+$/,'');
    if(!item.display_name && !flowRoots.has(root) && usable(flowNames[root])) {items.push({kind:'flow',id:item.plan.plan_id,display_name:flowNames[root]});flowRoots.add(root);}
  }
  if(items.length) try {
    for(let i=0;i<items.length;i+=200) {
      const result=await api('/api/display-names/import',{items:items.slice(i,i+200)});
      for(const name of result.items) {
        if(name.kind==='case') {const item=cases.find(x=>x.case_id===name.id);if(item)item.display_name=name.display_name;}
        else flows.filter(x=>x.plan.plan_id.replace(/:r\d+$/,'')===name.id).forEach(x=>x.display_name=name.display_name);
      }
    }
  } catch(e) {notice('旧名称暂未保存到服务，请检查连接后刷新页面。','error');}
  Object.assign(state, {cases,datasets,flows,metrics,tools});
  state.assets = read('assets', []); updateChoices();
  $('flow-list').innerHTML = flowListHTML(flows,state.flow?.plan.plan_id);
  const byId=new Map(metrics.map(x=>[x.metric_id,x]));
  const videoMetrics=VIDEO_GENERATION_METRICS.map(key=>byId.get(key)).filter(Boolean);
  const other=metrics.filter(x=>!VIDEO_GENERATION_METRICS.includes(x.metric_id));
  const metricList=(list,name=metricName)=>buttonList(list,'metric',x=>x.metric_id,x=>name(x.metric_id),state.metric?.metric_id,x=>escapeHtml(x.description||''));
  $('metric-list').innerHTML = `<div class="list-group"><div class="list-group-title">视频生成指标</div>${metricList(videoMetrics,videoMetricName)}</div>`+
    (other.length?`<div class="list-group"><div class="list-group-title">其他指标</div>${metricList(other)}</div>`:'');
  $('tool-list').innerHTML = buttonList(tools,'tool',x=>x.name,x=>toolName(x.name),state.tool?.name,x=>escapeHtml(x.description.replace(/\s*\bfps\b\s*/g,'每秒帧数')));
}
async function refreshRuns() {
  const runs = await api('/api/runs'); state.runs=runs;
  $('run-list').innerHTML = buttonList(runs,'run',x=>x.run_id,x=>runName(x,{short:true}),state.run?.run_id,runListMeta);
  filterRunList(); if (state.tasks) renderTaskList();
  const archived = await api('/api/runs/archived').catch(()=>[]);
  $('archived-list').innerHTML = archived.length
    ? archived.map(r=>`<div class="archived-row"><span><b>${escapeHtml(runName(r))}</b><span class="dim">${escapeHtml(fmtTime(r.created_at))} 运行 · ${escapeHtml(fmtTime(r.archived_at))} 删除</span></span><button class="btn small" data-action="restore-run" data-id="${escapeHtml(r.run_id)}">恢复</button></div>`).join('')
    : '<p class="empty">没有已删除的记录。</p>';
}
async function upload(file) {
  if (!file) throw new Error('请选择文件。');
  const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
  if (!kind) throw new Error('请选择图片或视频文件。');
  const result = await api('/api/assets?kind=' + kind, file, {binary:true});
  state.assets = [...state.assets.filter(x=>x.asset_id !== result.asset_id), {asset_id:result.asset_id, kind:result.kind, name:file.name}];
  saved('assets',state.assets); updateChoices(); return result;
}
function linkAssets(value,ctx={}) {
  const found=[], seen=new Set(), counts={};
  function knownRole(asset) {
    const cases=[...(state.run?.cases||[]),...(state.generation?.run?.cases||[]),...state.cases];
    for(const item of cases) {
      const sample=item.input?.sample||item.sample?.media||{},output=item.output?.media||{};
      const same=x=>x && ((asset.asset_id && x.asset_id===asset.asset_id)||(asset.uri && x.uri===asset.uri));
      const refs=sample.reference_images||[];const index=refs.findIndex(same);
      if(index>=0)return `参考图 ${index+1}`;
      if(same(sample.output_video||output.output_video))return '生成结果视频';
      if(same(sample.source_video))return '输入视频';
      if(same(sample.ideal_image||sample.ideal_video||item.ideal_example))return '理想效果';
    }
    return '';
  }
  function role(path,kind,asset) {
    if(ctx.trial) {
      if(path.includes('parameters'))return kind==='image'?'输入图片':'输入视频';
      return `${toolName(ctx.step?.tool)}－${kind==='image'?'结果图片':'结果视频'}`;
    }
    if(kind==='video' && path.includes('video') && ctx.step) {
      const step=stepName(ctx.step,ctx.index||0);
      if(step==='采样生成结果帧')return '生成结果视频';
      if(step==='采样输入视频帧')return '输入视频';
    }
    const frame=path.findIndex(p=>['frames','output_frames','source_frames','ideal_video_frames'].includes(p));
    if(frame>=0) {
      const group=path[frame]==='source_frames'?'输入视频':path[frame]==='ideal_video_frames'?'理想效果':path[frame]==='output_frames'?'生成结果':ctx.step ? stepName(ctx.step,ctx.index||0):'视频';
      const n=Number(path[frame+1]);return `${group}－采样帧 ${Number.isFinite(n)?n+1:1}`;
    }
    const ref=path.findIndex(p=>p==='reference_images'||p==='references');
    if(ref>=0) return '参考图 '+(Number(path[ref+1]||0)+1);
    if(path.some(p=>['ideal_example','ideal_image','ideal_video'].includes(p)))return '理想效果';
    if(path.some(p=>p==='source_video'||p==='source'))return '输入视频';
    if(path.some(p=>p==='output_video'||p==='output'))return '生成结果视频';
    const known=knownRole(asset);if(known)return known;
    if(ctx.step) return `${stepName(ctx.step,ctx.index||0)}－${kind==='image'?'图片':'视频'}产物`;
    return kind==='image'?'图片素材':'视频素材';
  }
  function visit(x,path=[]) {
    if(!x||typeof x!=='object')return;
    if(path.includes('metadata') || path.includes('parent_mapping'))return;
    if(Array.isArray(x)){x.forEach((v,i)=>visit(v,[...path,String(i)]));return;}
    let url=typeof x.uri==='string'&&x.uri.startsWith('/api/')?x.uri:null;
    if(!url&&x.asset_id&&x.kind&&state.assets.some(a=>a.asset_id===x.asset_id))url='/api/assets/'+route(x.asset_id)+'/preview';
    if(url&&['image','video'].includes(x.kind)) {
      const uploaded=state.assets.find(a=>a.asset_id===x.asset_id), name=niceFilename(uploaded?.name,'');
      const label=role(path,x.kind,x)+(name?' · '+name:''),key=url+':'+label;
      if(!seen.has(key)){seen.add(key);counts[label]=(counts[label]||0)+1;found.push({url,kind:x.kind,label:label+(counts[label]>1?' '+counts[label]:'')});}
    }
    Object.entries(x).forEach(([k,v])=>visit(v,[...path,k]));
  }
  visit(value); if(!found.length)return '';
  return '<div class="media-grid">'+found.map(x=>`<div class="media-item">${x.kind==='image'?`<img loading="lazy" src="${escapeHtml(x.url)}" alt="${escapeHtml(x.label)}">`:`<video controls preload="none" aria-label="${escapeHtml(x.label)}" src="${escapeHtml(x.url)}"></video>`}<a href="${escapeHtml(x.url)}" target="_blank" rel="noopener">查看${escapeHtml(x.label)}</a> <a href="${escapeHtml(x.url)}" download="${escapeHtml(x.label)}">下载${escapeHtml(x.label)}</a></div>`).join('')+'</div>';
}
function responseLinks(value) {
  const refs=new Set();
  function visit(x){if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(visit);return;}for(const [k,v] of Object.entries(x)){if(k==='raw_response_ref'&&typeof v==='string'&&/^\/api\/artifacts\/[a-f0-9]{64}$/.test(v))refs.add(v);else visit(v);}}
  visit(value); return [...refs].map(url=>`<div><a href="${escapeHtml(url)}" download="视觉模型原始回答.json">下载视觉模型原始回答</a></div>`).join('');
}
function detail(title,value,open=false,ctx={}) { return structuredDetail(title,value,open,ctx); }
function scoreRange(run, metricId) {
  const dim=(run?.flow?.rubric?.dimensions||[]).find(d=>d.id===metricId);
  return {max:dim?.score_range?.[1], threshold:dim?.threshold};
}
function renderObservations(run,context) {
  return (run?.cases||[]).map(c=>{
    const events=(run.events||[]).filter(e=>e.case_id===c.case_id), sent=events.filter(e=>e.kind==='vlm_request').length, reused=events.filter(e=>e.kind==='vlm_response_reused').length;
    const origin=events.find(e=>e.kind==='case_reused')?.payload?.source_run_id;
    const counts=run.request?.execution_mode==='live'?`模型实际请求 ${sent} 次${reused?` · 复用已有真实回答 ${reused} 次`:''}${origin?` · 已评测结果复用，来源 ${origin}`:''}`:`响应回放 ${sent+reused} 次`;
    const checks=c.result?.checks||[];
    if (c.result?.scores) return `<div class="case-block"><div class="row"><strong>${escapeHtml(caseName(c.case_id))}</strong>${statusPill(c.status)}<span class="dim">${escapeHtml(counts)}</span></div>${c.error?`<p class="step-note">${escapeHtml(localizeError(c.error.message||'样例运行未完成，原因未记录。'))}</p>`:''}${scoreTiles(c,context)}</div>`;
    const tiles=checks.map(k=>{
      const s=k.statistics, word=k.unit==='adjacent_pair'?'组':'帧';
      const rolls=Object.values(s?.rollups||{}).map(r=>r.kind==='completion'?`编辑要求全部完成 ${r.all_done} ${word}，部分 ${r.partial}，未完成 ${r.none}，无法判断 ${r.unknown}`:`${r.label} ${r.count} ${word}`);
      const first=Object.values(s?.fields||{})[0];
      const lines=rolls.length?rolls:(first?[`${first.attention===1?first.one:first.zero} ${first.attention===1?first.count_1:first.count_0} ${word}`]:[]);
      return `<div class="score-tile observe-tile"><span class="metric">${escapeHtml(k.name)}</span><span class="foot">${statusPill(k.status)}${s?`<span>有效记录 ${escapeHtml(s.recorded_units)}/${escapeHtml(s.expected_units)} ${word}</span>`:''}</span>`+
        `${lines.map(x=>`<span class="observe-line">${escapeHtml(x)}</span>`).join('')}${k.error?`<span class="observe-line">${escapeHtml(errorNames[k.error.code]||localizeError(k.error.message||''))}</span>`:''}`+
        `<button class="link-button" data-action="evidence" data-case="${escapeHtml(c.case_id)}" data-step="${escapeHtml(k.step_id)}" data-context="${context}">查看逐项依据</button></div>`;
    }).join('');
    return `<div class="case-block"><div class="row"><strong>${escapeHtml(caseName(c.case_id))}</strong>${statusPill(c.status)}<span class="dim">${escapeHtml(counts)}</span></div>${c.error?`<p class="step-note">${escapeHtml(localizeError(c.error.message||'样例运行未完成，原因未记录。'))}</p>`:''}`+
      (checks.length?`<div class="score-grid observe-grid">${tiles}</div>`:'<p class="empty">暂无判读结果。</p>')+'<p class="step-note">本流程只给逐项判断和数量统计，不计算分数；模型回答可能随调用变化，结果需人工体验确认。</p></div>';
  }).join('');
}
function isObservationRun(run) { return run?.flow?.plan?.schema_version==='editing-plan/3'; }
function renderScores(run,context) {
  if (isObservationRun(run)) return renderObservations(run,context);
  return (run?.cases||[]).map(c=>{
    const dims=c.result?.dimensions||[];
    const tiles=dims.map(d=>{
      const range=scoreRange(run,d.id), tone=d.decision==='pass'?' pass':d.decision==='fail'?' fail':'';
      return `<div class="score-tile${tone}"><span class="metric">${escapeHtml(metricName(d.id))}</span>`+
        `<span class="value"><span class="score">${d.score==null?'—':escapeHtml(d.score)}</span>${d.score!=null&&range.max!=null?`<span class="of">/ ${escapeHtml(range.max)}</span>`:''}</span>`+
        `<span class="foot">${d.decision?statusPill(d.decision):''}${range.threshold!=null?`<span>阈值 ${escapeHtml(range.threshold)}</span>`:''}</span>`+
        `<button class="link-button" data-action="evidence" data-case="${escapeHtml(c.case_id)}" data-step="${escapeHtml(d.step_id)}" data-context="${context}">查看评分依据</button></div>`;
    }).join('');
    return `<div class="case-block"><div class="row"><strong>${escapeHtml(caseName(c.case_id))}</strong>${statusPill(c.status)}</div>${c.error?`<p class="step-note">${escapeHtml(localizeError(c.error.message||'样例运行未完成，原因未记录。'))}</p>`:''}`+
      (dims.length?`<div class="score-grid">${tiles}</div>`:'<p class="empty">暂无可用评分。</p>')+'</div>';
  }).join('');
}
function renderSteps(run,context) {
  const events=run?.events||[],cases=run?.cases||[],planSteps=run?.flow?.plan?.steps||[];
  if(!events.length&&!cases.some(c=>c.result?.steps?.length))return '<p class="empty">没有可用步骤记录；缺失的信息为未知。</p>';
  let html='';
  for(const c of cases) {
    const ev=events.filter(x=>x.case_id===c.case_id),steps=c.result?.steps||[];
    const names=[...new Set([...steps.map(x=>x.step_id),...ev.map(x=>x.step_id).filter(Boolean)])];
    html+=`<h3 class="section-title">${escapeHtml(caseName(c.case_id))} · 步骤与材料<small>${names.length} 步</small></h3>${caseMaterials(c.input?.sample)}`;
    if(!names.length){html+='<p class="empty">没有该样例的步骤记录。</p>';continue;}
    html+='<div class="timeline">';
    names.forEach((stepId,index)=>{
      const relevant=ev.filter(x=>x.step_id===stepId),planStep=planSteps.find(x=>x.id===stepId);
      const step=steps.find(x=>x.step_id===stepId) || [...relevant].reverse().find(x=>x.payload?.record)?.payload.record || {step_id:stepId,tool:planStep?.tool || relevant.find(x=>x.payload?.tool)?.payload.tool};
      const shown=planStep||step||{id:stepId};
      const target=`${context}-${encodeURIComponent(c.case_id)}-${encodeURIComponent(stepId)}`;
      const brief=stepBrief({...step,tool:step.tool||shown.tool},relevant);
      html+=`<details class="block event-target step-card" id="${escapeHtml(target)}"><summary><span class="step-index">${index+1}</span><span class="step-title">${escapeHtml(stepName(shown,index))}</span><span class="step-brief">${escapeHtml(brief)}</span>${statusPill(step.status,step.status?status(step.status):'状态未记录')}</summary>${stepContent(planStep,step,relevant,c.input?.sample,run.flow?.prompts||{},c.result,planSteps)}</details>`;
    });
    html+='</div>';
  }
  return html;
}
// 面向设计师、产品经理的直观展示：先结论，再看画面证据；技术细节收起。
const RATINGS=[[9,'优秀','good'],[7,'良好','fine'],[5,'一般','warn'],[0,'较差','bad']];
function rating(d) {
  if (!d) return {word:'未评分',tone:'none'};
  if (d.status!=='scored') return {word:'待确认',tone:'pending'};
  const [, word, tone]=RATINGS.find(([min])=>d.score>=min);
  return {word,tone};
}
function ratingChip(d) { const r=rating(d); return `<span class="rating rating-${r.tone}">${r.word}</span>`; }
function ratingOfMean(mean) { return mean==null ? {word:'未评分',tone:'none'} : rating({status:'scored',score:mean}); }
function casePairs(c) {
  const step=(c?.result?.steps||[]).find(s=>/pair_frames|cut_frames/.test(s.tool||''));
  return step?.attempts?.at(-1)?.data?.pairs || [];
}
// 参考图生成视频等任务没有原视频，采样图只有生成结果，并标明属于提示词的哪个镜头。
function hasSource(pairs) { return !pairs.length || pairs.some(p=>p.source); }
function frameLabel(pair) { return `${sec(pair.time_ms/1000)} 秒${pair.cut?` · 镜头 ${pair.cut.index}`:''}`; }
function secondsOf(pairs, index) { const p=pairs[index-1]; return p ? p.time_ms/1000 : null; }
function sec(value) { return value==null ? '?' : (Math.round(value*10)/10).toString(); }
function plainify(text, pairs=[]) {
  // 模型原文用采样编号（#03、采样帧 3–20）和“左侧/右侧”；换成秒数和“原视频/生成结果”。
  return String(text||'')
    .replace(/(?:采样帧\s*|#)(\d{1,2})\s*(?:→|–|—|-|~|至)\s*#?(\d{1,2})/g,(_,a,b)=>`${sec(secondsOf(pairs,+a))}–${sec(secondsOf(pairs,+b))} 秒`)
    .replace(/(?:采样帧\s*|#)(\d{1,2})(?![\d.])/g,(_,a)=>`${sec(secondsOf(pairs,+a))} 秒`)
    .replace(/左侧(?:的)?原(?:视频|片)|原(?:视频|片)(?:的)?左侧/g,'原视频')
    .replace(/右侧(?:的)?(?:生成)?结果(?:视频)?|(?:生成)?结果(?:视频)?(?:的)?右侧/g,'生成结果')
    .replace(/左侧/g,'原视频').replace(/右侧/g,'生成结果')
    .replace(/(?:原视频)+/g,'原视频').replace(/(?:生成结果)+(?:结果(?!果))?/g,'生成结果');
}
function whenText(issue, pairs) {
  const units=issue.units||[];
  if (pairs.length && units.length>=pairs.length) return '全程';
  return (issue.time_ranges_ms||[]).map(([a,b])=>a===b?`${sec(a/1000)} 秒`:`${sec(a/1000)}–${sec(b/1000)} 秒`).join('、') || '时间未记录';
}
function pickFrames(units, count=3) {
  // 时间连续性按“相邻两帧”记录，单元形如 [a, b]，取前一帧作为配图。
  const list=[...new Set((units||[]).map(u=>Array.isArray(u)?u[0]:u))].sort((a,b)=>a-b);
  if (list.length<=count) return list;
  return [...new Set([list[0], list[Math.floor((list.length-1)/2)], list[list.length-1]])];
}
function frameStrip(units, pairs, count=3) {
  const frames=pickFrames(units, count).map(u=>({u, pair:pairs[u-1]})).filter(x=>x.pair);
  if (!frames.length) return '';
  const group=`strip-${++lightboxSerial}`;
  return `<div class="frame-strip">${frames.map(({pair})=>{
    const url=stepMediaURL(pair.comparison), label=frameLabel(pair);
    const caption=pair.source?`${label} · 左：原视频　右：生成结果`:`${label}${pair.cut?.title?`（${pair.cut.title}）`:''} · 生成结果`;
    return `<figure>${url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener" title="查看大图" data-lightbox="${group}" data-caption="${escapeHtml(caption)}"><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(label)}的${pair.source?'对照图':'画面'}"></a>`:'<div class="step-missing-image">图片未保留</div>'}<figcaption>${escapeHtml(label)}</figcaption></figure>`;
  }).join('')}</div>`;
}
function friendlyIssue(issue, pairs) {
  const tags=[whenText(issue,pairs), issue.estimated?'出现位置不确定':''].filter(Boolean).join(' · ');
  return `<div class="f-issue"><div class="f-issue-head"><b>${escapeHtml(issue.category_name||'问题')}</b><span class="dim">${escapeHtml(tags)}</span></div>`+
    `<p>${escapeHtml(plainify(issue.problem,pairs))}</p>${frameStrip(issue.units,pairs)}</div>`;
}
function friendlyDimension(dim, check, pairs) {
  const brief=check?.brief||{}, issues=(brief.issues||[]).filter(issueCounted), notes=(brief.issues||[]).filter(i=>i.informational);
  const conclusion=plainify(brief.conclusion || dim?.answer?.summary || '', pairs);
  let html=`<section class="f-dim f-${rating(dim).tone}"><div class="f-dim-head"><h4>${escapeHtml(dim?.name||check?.name||'')}</h4>${ratingChip(dim)}`+
    `${dim?.status==='scored'?`<span class="f-score">${escapeHtml(dim.score)}<small> / 10</small></span>`:''}</div>`;
  if (conclusion) html+=`<p class="f-conclusion">${escapeHtml(conclusion)}</p>`;
  if (dim && dim.status!=='scored') html+=`<p class="f-note">这一项暂不打分：发现了问题，但模型说不准问题具体出现在哪些画面，需要人工看一下确认。</p>`;
  const f=dim?.facts;
  if (dim?.status==='scored' && f?.expected_units && f.valid_units < f.expected_units*0.8)
    html+=`<p class="f-note">${escapeHtml(f.expected_units)} 张画面中只有 ${escapeHtml(f.valid_units)} 张能看清这一项，分数只按看得清的画面计算。</p>`;
  html+=issues.length?issues.map(i=>friendlyIssue(i,pairs)).join(''):'<p class="f-ok">没有发现问题。</p>';
  if (notes.length) html+=`<details class="f-notes"><summary>${hasSource(pairs)?'原视频本身的变化':'补充说明'}（不算问题，${notes.length} 条）</summary>${notes.map(i=>friendlyIssue(i,pairs)).join('')}</details>`;
  return html+'</section>';
}
let lightboxSerial = 0;
function mediaFigure(asset, label, kind) {
  const url=stepMediaURL(asset);
  if (!url) return '';
  return `<figure class="f-media-item">${kind==='video'?`<video controls playsinline preload="metadata" src="${escapeHtml(url)}"></video>`:`<a href="${escapeHtml(url)}" target="_blank" rel="noopener" data-lightbox="media-${lightboxSerial}" data-caption="${escapeHtml(label)}"><img src="${escapeHtml(url)}" alt="${escapeHtml(label)}"></a>`}<figcaption>${escapeHtml(label)}</figcaption></figure>`;
}
function friendlyMedia(sample={}) {
  const refs=(sample.reference_images||[]).map((r,i,all)=>mediaFigure(r, all.length>1?`参考图 ${i+1}`:'参考图','image'));
  const items=[...refs, mediaFigure(sample.source_video,'原视频','video'), mediaFigure(sample.output_video,'生成结果','video')].filter(Boolean);
  if (!items.length) return '';
  const videos=[sample.source_video,sample.output_video].filter(v=>stepMediaURL(v)).length;
  return `<div class="f-media">${items.join('')}</div>${videos>1?syncBar():''}`;
}
function friendlyCase(run, c, context) {
  const dims=c.result?.scores?.dimensions||[], checks=Object.fromEntries((c.result?.checks||[]).map(k=>[k.check_id,k]));
  const pairs=casePairs(c), counts={};
  for (const d of dims) { const w=rating(d).word; counts[w]=(counts[w]||0)+1; }
  const tally=['优秀','良好','一般','较差','待确认'].filter(w=>counts[w]).map(w=>`${w} ${counts[w]} 项`).join('，');
  let html=`<div class="f-case">${friendlyMedia(c.input?.sample)}`;
  if (!dims.length) html+=`<p class="f-note">${c.error?escapeHtml(localizeError(c.error.message||'这条样例没有评完。')):'这条样例还没有评分结果。'}</p>`;
  else html+=`<p class="f-tally">共 ${dims.length} 个方面：${escapeHtml(tally)}。<span class="dim">${hasSource(pairs)?'每张小图左边是原视频、右边是生成结果，点击可看大图。':'小图是生成视频在对应时刻的画面，标出了属于提示词的第几个镜头，点击可看大图。'}</span></p>${dims.map(d=>friendlyDimension(d,checks[d.check_id],pairs)).join('')}`;
  const sub={...run, cases:[c], events:(run.events||[]).filter(e=>e.case_id===c.case_id)};
  return html+`<details class="f-tech"><summary>技术细节（开发者查看：评分依据、模型请求与步骤记录）</summary>${renderScores(sub,context)}${renderSteps(sub,context)}</details></div>`;
}

// 批量运行：先给整体汇总，单个样例的完整结果按需展开。
function isBatchRun(run) { return (run?.cases||[]).length>1 && (run.cases||[]).some(c=>c.result?.scores); }
function batchDimensions(run) {
  const seen=new Map();
  for (const c of run.cases||[]) for (const d of c.result?.scores?.dimensions||[]) if (!seen.has(d.check_id)) seen.set(d.check_id,d.name);
  return [...seen].map(([id,name])=>({id,name}));
}
function caseDimension(c, dimId) { return (c.result?.scores?.dimensions||[]).find(d=>d.check_id===dimId); }
function oneDecimal(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
function batchCellTitle(c, dim, d) {
  if (!d) return `${caseName(c.case_id)} · ${dim.name}：${c.error?localizeError(c.error.message||'样例未完成'):'未评分'}`;
  const a=d.answer||{};
  const lines=[`${caseName(c.case_id)} · ${dim.name}：${scoreText(d)}`];
  for (const x of a.deductions||[]) if (x.points>0) lines.push(`−${x.points} ${x.rule_id} ${x.problem||''}`);
  if (lines.length===1) lines.push(d.status==='scored'?FULL_SCORE_TEXT:(a.unscorable_reason||d.facts?.unscorable_reason||'评分回答未采用'));
  return lines.join('\n');
}
function batchCell(c, dim, context) {
  const d=caseDimension(c,dim.id), title=escapeHtml(batchCellTitle(c,dim,d));
  if (d?.status==='scored') {
    const lost=Math.round(Math.max(0,Math.min(10,10-d.score)));
    return `<td class="batch-cell" title="${title}"><button class="batch-score lost-${lost}" data-action="run-case" data-case="${escapeHtml(c.case_id)}" data-context="${context}">${escapeHtml(d.score)}</button></td>`;
  }
  const text=d?(d.status==='unscorable'?'待确认':'未采用'):(c.status==='failed'||c.error?'没评完':'未评分');
  return `<td class="batch-cell" title="${title}"><button class="batch-score empty-cell" data-action="run-case" data-case="${escapeHtml(c.case_id)}" data-context="${context}">${text}</button></td>`;
}
function batchIssues(run) {
  // 取视觉判读中的问题而不是扣分记录：暂不评分的维度也有问题，不能漏掉。
  const issues=new Map();
  for (const c of run.cases||[]) for (const k of c.result?.checks||[]) {
    for (const issue of k.brief?.issues||[]) {
      if (!issueCounted(issue)) continue;
      const key=k.check_id+'|'+(issue.category||issue.category_name);
      const item=issues.get(key)||{dim:k.name,name:issue.category_name||issue.category||'问题',cases:new Set(),frames:0,example:null};
      item.cases.add(c.case_id); item.frames+=(issue.units||[]).length;
      if (!item.example || (issue.units||[]).length>(item.example.issue.units||[]).length) item.example={c,issue};
      issues.set(key,item);
    }
  }
  return [...issues.values()].sort((a,b)=>b.cases.size-a.cases.size||b.frames-a.frames);
}
// 维度圆环仪表：初始为空，渲染后由 animateGauges 补满并滚动数字。
const GAUGE_R = 50, GAUGE_C = 2 * Math.PI * GAUGE_R;
let gaugeSerial = 0;
function gaugeCard(name, mean, r, foot) {
  const id = `gauge-grad-${++gaugeSerial}`, value = mean == null ? 0 : mean;
  return `<div class="gauge"><svg viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">`+
    `<stop offset="0" stop-color="#96bea0"/><stop offset=".55" stop-color="#eec496"/><stop offset="1" stop-color="#e07a54"/></linearGradient></defs>`+
    `<circle cx="64" cy="64" r="${GAUGE_R}" fill="none" stroke="rgba(244,236,226,.08)" stroke-width="10"/>`+
    `<circle class="gauge-arc" data-value="${value}" cx="64" cy="64" r="${GAUGE_R}" fill="none" stroke="url(#${id})" stroke-width="10" stroke-linecap="round" `+
    `stroke-dasharray="${GAUGE_C.toFixed(2)}" stroke-dashoffset="${GAUGE_C.toFixed(2)}" transform="rotate(-90 64 64)"/></svg>`+
    `<div class="gauge-num"><span class="gauge-count" data-value="${value}">${mean == null ? '—' : '0.0'}</span>${mean == null ? '' : '<small> / 10</small>'}</div>`+
    `<h4>${escapeHtml(name)}</h4><div class="gauge-foot">${escapeHtml(foot)}</div><span class="rating rating-${r.tone}">${r.word}</span></div>`;
}
function animateGauges(root, instant = false) {
  const still = instant || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll('.gauge-arc').forEach(arc => {
    const target = GAUGE_C * (1 - (+arc.dataset.value) / 10);
    if (still) { arc.style.transition = 'none'; arc.style.strokeDashoffset = target; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => { arc.style.strokeDashoffset = target; }));
  });
  root.querySelectorAll('.gauge-count').forEach(el => {
    if (el.textContent === '—') return;
    const end = +el.dataset.value;
    if (still) { el.textContent = oneDecimal(end); return; }
    const t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? (end * e).toFixed(1) : oneDecimal(end); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function shortCaseName(caseId) { return caseName(caseId).split(' · ')[0]; }
function tinyCaseName(caseId) { return shortCaseName(caseId).split(/\s+/).pop(); }
function issueCard(item, total, context) {
  const {c, issue}=item.example, pairs=casePairs(c), units=issue.units||[];
  const pair=pairs[(pickFrames(units,1)[0]||1)-1], url=pair?stepMediaURL(pair.comparison):null;
  return `<article class="issue-card">${url?`<a class="issue-thumb" href="${escapeHtml(url)}" target="_blank" rel="noopener" title="查看大图" data-lightbox="issues" data-caption="${escapeHtml(`${item.name}（${shortCaseName(c.case_id)} · ${frameLabel(pair)}）`)}"><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(item.name)}的例子"></a>`:''}`+
    `<div class="issue-body"><div class="issue-title"><b>${escapeHtml(item.name)}</b><span class="tag">${escapeHtml(item.dim)}</span></div>`+
    `<div class="issue-share"><span class="share"><i class="share-${Math.round(item.cases.size/total*10)}"></i></span>${total} 条里有 <b>${item.cases.size}</b> 条</div>`+
    `<p>例：${escapeHtml(plainify(issue.problem,pairs))}<span class="dim">（${escapeHtml(shortCaseName(c.case_id))}）</span></p>`+
    `<div class="issue-cases">${[...item.cases].map(id=>`<button class="chip" data-action="run-case" data-case="${escapeHtml(id)}" data-context="${context}" title="${escapeHtml(caseName(id))}">${escapeHtml(tinyCaseName(id))}</button>`).join('')}</div></div></article>`;
}
function renderBatchOverview(run, context) {
  const cases=run.cases||[], dims=batchDimensions(run), total=cases.length;
  const failed=cases.filter(c=>c.status==='failed'||c.status==='error'||(c.error&&!(c.result?.scores?.dimensions||[]).length));
  const failureReason=c=>{
    const stepError=e=>e.payload?.result?.error||e.payload?.error;
    const step=[...(run.events||[])].reverse().find(e=>e.case_id===c.case_id&&e.kind==='attempt_finished'&&stepError(e));
    const err=step?stepError(step):c.error;
    const where=step?` · 步骤“${stepName((run.flow?.plan?.steps||[]).find(x=>x.id===step.step_id)||{id:step.step_id})}”`:'';
    return (errorNames[err?.code]&&err?.message?`${errorNames[err.code]}：${localizeError(err.message)}`:localizeError(err?.message||'样例运行未完成，原因未记录。'))+where;
  };
  const scoredCases=cases.filter(c=>(c.result?.scores?.dimensions||[]).some(d=>d.status==='scored')).length;
  const kpis=[], means=[];
  for (const dim of dims) {
    const scores=cases.map(c=>caseDimension(c,dim.id)).filter(d=>d?.status==='scored').map(d=>d.score);
    const mean=scores.length?scores.reduce((s,x)=>s+x,0)/scores.length:null, r=ratingOfMean(mean);
    const full=scores.filter(x=>x===10).length, pending=total-scores.length;
    if (mean!=null) means.push({name:dim.name, mean, word:r.word});
    kpis.push(gaugeCard(dim.name, mean, r,
      `${scores.length?`${scores.length} 条里 ${full} 条满分 · 最低 ${Math.min(...scores)} 分`:'暂无分数'}${pending?` · ${pending} 条待确认`:''}`));
  }
  means.sort((a,b)=>b.mean-a.mean);
  const best=means[0], worst=means[means.length-1];
  const headline=[`${total} 条样例中 ${scoredCases} 条完成评分${failed.length?`，${failed.length} 条没有评完`:''}。`,
    best&&worst&&best!==worst?`表现最好的是“${best.name}”（平均 ${oneDecimal(best.mean)} 分，${best.word}），最需要改进的是“${worst.name}”（平均 ${oneDecimal(worst.mean)} 分，${worst.word}）。`:'',
  ].join('');
  const head=`<tr><th class="batch-case-col">样例</th>${dims.map(d=>`<th>${escapeHtml(d.name)}</th>`).join('')}<th>状态</th></tr>`;
  const rows=cases.map(c=>{
    const rest=caseName(c.case_id).split(' · ').slice(1).join(' · ');
    return `<tr><th class="batch-case-col"><button class="case-link" data-action="run-case" data-case="${escapeHtml(c.case_id)}" data-context="${context}" title="${escapeHtml(caseName(c.case_id))}"><b>${escapeHtml(tinyCaseName(c.case_id))}</b>${rest?`<small>${escapeHtml(rest)}</small>`:''}</button></th>${dims.map(d=>batchCell(c,d,context)).join('')}<td>${statusPill(c.status)}</td></tr>`;
  }).join('');
  const legend=`<div class="batch-legend"><span>分数</span><span class="ramp">${Array.from({length:11},(_,i)=>`<i class="lost-${10-i}"></i>`).join('')}</span><span>0 → 10</span><span class="dim">越红越醒目问题越多，高分格子颜色最淡；鼠标停在格子上可看扣分原因，点击查看这条样例的画面和问题。</span></div>`;
  const issues=batchIssues(run), top=issues.slice(0,6), rest=issues.slice(6);
  const withSource=hasSource(cases.flatMap(c=>casePairs(c)));
  const failures=failed.map(c=>`<li><button class="link-button" data-action="run-case" data-case="${escapeHtml(c.case_id)}" data-context="${context}">${escapeHtml(caseName(c.case_id))}</button>：${escapeHtml(failureReason(c))}</li>`).join('');
  return `<p class="f-headline">${escapeHtml(headline)}</p><div class="gauges${kpis.length===5?' n5':''}">${kpis.join('')}</div>`+
    `<h3 class="section-title">每条样例的得分<small>点击样例或分数，在右侧查看视频对比与问题画面</small></h3><div class="batch-table-wrap"><table class="batch-table"><thead>${head}</thead><tbody>${rows}</tbody></table></div>${legend}`+
    (top.length?`<h3 class="section-title">最常见的问题<small>按出现的样例数排序；${withSource?'图片左边是原视频、右边是生成结果':'图片是生成视频中出现该问题的画面'}</small></h3><div class="issue-cards">${top.map(i=>issueCard(i,total,context)).join('')}</div>`+
      (rest.length?`<details class="f-notes"><summary>其余 ${rest.length} 类问题</summary><div class="issue-cards">${rest.map(i=>issueCard(i,total,context)).join('')}</div></details>`:''):'')+
    (failures?`<h3 class="section-title">没有评完的样例<small>${failed.length} 条</small></h3><ul class="issue-list">${failures}</ul>${retryButton(run,context)?`<div class="actions">${retryButton(run,context)}</div>`:''}`:'')+
    `<p class="step-note">评分标准还在试用阶段，分数适合用来比较不同模型或版本，不代表是否合格；${withSource?'结论基于每秒 4 帧的画面抽样，两帧之间的短暂闪烁可能看不到。':'结论基于按提示词镜头的画面抽样（每个镜头 2–6 帧），两帧之间的短暂问题可能看不到；声音、台词和口型本次不评。'}</p>`;
}
function retryPlan(run) {
  const req=run?.request||{}, cases=run?.cases||[];
  if (!['partial_failed','failed'].includes(run?.status) || !req.dataset_id || run?.flow?.plan?.schema_version!=='editing-plan/3') return null;
  const done=cases.filter(c=>c.status==='completed'), failed=cases.filter(c=>c.status!=='completed');
  if (!failed.length) return null;
  // 已完成样例若本身沿用自更早的运行，直接指向最初来源。
  const reuse=Object.fromEntries(done.map(c=>[c.case_id, req.reuse_cases?.[c.case_id]||run.run_id]));
  return {failed, done, payload:{run_id:id('run'), plan_id:req.plan_id, dataset_id:req.dataset_id, idempotency_key:'retry-'+run.run_id,
    ...(req.budget?{budget:req.budget}:{}), ...(done.length?{reuse_cases:reuse}:{repeat:true})}};
}
function retryButton(run, context) {
  const plan=retryPlan(run);
  return plan?`<button class="btn primary small" data-action="retry-failed" data-context="${context}">重新测试失败的 ${plan.failed.length} 条样例</button>`:'';
}
async function retryFailed(context) {
  const run=context==='generation'?state.generation?.run:state.run, plan=retryPlan(run);
  if (!plan) throw new Error('这次运行没有可以重新测试的失败样例。');
  if (!window.confirm(`将重新测试 ${plan.failed.length} 条失败样例，会实际调用评分模型；${plan.done.length} 条已完成样例沿用本次结果。`)) return;
  const created=await api('/api/runs',plan.payload);
  await runById(created.run_id); await refreshRuns(); markActive('run',created.run_id);
  notice(created.run_id===plan.payload.run_id?'已提交重新测试，完成后会生成一份完整的批量结果。':'这次运行的失败样例已经提交过重新测试，已打开那次运行。','success');
}
// 样例详情在右侧面板中打开：汇总留在原处，可上一条/下一条与键盘切换。
function drawerRun() { const d=state.drawer; return d && (d.context==='generation'?state.generation?.run:state.run); }
function showRunCase(context, caseId) {
  const run=context==='generation'?state.generation?.run:state.run;
  if (!run || !caseId) return closeDrawer();
  state.drawer={context, runId:run.run_id, caseId};
  renderDrawer(true);
}
function renderCompareDrawer(reset) {
  const d=state.drawer, items=drawerItems(), index=items.findIndex(i=>i.key===d.key), item=items[index];
  if (!item) return closeDrawer();
  document.querySelectorAll('#drawer video').forEach(v=>v.pause());
  $('drawer-title').textContent=[item.label, item.group].filter(Boolean).join(' · ');
  $('drawer-sub').textContent=d.cases?`${state.compare.labels[d.model]} 出现“${d.issueName}”的用例 · 共 ${items.length} 条`:`${state.compare.runs.length} 组结果并排对比`;
  $('drawer-pos').textContent=`${index+1} / ${items.length}`;
  document.querySelector('[data-action="drawer-prev"]').disabled=index<=0;
  document.querySelector('[data-action="drawer-next"]').disabled=index>=items.length-1;
  const body=$('drawer-body');
  body.innerHTML=compareItemHTML(item); if (reset) body.scrollTop=0;
  if ($('drawer').hidden) { $('drawer').hidden=false; document.body.classList.add('drawer-open'); document.querySelector('.drawer-panel').focus(); }
}
function renderDrawer(reset=false) {
  if (state.drawer?.context==='compare') return renderCompareDrawer(reset);
  const d=state.drawer, run=drawerRun();
  if (!d || !run || run.run_id!==d.runId) return closeDrawer();
  const cases=run.cases||[], index=cases.findIndex(c=>c.case_id===d.caseId), c=cases[index];
  if (!c) return closeDrawer();
  $('drawer-title').textContent=shortCaseName(c.case_id);
  const rest=caseName(c.case_id).split(' · ').slice(1).join(' · '), runLabel=runName(run,{short:true});
  // 样例名里已含模型名时不再重复测试集名。
  $('drawer-sub').textContent=[rest, rest.endsWith(runLabel.split(' · ').pop())?'':runLabel].filter(Boolean).join(' · ');
  $('drawer-pos').textContent=cases.length>1?`${index+1} / ${cases.length}`:'';
  document.querySelector('[data-action="drawer-prev"]').disabled=index<=0;
  document.querySelector('[data-action="drawer-next"]').disabled=index>=cases.length-1;
  const body=$('drawer-body'), top=body.scrollTop;
  body.innerHTML=friendlyCase(run,c,d.context);
  body.scrollTop=reset?0:top;
  if ($('drawer').hidden) { $('drawer').hidden=false; document.body.classList.add('drawer-open'); document.querySelector('.drawer-panel').focus(); }
}
function stepDrawer(delta) {
  if (state.drawer?.context==='compare') {
    document.querySelectorAll('#drawer video').forEach(v=>v.pause());
    const items=drawerItems(), index=items.findIndex(i=>i.key===state.drawer.key)+delta;
    if (index>=0 && index<items.length) { state.drawer.key=items[index].key; renderCompareDrawer(true); }
    return;
  }
  const d=state.drawer, run=drawerRun();
  if (!d || !run) return;
  const cases=run.cases||[], index=cases.findIndex(c=>c.case_id===d.caseId)+delta;
  if (index<0 || index>=cases.length) return;
  d.caseId=cases[index].case_id; renderDrawer(true);
}
function closeDrawer() {
  state.drawer=null;
  document.querySelectorAll('#drawer video').forEach(v=>v.pause());
  $('drawer').hidden=true; $('drawer-body').innerHTML=''; document.body.classList.remove('drawer-open');
}

// 页面内查看大图：同一组图片可左右翻看。
function openLightbox(link) {
  const group=[...document.querySelectorAll(`a[data-lightbox="${CSS.escape(link.dataset.lightbox)}"]`)];
  state.lightbox={group, index:Math.max(0,group.indexOf(link))};
  showLightbox();
}
function showLightbox() {
  const {group, index}=state.lightbox, link=group[index];
  $('lightbox-img').src=link.href; $('lightbox-img').alt=link.dataset.caption||'';
  $('lightbox-cap').textContent=[link.dataset.caption, group.length>1?`${index+1} / ${group.length}`:''].filter(Boolean).join('  ·  ');
  document.querySelector('.lightbox-nav.prev').hidden=index<=0;
  document.querySelector('.lightbox-nav.next').hidden=index>=group.length-1;
  $('lightbox').hidden=false;
}
function stepLightbox(delta) {
  const lb=state.lightbox; if (!lb) return;
  const index=lb.index+delta; if (index<0 || index>=lb.group.length) return;
  lb.index=index; showLightbox();
}
function closeLightbox() { state.lightbox=null; $('lightbox').hidden=true; $('lightbox-img').removeAttribute('src'); }

// 原视频与生成结果的对比播放：一起播放、暂停、拖动和慢放。
function syncVideos(el) { return [...(el.closest('.f-case')?.querySelectorAll('.f-media video')||[])]; }
function syncBar() {
  return `<div class="sync-bar"><button class="btn small primary" data-action="sync-toggle">▶ 同步播放</button>`+
    `<input class="sync-seek" type="range" min="0" max="1000" value="0" aria-label="同时拖动原视频和生成结果">`+
    `<span class="sync-time">0.0 秒</span><button class="btn small" data-action="sync-rate">慢放 0.5×</button></div>`;
}
function stopSync(box) {
  delete box.dataset.syncing;
  box.querySelectorAll('.f-media video').forEach(v=>v.pause());
  const toggle=box.querySelector('[data-action="sync-toggle"]'); if (toggle) toggle.textContent='▶ 同步播放';
}
function onSyncTime(event) {
  const video=event.target;
  if (!(video instanceof HTMLVideoElement) || !video.closest('.f-media')) return;
  const videos=syncVideos(video);
  if (videos[0]!==video) return;
  const bar=video.closest('.f-case').querySelector('.sync-bar');
  if (!bar) return;
  const duration=Math.min(...videos.map(v=>v.duration||Infinity));
  if (Number.isFinite(duration) && duration>0 && document.activeElement!==bar.querySelector('.sync-seek'))
    bar.querySelector('.sync-seek').value=Math.round(video.currentTime/duration*1000);
  bar.querySelector('.sync-time').textContent=`${video.currentTime.toFixed(1)} 秒`;
  // 只在“同步播放”期间对齐：各列可能逐渐错开，超过 0.15 秒就对齐到第一列。
  // 单独播放某一列（时间按钮或直接点视频）时不动其他列，否则暂停的列会被反复拖动而卡顿。
  const box=video.closest('.f-case');
  if (box.dataset.syncing==='1' && !video.paused) for (const other of videos.slice(1)) if (!other.paused && Math.abs(other.currentTime-video.currentTime)>0.15) other.currentTime=video.currentTime;
  if (event.type==='ended' && box.dataset.syncing==='1') stopSync(box);
}

// 测试任务：同一批测试用例 + 一个评测流程 + 若干组结果（每组一个测试集，通常对应一个模型）。
// 页面按“选任务 → 选结果 → 评测 → 横向对比”组织；同一提示词与参考图视为同一条用例。
function compareKey(c) {
  const s=c.input?.sample||{};
  return [s.original_instruction||c.case_id, ...(s.reference_images||[]).map(r=>r.sha256||r.asset_id)].join('|');
}
function datasetLabel(datasetId) {
  const d=(state.datasets||[]).find(x=>x.dataset_id===datasetId);
  return (d?.display_name||datasetId).split(' · ').pop();
}
function entryLabel(entry) { return entry.label || datasetLabel(entry.dataset_id); }
// 自动复核：排除（及仍无法判断）的问题不再计入统计和扣分，单独列出原因。
function issueCounted(i) { return !i.informational && !['rejected','uncertain'].includes(i.recheck?.verdict); }
function issueExcluded(i) { return !i.informational && ['rejected','uncertain'].includes(i.recheck?.verdict); }
function recheckTag(i) {
  const v=i.recheck?.verdict;
  if (v==='confirmed') return `<span class="recheck-tag ok" title="${escapeHtml(`加密抽帧复核确认：${i.recheck.evidence||i.recheck.reason||''}`)}">已复核确认</span>`;
  return '';
}
function excludedBlock(issues, pairs) {
  const ex=issues.filter(issueExcluded);
  if (!ex.length) return '';
  return `<details class="f-notes recheck-excluded"><summary>复核后排除 ${ex.length} 条（不扣分）</summary>${ex.map(i=>`<div class="f-issue"><div class="f-issue-head"><b>${escapeHtml(i.category_name||'问题')}</b><span class="dim">${escapeHtml(whenText(i,pairs))}</span></div>`+
    `<p class="dim">原判读：${escapeHtml(plainify(i.problem,pairs))}</p><p><b>复核结论：</b>${escapeHtml(i.recheck.verdict==='rejected'?'排除':'仍无法判断，暂不扣分')}——${escapeHtml(i.recheck.reason||'')}</p></div>`).join('')}</details>`;
}
function scoreBefore(d) { return d?.recheck && d.recheck.original_score!==d.score ? d.recheck.original_score : null; }
function caseScored(c) { return (c.result?.scores?.dimensions||[]).some(d=>d.status==='scored'); }
function caseMean(c) {
  const s=(c?.result?.scores?.dimensions||[]).filter(d=>d.status==='scored').map(d=>d.score);
  return s.length?s.reduce((a,b)=>a+b,0)/s.length:null;
}
function meanOf(list) { const v=list.filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; }
function heatCell(mean, extra='', attrs='') {
  if (mean==null) return `<td class="batch-cell"${attrs}><span class="batch-score empty-cell">—</span></td>`;
  return `<td class="batch-cell"${attrs}><span class="batch-score lost-${Math.max(0,Math.min(10,Math.round(10-mean)))}">${escapeHtml(oneDecimal(Math.round(mean*10)/10))}${extra}</span></td>`;
}
function currentTask() { return (state.tasks||[]).find(t=>t.task_id===state.taskId) || null; }
// 每组结果取该流程下最近一次（未删除的）测试集评测。
function entryRun(task, entry) {
  return (state.runs||[]).filter(r=>r.request?.dataset_id===entry.dataset_id && r.request?.plan_id===task.plan_id && !r.request?.case_id)
    .sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
}
function entryState(task, entry) {
  const run=entryRun(task, entry), total=(state.datasets||[]).find(d=>d.dataset_id===entry.dataset_id)?.case_ids?.length;
  if (!run) return {run, kind:'none', text:'未评测', total};
  const cases=run.cases||[], done=cases.filter(c=>c.status==='completed').length, failed=cases.filter(c=>['failed','error'].includes(c.status)).length;
  if (['queued','running'].includes(run.status)) return {run, kind:'running', text:`评测中 ${done}/${cases.length}`, total};
  if (run.status==='completed') return {run, kind:'done', text:'已评测', total};
  if (run.status==='partial_failed') return {run, kind:'partial', text:`${failed||cases.length-done} 条没评完`, total};
  return {run, kind:'failed', text:status(run.status), total};
}
function taskIncluded(task) {
  const saved=(state.taskInclude||{})[task.task_id];
  return task.entries.filter(e=>saved ? saved.includes(e.dataset_id) : true);
}
function renderTaskList() {
  const tasks=state.tasks||[];
  $('task-list').innerHTML=tasks.map(t=>{
    const states=t.entries.map(e=>entryState(t,e)), done=states.filter(s=>['done','partial'].includes(s.kind)).length;
    const running=states.some(s=>s.kind==='running');
    return `<button data-action="task" data-id="${escapeHtml(t.task_id)}" class="${t.task_id===state.taskId?'active':''}"><span class="list-title">${escapeHtml(t.display_name)}</span>`+
      `<span class="list-meta">${running?statusPill('running'):''}<span>${escapeHtml(t.entries.map(entryLabel).join('、'))}</span></span>`+
      `<span class="list-meta"><span>${t.entries.length} 组结果 · ${done} 组已评测</span></span></button>`;
  }).join('');
  $('task-list-none').hidden=tasks.length>0;
}
function renderTaskForm() {
  const flows=(state.flows||[]).filter(f=>f.plan?.schema_version==='editing-plan/3');
  $('ctask-flow').innerHTML=flows.map(f=>`<option value="${escapeHtml(f.plan.plan_id)}">${escapeHtml(flowName(f.plan.plan_id))}</option>`).join('');
  $('ctask-datasets').innerHTML=datasetPicker('ctask', []);
}
function datasetPicker(prefix, checked) {
  return (state.datasets||[]).map(d=>`<label class="check compare-pick"><input type="checkbox" data-pick="${prefix}" value="${escapeHtml(d.dataset_id)}"${checked.includes(d.dataset_id)?' checked':''}> <span>${escapeHtml(d.display_name||d.dataset_id)}<small class="dim">${escapeHtml((d.case_ids||[]).length)} 条</small></span></label>`).join('') || '<p class="empty">还没有测试集。</p>';
}
async function refreshTasks() {
  state.tasks=await api('/api/tasks');
  renderTaskList();
}
async function saveTask(taskId) {
  const prefix=taskId?'etask':'ctask';
  const picked=[...document.querySelectorAll(`[data-pick="${prefix}"]:checked`)].map(x=>x.value);
  const body={display_name:val(prefix+'-name'), plan_id:val(prefix+'-flow'), entries:picked.map(id=>({dataset_id:id}))};
  if (!body.display_name) throw new Error('请填写任务名称。');
  if (!picked.length) throw new Error('请至少选择一组结果。');
  const task=await api(taskId?'/api/tasks/'+route(taskId):'/api/tasks', body);
  await refreshTasks(); await showTask(task.task_id);
  if (!taskId) { $('task-create-fold').open=false; $('ctask-name').value=''; }
  notice(taskId?'任务已更新。':'任务已创建。','success');
}
function taskHeader(task) {
  const included=new Set(taskIncluded(task).map(e=>e.dataset_id));
  const cards=task.entries.map(e=>{
    const s=entryState(task,e), tone={none:'none',running:'run',done:'ok',partial:'warn',failed:'bad'}[s.kind];
    const act=s.kind==='none'||s.kind==='failed'?`<button class="btn small primary" data-action="task-eval" data-id="${escapeHtml(e.dataset_id)}">评测这组</button>`
      : s.kind==='partial'?`<button class="btn small" data-action="task-retry" data-id="${escapeHtml(s.run.run_id)}">重测没评完的</button>`:'';
    const detail=s.run&&s.kind!=='running'?`<button class="link-button" data-action="run" data-id="${escapeHtml(s.run.run_id)}">这组的详细结果</button>`:'';
    return `<div class="task-entry tone-${tone}"><label class="check"><input type="checkbox" data-action="task-include" data-id="${escapeHtml(e.dataset_id)}"${included.has(e.dataset_id)?' checked':''}${s.kind==='none'?' disabled':''}> <b>${escapeHtml(entryLabel(e))}</b></label>`+
      `<div class="task-entry-meta"><span class="dot"></span>${escapeHtml(s.text)}${s.total!=null?` · ${escapeHtml(s.total)} 条结果`:''}${s.run&&s.kind!=='running'?` · ${escapeHtml(fmtTime(s.run.created_at))}`:''}</div>`+
      `<div class="task-entry-actions">${act}${detail}</div></div>`;
  }).join('');
  const pending=task.entries.filter(e=>['none','failed'].includes(entryState(task,e).kind));
  const datasets=task.entries.map(e=>e.dataset_id);
  return `<div class="detail-head"><h2>${escapeHtml(task.display_name)}</h2><div class="detail-actions">`+
      `${pending.length>1?`<button class="btn small primary" data-action="task-eval-all">评测全部未评测的 ${pending.length} 组</button>`:''}`+
      `<button class="link-button danger-link" data-action="task-archive" data-id="${escapeHtml(task.task_id)}">删除任务</button></div></div>`+
    `<div class="detail-meta"><span>评测流程 <b>${escapeHtml(flowName(task.plan_id))}</b></span><span>结果 <b>${task.entries.length} 组</b></span><span class="dim">勾选的结果参与下方对比</span></div>`+
    `<div class="task-entries">${cards}</div>`+
    `<details class="task-edit"><summary>编辑任务：改名称、流程或增减结果</summary>`+
      `<div class="fields"><label>任务名称<input id="etask-name" value="${escapeHtml(task.display_name)}"></label><label>评测流程<select id="etask-flow">${(state.flows||[]).filter(f=>f.plan?.schema_version==='editing-plan/3').map(f=>`<option value="${escapeHtml(f.plan.plan_id)}"${f.plan.plan_id===task.plan_id?' selected':''}>${escapeHtml(flowName(f.plan.plan_id))}</option>`).join('')}</select></label></div>`+
      `<div class="compare-list">${datasetPicker('etask', datasets)}</div><div class="actions"><button class="btn small primary" data-action="task-save" data-id="${escapeHtml(task.task_id)}">保存修改</button></div></details>`;
}
let taskRequestSerial=0;
async function showTask(taskId, {keepDrawer=false}={}) {
  const task=(state.tasks||[]).find(t=>t.task_id===taskId);
  if (!task) return;
  const serial=++taskRequestSerial, switching=state.taskId!==taskId;
  if (switching) { state.taskCaseKey=null; state.issueModel=0; state.openDimRow=null; }
  state.taskId=taskId; state.selectedRunId=null; state.run=null; saved('task-id',taskId); localStorage.removeItem('editing-workbench:run-id');
  // 任务内容变化后报告需要重新载入。
  state.reportTaskId=null;
  if (!keepDrawer) closeDrawer();
  markActive('task',taskId); markActive('run',null);
  const ready=taskIncluded(task).filter(e=>['done','partial'].includes(entryState(task,e).kind));
  $('run-result').className='';
  $('run-result').innerHTML=taskHeader(task)+`<div id="task-compare">${ready.length?'<p class="empty">正在载入评测结果…</p>':'<p class="empty">勾选的结果还没有评测完成；评测完成后可在这里打开分析报告。</p>'}</div>`;
  state.taskSignature=taskSignature(task);
  if (!ready.length) { state.compare=null; return; }
  if (switching) $('task-compare').classList.add('is-loading');
  const cmp=await loadComparison(task);
  if (serial!==taskRequestSerial) return;
  state.compare=cmp;
  $('task-compare').classList.remove('is-loading');
  $('task-compare').innerHTML=taskSummary(cmp, task);
}
// 当前视图（任务页或报告页）按最新的统计范围、所选模型重画。
function rerenderCompareView() {
  if (!$('page-report').hidden) return renderReport();
  const task=currentTask(); if (task && state.compare && $('task-compare')) $('task-compare').innerHTML=taskSummary(state.compare, task);
}
function taskSignature(task) {
  return JSON.stringify(task.entries.map(e=>{ const s=entryState(task,e); return [e.dataset_id, s.run?.run_id, s.kind, s.text]; }));
}
async function submitEntryRun(task, datasetId) {
  return api('/api/runs',{run_id:id('run'), plan_id:task.plan_id, dataset_id:datasetId, idempotency_key:id('runkey'),
    repeat:!!entryRun(task,{dataset_id:datasetId})});
}
function buildComparison(runs, labels) {
  const items=new Map();
  runs.forEach((run,ri)=>{
    for (const c of run.cases||[]) {
      const key=compareKey(c), parts=caseName(c.case_id).split(' · ');
      const item=items.get(key)||{key, label:parts[0], group:parts.length>2?parts[1]:'', cells:new Array(runs.length).fill(null)};
      item.cells[ri]=c; items.set(key,item);
    }
  });
  const list=[...items.values()].sort((a,b)=>a.label.localeCompare(b.label,'zh-Hans-CN',{numeric:true}));
  const dims=[]; for (const run of runs) for (const d of batchDimensions(run)) if (!dims.some(x=>x.id===d.id)) dims.push(d);
  return {runs, labels, items:list, dims, common:list.filter(i=>i.cells.every(c=>c&&caseScored(c)))};
}
function compareIssues(cmp, items) {
  // 每组结果中出现某类问题的用例数；同一用例同类问题只算一次。例子取涉及画面最多的那条。
  const rows=new Map();
  items.forEach(item=>item.cells.forEach((c,ri)=>{
    if (!c) return;
    const seen=new Set();
    for (const k of c.result?.checks||[]) for (const issue of k.brief?.issues||[]) {
      if (!issueCounted(issue)) continue;
      const key=k.check_id+'|'+issue.category;
      const row=rows.get(key)||{key, name:issue.category_name||issue.category, dim:k.name, counts:new Array(cmp.runs.length).fill(0),
        cases:cmp.runs.map(()=>[]), examples:new Array(cmp.runs.length).fill(null)};
      const ex=row.examples[ri];
      if (!ex || (issue.units||[]).length>(ex.issue.units||[]).length) row.examples[ri]={item, c, issue};
      if (!seen.has(key)) { seen.add(key); row.counts[ri]++; row.cases[ri].push(item.key); }
      rows.set(key,row);
    }
  }));
  return [...rows.values()].sort((a,b)=>b.counts.reduce((s,x)=>s+x,0)-a.counts.reduce((s,x)=>s+x,0));
}
function scopeItems(cmp) { return state.compareScope==='all'?cmp.items:cmp.common; }
function modelStats(cmp, items) {
  return cmp.runs.map((_,ri)=>{
    const cells=items.map(i=>i.cells[ri]).filter(c=>c&&caseScored(c));
    const dims=Object.fromEntries(cmp.dims.map(d=>[d.id, meanOf(cells.map(c=>caseDimension(c,d.id)).map(x=>x?.status==='scored'?x.score:null))]));
    return {cells, dims, overall:meanOf(cells.map(caseMean))};
  });
}
// 一句话说明每组相对其他组的强项与弱项：比最好的一组低 1 分以上算明显偏弱，领先其余各组 0.5 分以上算强项。
function modelSummary(cmp, stats, ri) {
  const weak=[], strong=[], f=x=>oneDecimal(Math.round(x*10)/10);
  for (const d of cmp.dims) {
    const mine=stats[ri].dims[d.id]; if (mine==null) continue;
    const others=stats.map((s,j)=>j===ri?null:s.dims[d.id]).filter(x=>x!=null);
    if (!others.length) continue;
    const best=Math.max(...others);
    if (best-mine>=1) weak.push(`${d.name}明显偏弱（${f(mine)}，最好 ${f(best)}）`);
    else if (mine-best>=0.5) strong.push(`${d.name}最好（${f(mine)}）`);
  }
  return {weak, strong};
}
function scopeSwitch(cmp) {
  const counts=cmp.runs.map((_,ri)=>cmp.items.filter(i=>i.cells[ri]&&caseScored(i.cells[ri])).length);
  const total=cmp.items.length, scope=state.compareScope==='all'?'all':'common';
  if (!counts.some(n=>n!==total) && scope==='common') return '';
  return `<div class="scope-switch" role="group" aria-label="统计范围"><button class="btn small${scope==='common'?' primary':''}" data-action="compare-scope" data-id="common">各组都有的 ${cmp.common.length} 条</button>`+
    `<button class="btn small${scope==='all'?' primary':''}" data-action="compare-scope" data-id="all">各组全部用例</button></div>`;
}
// 整体表现：每组一张结论卡；withTable 时直接展开维度×模型分数表（报告页），否则收进折叠（任务页）。
function overviewSection(cmp, {withTable=false, eyebrow='01 · 整体表现'}={}) {
  const {runs, dims, labels}=cmp, items=scopeItems(cmp), stats=modelStats(cmp, items);
  const counts=runs.map((_,ri)=>cmp.items.filter(i=>i.cells[ri]&&caseScored(i.cells[ri])).length), total=cmp.items.length;
  const ranked=stats.map((s,ri)=>({ri, v:s.overall})).filter(x=>x.v!=null).sort((a,b)=>b.v-a.v);
  const issues=compareIssues(cmp, items);
  let html=`<section class="story"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h3 class="story-title">${ranked.length>1?`${escapeHtml(labels[ranked[0].ri])} 整体最好，${escapeHtml(labels[ranked.at(-1).ri])} 差距最大`:'整体表现'}</h3>`+
    `<p class="story-lead">${state.compareScope==='all'?'按各组自己有结果的用例比较（各组用例不同，只作参考）':`按各组都有结果的 ${items.length} 条用例比较`}；综合分是五项平均，为试用口径，分差小于约 1 分不宜下结论。</p>`;
  html+=`<div class="model-cards n${runs.length}">`+runs.map((_,ri)=>{
    const s=stats[ri], r=ratingOfMean(s.overall), sum=modelSummary(cmp, stats, ri), top=issues.find(x=>x.counts[ri]>0), rank=ranked.findIndex(x=>x.ri===ri);
    return `<article class="model-card tone-${r.tone}"><div class="model-card-head"><b>${rank>=0&&ranked.length>1?`<span class="rank">${rank+1}</span>`:''}${escapeHtml(labels[ri])}</b><span class="rating rating-${r.tone}">${r.word}</span></div>`+
      `<div class="model-score">${s.overall==null?'—':escapeHtml(oneDecimal(Math.round(s.overall*100)/100))}<small> / 10</small></div>`+
      `<div class="dim">${s.cells.length} 条用例${counts[ri]<total?` · 共 ${total} 条中缺 ${total-counts[ri]} 条`:''}</div>`+
      `<ul class="model-notes">${sum.strong.map(x=>`<li class="up">${escapeHtml(x)}</li>`).join('')}${sum.weak.map(x=>`<li class="down">${escapeHtml(x)}</li>`).join('')}`+
      `${top?`<li>最常见：${escapeHtml(top.name)}（${top.counts[ri]}/${s.cells.length} 条）</li>`:''}</ul>`+
      (withTable?`<button class="link-button" data-action="issue-model" data-id="${ri}">看它的问题 ↓</button>`:'')+`</article>`;
  }).join('')+`</div>`;
  const best=dims.map(d=>Math.max(...stats.map(s=>s.dims[d.id]??-1)));
  const table=`<div class="batch-table-wrap"><table class="batch-table compare-table"><thead><tr><th class="batch-case-col">维度</th>${labels.map(l=>`<th>${escapeHtml(l)}</th>`).join('')}</tr></thead><tbody>`+
    dims.map((d,di)=>`<tr><th class="batch-case-col"><b>${escapeHtml(d.name)}</b></th>${runs.map((_,ri)=>{ const m=stats[ri].dims[d.id]; return heatCell(m,'',m!=null&&m===best[di]&&runs.length>1?' data-best="1"':''); }).join('')}</tr>`).join('')+
    `<tr class="total-row"><th class="batch-case-col"><b>综合（五项平均）</b></th>${runs.map((_,ri)=>heatCell(stats[ri].overall)).join('')}</tr></tbody></table></div>`+
    groupTable(cmp, items)+`<p class="step-note">每行最高分描边。综合 = 每条用例五项平均后再取平均；评分标准本身不计算总分。</p>`;
  html+=withTable?`<h4 class="sub-title">维度 × 结果<small>各组在每个维度上的平均分</small></h4>${table}`:`<details class="fold-more"><summary>各维度分数</summary>${table}</details>`;
  return html+`</section>`;
}
function groupTable(cmp, items) {
  const groups=[...new Set(items.map(i=>i.group).filter(Boolean))];
  if (groups.length<2) return '';
  return `<h4 class="sub-title">按用例类别<small>五项平均分</small></h4><div class="batch-table-wrap"><table class="batch-table compare-table"><thead><tr><th class="batch-case-col">类别</th>${cmp.labels.map(l=>`<th>${escapeHtml(l)}</th>`).join('')}</tr></thead><tbody>`+
    groups.map(g=>{ const rows=items.filter(i=>i.group===g);
      return `<tr><th class="batch-case-col"><b>${escapeHtml(g)}</b><small>${rows.length} 条</small></th>${cmp.runs.map((_,ri)=>{ const cs=rows.map(i=>i.cells[ri]).filter(c=>c&&caseScored(c)); return heatCell(meanOf(cs.map(caseMean)),`<small>${cs.length} 条</small>`); }).join('')}</tr>`; }).join('')+`</tbody></table></div>`;
}
function issuesSection(cmp) {
  const {runs, labels}=cmp, items=scopeItems(cmp), stats=modelStats(cmp, items), issues=compareIssues(cmp, items);
  const mi=Math.min(state.issueModel??0, runs.length-1), mine=issues.filter(x=>x.counts[mi]>0).sort((a,b)=>b.counts[mi]-a.counts[mi]);
  return `<section class="story" id="story-issues"><p class="eyebrow">02 · 问题在哪里</p><h3 class="story-title">${escapeHtml(labels[mi])} 最常见的问题</h3>`+
    `<p class="story-lead">按出现的用例数排序，同一用例同类问题只算一次。点卡片在右侧打开用例详情、各组并排对照；点下方编号直接打开那一条。</p>`+
    `<div class="model-tabs" role="tablist">${runs.map((_,ri)=>`<button role="tab" class="chip${ri===mi?' selected':''}" aria-selected="${ri===mi}" data-action="issue-model" data-id="${ri}">${escapeHtml(labels[ri])}</button>`).join('')}</div>`+
    `<div class="issue-cards">${mine.slice(0,6).map(x=>issueStoryCard(x, mi, stats[mi].cells.length)).join('')||'<p class="f-ok">没有发现问题。</p>'}</div>`+
    (mine.length>6?`<details class="fold-more"><summary>其余 ${mine.length-6} 类问题</summary><div class="issue-cards">${mine.slice(6).map(x=>issueStoryCard(x, mi, stats[mi].cells.length)).join('')}</div></details>`:'')+`</section>`;
}
function issueStoryCard(row, ri, total) {
  const ex=row.examples[ri], pairs=casePairs(ex.c), pair=pairs[(pickFrames(ex.issue.units,1)[0]||1)-1], url=pair?stepMediaURL(pair.comparison):null;
  const others=state.compare.labels.map((l,j)=>j===ri?null:`${l} ${row.counts[j]}`).filter(Boolean).join(' · ');
  // 整张卡片可点：打开右侧面板，从卡片上的例子开始；下方用例编号直接打开对应用例。
  const open=`data-action="issue-case" data-id="${escapeHtml(ex.item.key)}" data-issue="${escapeHtml(row.key)}" data-model="${ri}"`;
  return `<article class="issue-card story-card" ${open} role="button" tabindex="0" aria-label="${escapeHtml(`查看${state.compare.labels[ri]}“${row.name}”的用例详情`)}">`+
    `${url?`<span class="issue-thumb"><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(row.name)}的例子"></span>`:''}`+
    `<div class="issue-body"><div class="issue-title"><b>${escapeHtml(row.name)}</b><span class="tag">${escapeHtml(row.dim)}</span></div>`+
    `<div class="issue-share"><span class="share"><i class="share-${Math.round(row.counts[ri]/(total||1)*10)}"></i></span>${total} 条里有 <b>${row.counts[ri]}</b> 条</div>`+
    (others?`<div class="issue-others dim">其他组：${escapeHtml(others)}</div>`:'')+
    `<p class="issue-example">例（${escapeHtml(ex.item.label)}，${escapeHtml(whenText(ex.issue,pairs))}）：${escapeHtml(plainify(ex.issue.problem,pairs))}</p>`+
    `<div class="issue-cases">`+
    (()=>{ const all=[ex.item.key, ...row.cases[ri].filter(k=>k!==ex.item.key)], shown=all.slice(0,5);
      return shown.map(k=>`<button class="chip" data-action="issue-case" data-id="${escapeHtml(k)}" data-issue="${escapeHtml(row.key)}" data-model="${ri}">${escapeHtml(state.compare.items.find(i=>i.key===k)?.label||'')}</button>`).join('')+
        (all.length>shown.length?`<span class="dim">等 ${all.length} 条</span>`:''); })()+`</div></div></article>`;
}
// 一条问题：类别、可点击跳播的时段、描述和问题画面；ri 指定跳播哪一列的视频。
function issueBlock(i, pairs, ri, focused=false) {
  return `<div class="f-issue${focused?' focus':''}"><div class="f-issue-head"><b>${escapeHtml(i.category_name||'问题')}</b>${recheckTag(i)}${(i.time_ranges_ms||[]).map(([a,b])=>`<button class="time-chip" data-action="seek" data-col="${ri}" data-start="${a}" data-end="${b}">▶ ${escapeHtml(a===b?`${sec(a/1000)} 秒`:`${sec(a/1000)}–${sec(b/1000)} 秒`)}</button>`).join('')}</div>`+
    `<p>${escapeHtml(plainify(i.problem,pairs))}</p>${frameStrip(i.units,pairs,2)}</div>`;
}
function caseCheck(c, dimId) {
  const check=(c?.result?.checks||[]).find(k=>k.check_id===dimId);
  const all=check?.brief?.issues||[];
  return {check, issues:all.filter(issueCounted), all};
}
// 一条用例的共同输入与各组并排。compact 时各列只放视频和综合分（报告页下方另有维度对比表）；
// focus 指定从哪个模型、哪个维度、哪类问题进入，对应位置展开并高亮（右侧面板）。
function reviewBody(cmp, item, {focus=null, compact=false}={}) {
  const {runs, dims, labels}=cmp, first=item.cells.find(Boolean), sample=first?.input?.sample||{};
  const refs=(sample.reference_images||[]).map((r,i,all)=>mediaFigure(r, all.length>1?`参考图 ${i+1}`:'参考图','image'));
  const brief=`<div class="case-input"><div class="f-media refs">${refs.join('')}</div><div class="case-input-text"><b>共同输入</b><p class="dim">各组使用同一组参考图和同一段生成提示词。</p>`+
    `<details><summary>展开提示词原文</summary><pre class="prompt-text">${escapeHtml(sample.original_instruction||'')}</pre></details></div></div>`;
  const cols=runs.map((_,ri)=>{
    const c=item.cells[ri];
    if (!c) return `<div class="review-col missing"><div class="review-head"><b>${escapeHtml(labels[ri])}</b></div><div class="step-missing-image">这组没有这条用例的结果</div></div>`;
    const pairs=casePairs(c), mean=caseMean(c), r=ratingOfMean(mean), focused=focus?.model===ri;
    return `<div class="review-col${focused?' focus':''}" data-col="${ri}"><div class="review-head"><b>${escapeHtml(labels[ri])}</b><span class="rating rating-${r.tone}">${r.word}</span><span class="f-score">${mean==null?'—':escapeHtml(oneDecimal(Math.round(mean*10)/10))}</span></div>`+
      `${mediaFigure(c.input?.sample?.output_video,'','video')}`+
      (compact?'':dims.map(d=>{ const x=caseDimension(c,d.id), {check, issues, all}=caseCheck(c,d.id), open=focused&&focus.dim===d.id, was=scoreBefore(x);
        return `<details class="review-dim"${open?' open':''}><summary><span>${escapeHtml(d.name)}</span>${issues.length?`<span class="dim">${issues.length} 个问题</span>`:''}${was!=null?`<small class="was" title="复核前的分数">原 ${escapeHtml(was)}</small>`:''}<span class="batch-score lost-${x?.status==='scored'?Math.round(10-x.score):0}${x?.status==='scored'?'':' empty-cell'}">${x?.status==='scored'?escapeHtml(x.score):'—'}</span></summary>`+
          `<p class="cmp-conclusion">${escapeHtml(plainify(check?.brief?.conclusion||'',pairs))}</p>`+
          issues.map(i=>issueBlock(i,pairs,ri,open&&focus.category===i.category)).join('')+excludedBlock(all,pairs)+`</details>`; }).join(''))+
      `<button class="link-button" data-action="compare-open" data-run="${escapeHtml(runs[ri].run_id)}" data-case="${escapeHtml(c.case_id)}">完整评测记录</button></div>`;
  }).join('');
  const videos=item.cells.filter(Boolean).length;
  return brief+`<div class="f-media review-cols n${runs.length}">${cols}</div>${videos>1?syncBar():''}`;
}
// 报告页逐例对比的维度表：每行一个维度、各组分数横排；展开后各组的结论和问题并排。
function dimCompare(cmp, item) {
  const {dims, labels}=cmp, n=cmp.runs.length;
  return `<div class="dim-compare n${n}"><div class="dim-compare-head"><span>评分维度对比</span>${labels.map(l=>`<span>${escapeHtml(l)}</span>`).join('')}</div>`+
    dims.map((d,di)=>`<details class="dim-compare-row"${di===state.openDimRow?' open':''} data-dim-index="${di}"><summary><span class="dim-name">${escapeHtml(d.name)}</span>${item.cells.map(c=>{
      const x=c&&caseDimension(c,d.id), k=c?caseCheck(c,d.id).issues.length:0, was=scoreBefore(x);
      return `<span class="dim-cell"><span class="batch-score ${x?.status==='scored'?`lost-${Math.round(10-x.score)}`:'empty-cell'}">${x?.status==='scored'?escapeHtml(x.score):'—'}</span>${was!=null?`<small class="was" title="复核前的分数">原 ${escapeHtml(was)}</small>`:''}${k?`<small>${k} 个问题</small>`:''}</span>`; }).join('')}</summary>`+
      `<div class="cmp-cols n${n}">${item.cells.map((c,ri)=>{
        if (!c) return `<div class="cmp-col empty"><p class="dim">没有结果</p></div>`;
        const pairs=casePairs(c), {check, issues, all}=caseCheck(c,d.id);
        return `<div class="cmp-col"><div class="cmp-col-head"><b>${escapeHtml(labels[ri])}</b></div><p class="cmp-conclusion">${escapeHtml(plainify(check?.brief?.conclusion||'',pairs))}</p>`+
          (issues.length?issues.map(i=>issueBlock(i,pairs,ri)).join(''):'<p class="f-ok">没有发现需扣分的问题。</p>')+excludedBlock(all,pairs)+`</div>`; }).join('')}</div></details>`).join('')+`</div>`;
}
// 时间按钮：把对应列的视频跳到问题时段播放，到时段末尾自动暂停；单帧问题前后各留 0.6 秒。
function seekColumn(button) {
  const root=button.closest('.f-case')||document;
  const video=root.querySelector(`.review-col[data-col="${button.dataset.col}"] video`);
  if (!video) return;
  let start=Number(button.dataset.start)/1000, end=Number(button.dataset.end)/1000;
  if (end-start<0.5) { start=Math.max(0,start-0.6); end=end+0.6; }
  // 只播这一列：正在同步播放时先停下，其他列保持原样。
  if (root.dataset?.syncing==='1') stopSync(root);
  video.muted=false; video.dataset.stopAt=String(end); video.currentTime=start; video.play();
  video.scrollIntoView({behavior:'smooth', block:'nearest'});
}
// 右侧用例面板：从某类问题进入时，只在“该模型出现这类问题的用例”之间切换，并展开、高亮对应位置。
function openIssueCase(button) {
  const ri=Number(button.dataset.model), key=button.dataset.issue;
  const row=compareIssues(state.compare, scopeItems(state.compare)).find(r=>r.key===key);
  if (!row) return;
  const [dim, category]=key.split('|');
  // 顺序与卡片一致：先是卡片上的例子，再是其余用例。
  const exKey=row.examples[ri]?.item.key, cases=[exKey, ...row.cases[ri].filter(k=>k!==exKey)].filter(Boolean);
  state.drawer={context:'compare', key:button.dataset.id, cases, model:ri, dim, category, issueName:row.name};
  renderCompareDrawer(true);
}
function compareItems() { return state.compare?scopeItems(state.compare):[]; }
function drawerItems() {
  const d=state.drawer, cmp=state.compare;
  if (!cmp) return [];
  return d?.cases ? d.cases.map(k=>cmp.items.find(i=>i.key===k)).filter(Boolean) : compareItems();
}
function compareItemHTML(item) {
  const d=state.drawer, cmp=state.compare, focus=d?.cases?{model:d.model, dim:d.dim, category:d.category}:null;
  let note='';
  if (focus) {
    const c=item.cells[focus.model], {check}=caseCheck(c, focus.dim);
    const issue=(check?.brief?.issues||[]).find(i=>i.category===focus.category && issueCounted(i));
    if (issue) note=`<div class="drawer-focus"><div><b>${escapeHtml(cmp.labels[focus.model])} · ${escapeHtml(d.issueName)}</b><span class="dim">${escapeHtml(check.name)} · ${escapeHtml(whenText(issue,casePairs(c)))}</span></div>`+
      `<p>${escapeHtml(plainify(issue.problem,casePairs(c)))}</p></div>`;
  }
  return `<div class="f-case">${note}${reviewBody(cmp, item, {focus})}</div>`;
}
// 任务页（作业）只放结论卡和进入报告的入口；完整对比在独立的分析报告页。
function taskSummary(cmp, task) {
  return `<div class="report-entry"><div><b>评测结果已就绪</b><span class="dim">${cmp.items.length} 条用例 · ${cmp.runs.length} 组结果参与对比</span></div>`+
    `<div class="actions"><button class="btn primary" data-action="report-open" data-id="${escapeHtml(task.task_id)}" data-tab="overview">查看分析报告 →</button>`+
    `<button class="btn" data-action="report-open" data-id="${escapeHtml(task.task_id)}" data-tab="cases">逐例对比</button></div></div>`+
    recheckNote(cmp)+scopeSwitch(cmp)+overviewSection(cmp, {eyebrow:'结论速览'});
}

// ───── 分析报告页 ─────
async function loadComparison(task) {
  const ready=taskIncluded(task).map(e=>({entry:e, state:entryState(task,e)})).filter(x=>x.state.run && ['done','partial'].includes(x.state.kind));
  if (!ready.length) return null;
  const runs=await Promise.all(ready.map(x=>snapshotRun(x.state.run.run_id)));
  return buildComparison(runs, ready.map(x=>entryLabel(x.entry)));
}
async function openReport(taskId, {tab='overview', caseKey=null}={}) {
  const task=(state.tasks||[]).find(t=>t.task_id===taskId);
  if (!task) throw new Error('任务不存在或已删除。');
  closeDrawer();
  const sameTask=state.reportTaskId===taskId && state.compare;
  state.reportTaskId=taskId; state.reportTab=tab; state.taskId=taskId;
  if (!sameTask) { state.issueModel=0; state.taskCaseKey=null; state.openDimRow=null; }
  if (caseKey) state.taskCaseKey=caseKey;
  switchPage('report');
  history.replaceState(null,'',`#report=${encodeURIComponent(taskId)}`);
  $('report-title').textContent=task.display_name;
  if (!sameTask) {
    $('report-main').innerHTML='<p class="empty">正在载入报告…</p>'; $('report-tree').innerHTML='';
    state.compare=await loadComparison(task);
  }
  renderReport();
}
function renderReport() {
  const task=(state.tasks||[]).find(t=>t.task_id===state.reportTaskId), cmp=state.compare;
  document.querySelectorAll('[data-action="report-tab"]').forEach(b=>{ b.classList.toggle('selected', b.dataset.id===state.reportTab); b.setAttribute('aria-selected', b.dataset.id===state.reportTab); });
  if (!task || !cmp) { $('report-main').innerHTML='<p class="empty">这个任务还没有评测完成的结果。返回评测任务提交评测后再来查看。</p>'; $('report-tree').innerHTML=''; $('report-scope').innerHTML=''; return; }
  $('report-scope').innerHTML=scopeSwitch(cmp);
  renderReportTree();
  const main=$('report-main'); main.querySelectorAll('video').forEach(v=>v.pause());
  main.innerHTML=state.reportTab==='cases'?reportCase(cmp):reportOverview(cmp, task);
  main.scrollTop=0;
}
function reportOverview(cmp, task) {
  const groups=[...new Set(cmp.items.map(i=>i.group).filter(Boolean))];
  const latest=cmp.runs.map(r=>r.ended_at||r.created_at).filter(Boolean).sort().at(-1);
  const meta=[['评测流程', flowName(task.plan_id)], ['用例', `${cmp.items.length} 条${groups.length>1?` · ${groups.length} 个类别`:''}`],
    ['参与对比的结果', cmp.labels.join('、')], ['最近评测', latest?fmtTime(latest):'未记录']];
  return `<div class="report-meta">${meta.map(([k,v])=>`<div><span class="dim">${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join('')}</div>`+
    recheckNote(cmp)+overviewSection(cmp, {withTable:true})+issuesSection(cmp)+
    `<p class="step-note">按“提示词与参考图相同”把各组结果中的同一条用例对应起来。结论基于按镜头抽取的画面，两帧之间的短暂问题可能看不到；评分标准尚未与业务校准。</p>`;
}
function recheckNote(cmp) {
  const t={confirmed:0, rejected:0, uncertain:0};
  for (const r of cmp.runs) for (const k of Object.keys(t)) t[k]+=r.recheck?.[k]||0;
  const total=t.confirmed+t.rejected+t.uncertain;
  if (!total) return '';
  return `<div class="recheck-note"><b>分数为自动复核后的结果</b><span>第一轮拿不准的 ${total} 条问题，已在问题时段加密抽帧逐条复核：确认 ${t.confirmed} 条照常扣分，排除 ${t.rejected} 条不再扣分${t.uncertain?`，${t.uncertain} 条仍无法判断、暂不扣分`:''}。`+
    `分数旁的“原 x”是复核前的分数；被排除的问题在各维度下“复核后排除”里可以看到原因。</span></div>`;
}
function reportItems(cmp) { return state.reportMissingOnly ? cmp.items.filter(i=>i.cells.some(c=>!c||!caseScored(c))) : cmp.items; }
function renderReportTree() {
  const cmp=state.compare, words=val('report-search').toLowerCase().split(/\s+/).filter(Boolean);
  const items=reportItems(cmp).filter(i=>words.every(w=>`${i.label} ${i.group}`.toLowerCase().includes(w)));
  const groups=[...new Set(items.map(i=>i.group))];
  const active=state.reportTab==='cases'?(state.taskCaseKey||cmp.items[0]?.key):null;
  $('report-tree').innerHTML=groups.map(g=>`<div class="tree-group">${g?`<div class="tree-group-head">${escapeHtml(g)}<span class="dim">${items.filter(i=>i.group===g).length}</span></div>`:''}`+
    items.filter(i=>i.group===g).map(i=>`<button class="tree-item${i.key===active?' active':''}" data-action="report-case" data-id="${escapeHtml(i.key)}"><span class="tree-label">${escapeHtml(i.label)}</span>`+
      `<span class="tree-dots">${i.cells.map((c,ri)=>{ const m=c&&caseScored(c)?caseMean(c):null;
        return `<i class="${m==null?'none':`lost-${Math.max(0,Math.min(10,Math.round(10-m)))}`}" title="${escapeHtml(`${cmp.labels[ri]}：${m==null?'无结果':oneDecimal(Math.round(m*10)/10)}`)}"></i>`; }).join('')}</span></button>`).join('')+`</div>`).join('')
    || '<p class="empty">没有匹配的用例。</p>';
  const missing=cmp.items.filter(i=>i.cells.some(c=>!c||!caseScored(c))).length;
  $('report-side-note').textContent=`共 ${cmp.items.length} 条用例${missing?` · ${missing} 条有结果缺失`:''}。色块依次为：${cmp.labels.join('、')}。`;
}
function reportCase(cmp) {
  const items=cmp.items;
  let index=items.findIndex(i=>i.key===state.taskCaseKey); if (index<0) index=0;
  const item=items[index]; state.taskCaseKey=item.key;
  const valid=item.cells.filter(c=>c&&caseScored(c)).length;
  return `<div class="case-head"><div><h3>${escapeHtml(item.label)}${item.group?`<span class="dim"> · ${escapeHtml(item.group)}</span>`:''}</h3>`+
      `<span class="tag ${valid===cmp.runs.length?'ok':'warn'}">有效 ${valid}/${cmp.runs.length} 组</span></div>`+
      `<div class="case-nav-right"><button class="btn small" data-action="report-step" data-id="-1"${index<=0?' disabled':''}>↑ 上一条</button><span class="dim">${index+1} / ${items.length}</span>`+
      `<button class="btn small" data-action="report-step" data-id="1"${index>=items.length-1?' disabled':''}>↓ 下一条</button></div></div>`+
    `<div class="f-case report-case">${reviewBody(cmp, item, {compact:true})}${dimCompare(cmp, item)}</div>`+
    `<p class="step-note">列的顺序固定，不表示优劣。点维度展开各组的结论和问题；点时间按钮让对应列的视频跳到问题时段播放。键盘 ↑ ↓ 可切换用例。</p>`;
}
function stepReportCase(delta) {
  const items=state.compare?.items||[], i=items.findIndex(x=>x.key===state.taskCaseKey)+delta;
  if (!items[i]) return;
  state.taskCaseKey=items[i].key; renderReport();
  document.querySelector(`#report-tree [data-id="${CSS.escape(items[i].key)}"]`)?.scrollIntoView({block:'nearest'});
}

function renderRun(run,context='run') {
  if(!run)return '<p class="empty">暂无试跑记录。</p>';
  const extra=run.status==='imported'?'<p class="callout">历史导入：缺失的步骤、耗时和用量均未记录。</p>':'';
  const progress=run.progress?`${run.progress.finished}/${run.progress.total}，失败 ${run.progress.failed}`:'未记录';
  const mode=run.status==='imported'?'历史导入':enumNames[run.request?.execution_mode]||'未记录';
  const plan=run.request?.plan_id || run.flow?.plan?.plan_id, took=durationText(run.started_at,run.ended_at);
  const meta=[plan&&['流程版本',flowName(plan)],['评分来源',mode],['开始时间',fmtTime(run.started_at||run.created_at)],took&&['用时',took],['进度',progress]].filter(Boolean);
  return `<div class="detail-head"><h2>${escapeHtml(runName(run))}${statusPill(run.status)}</h2><div class="detail-actions">${isBatchRun(run)?'':retryButton(run,context)}${run.compact?`<button class="link-button raw-download" data-action="download-run" data-id="${escapeHtml(run.run_id)}">下载原始记录</button>`:rawDownload(run,'完整运行记录')}${context==='run'&&!['queued','running'].includes(run.status)?`<button class="link-button danger-link" data-action="archive-run" data-id="${escapeHtml(run.run_id)}">删除</button>`:''}</div></div>`+
    `<div class="detail-meta">${meta.map(([k,v])=>`<span>${escapeHtml(k)} <b>${escapeHtml(v)}</b></span>`).join('')}</div>${extra}`+
    `${run.error?`<p class="error">${escapeHtml(localizeError(run.error.message||'运行未完成，原因未记录。'))}</p>`:''}`+
    (isBatchRun(run)
      ? renderBatchOverview(run,context)
      : (run.cases||[]).length===1 && run.cases[0].result?.scores
        ? friendlyCase(run,run.cases[0],context)
        : `<h3 class="section-title">${isObservationRun(run)&&!(run.cases||[]).some(c=>c.result?.scores)?'判读结果':'评分结果'}</h3>${renderScores(run,context)}${renderSteps(run,context)}`);
}
let ugcDraftFiles = null;
let ugcJobSerial = 0;

async function refreshUgcJobs() {
  const jobs = await api('/api/ugc-planning-jobs');
  $('ugc-job-list').innerHTML = jobs.length ? jobs.map(job =>
    `<button data-action="ugc-job" data-id="${escapeHtml(job.id)}"><strong>${escapeHtml(job.display_name)}</strong> ${statusPill(job.status)}</button>`
  ).join('') : '<p class="empty">还没有规划任务。</p>';
  markActive('ugc-job', state.ugcJob?.id);
  return jobs;
}

function ugcSampleLabel(scene, sampleId) {
  const samples = scene.request.dataset.samples;
  const index = samples.findIndex(sample => sample.sample_id === sampleId);
  if (index < 0) return '测试用例';
  const name = samples[index].display_name?.trim();
  return name && name !== sampleId ? name : `第 ${index + 1} 条用例`;
}

function renderUgcSceneProposal(job) {
  const {proposal, case_handoff:handoff} = job.result;
  const strategy = proposal.case_strategy;
  const profile = job.request.dataset_profile;
  const catalog = job.request.capabilities;
  const background = job.result.call.request.context.background_sources;
  const sources = job.result.call.request.context.focus;
  const sourceLabel = id => {
    const source = sources[id] || background[id];
    return typeof source === 'object' ? source.name : source || id;
  };
  const metrics = proposal.metrics.map(item => {
    const metric = catalog.metrics.find(entry => entry.metric_id === item.metric_id);
    const implementation = metric.implementations.find(entry => entry.implementation_id === item.implementation_id);
    const perCase = strategy.metric_ids.includes(item.metric_id);
    return `<div class="block">
      <strong>${escapeHtml(metric.name)} · ${perCase?'逐用例任务标准':'整批共用标准'}</strong>
      <p><b>为什么选</b> ${escapeHtml(item.reason)}</p>
      <p><b>按什么标准</b> ${escapeHtml(item.standard)}</p>
      <p><b>证据不足时</b> ${escapeHtml(item.insufficient_evidence)}</p>
      ${item.source_refs.length ? `<p class="dim">${escapeHtml(item.source_refs.map(sourceLabel).join('、'))}</p>` : ''}
      <details><summary>查看实现 ${escapeHtml(item.implementation_id)}</summary>
        <p>${escapeHtml(implementation.description)}</p>
        <p>${escapeHtml(implementation.steps.map(step => toolName(step.tool)).join(' → '))}</p>
        ${promptBox('模板默认步骤、参数与评分口径', JSON.stringify({steps:implementation.steps,scoring:implementation.scoring},null,2))}
        ${implementation.default_prompts?promptBox('模板默认提示词', Object.values(implementation.default_prompts).join('\n\n')):''}
      </details></div>`;
  }).join('');
  const limitations = proposal.limitations.length ? `<h3 class="section-title">覆盖限制</h3>
    <ul class="issue-list">${proposal.limitations.map(item => `<li>${escapeHtml(sourceLabel(item.source_ref))} · ${escapeHtml(item.reason)}</li>`).join('')}</ul>` : '';
  const next = strategy.mode === 'per_case' ? `
    <p>先选一条用例验证衔接。下一次调用会读取该用例的原始生成指令、已登记参考图和上方选定的任务标准。</p>
    <ul class="issue-list">${strategy.analysis_focus.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <p class="dim">用例规划模型 ${escapeHtml(handoff.planner_profile.model)}（${escapeHtml(handoff.planner_profile.profile_id)}） · 返回 ${escapeHtml(handoff.schema_version)} · 每条用例的分析供各待评模型共用</p>
    <label>选择用例<select id="ugc-case-sample">${handoff.sample_ids.map(id=>`<option value="${escapeHtml(id)}">${escapeHtml(ugcSampleLabel(job,id))}（${escapeHtml(id)}） · ${job.request.case_references[id]?.length || 0} 张参考图</option>`).join('')}</select></label>
    <div class="actions"><button class="btn small" data-action="ugc-case-submit" data-id="${escapeHtml(job.id)}">调用 VLM 分析此用例</button></div>
    <div id="ugc-case-jobs" class="list"></div><div id="ugc-case-result"></div>
  ` : '<p>该场景采用共用标准，后续评测直接带入各用例的素材。</p>';
  return `
    <h3 class="section-title">场景理解</h3><p>${escapeHtml(proposal.scene_understanding)}</p>
    <p class="dim">${profile.sample_count} 条用例 · ${profile.distinct_prompts} 种原始指令 · 每条 ${profile.cut_count_range.join('–')} 个分镜 · 发送了 ${profile.representative_cases.length} 条代表摘要</p>
    <h3 class="section-title">选用指标与标准</h3>${metrics}${limitations}
    <h3 class="section-title">用例分析 · ${strategy.mode==='per_case'?'逐条规划':'整批共用'}</h3>
    <p><b>任务差异</b> ${escapeHtml(strategy.requirement_variation)}</p>
    <p><b>证据难度</b> ${escapeHtml(strategy.evidence_difficulty)}</p>
    <p><b>为什么这么安排</b> ${escapeHtml(strategy.reason)}</p>${next}
    <p class="dim">本次保存场景级方案。正式评分前还需根据指标实现和用例要求组装执行流程。</p>
  `;
}

function renderUgcPlanningCall(call) {
  const request = call.request;
  const returned = call.transport?.response_model;
  return `<h3 class="section-title">规划调用</h3>
    <p>请求模型 <strong>${escapeHtml(request.profile.model)}</strong> · 服务返回 <strong>${escapeHtml(returned || '未记录')}</strong> · ${call.source==='recorded'?'离线回放':'模型服务'}</p>
    ${call.reference_images.length ? stepThumbs(call.reference_images.map((asset,i)=>({asset,label:`参考图 ${i+1}`}))) : ''}
    <details class="block"><summary>查看规划 prompt、输入及返回契约</summary>
      ${promptBox('系统 prompt', request.system_prompt)}
      ${promptBox('用户消息（上下文和返回契约）', JSON.stringify({context:request.context,response_schema:request.response_schema},null,2))}
    </details>
    <details class="block"><summary>查看模型原始回复</summary>${promptBox('原始回复',call.response)}</details>`;
}

async function refreshUgcCaseJobs(sceneId) {
  const jobs = await api('/api/ugc-planning-jobs/' + route(sceneId) + '/cases');
  if (state.ugcJob?.id !== sceneId || !$('ugc-case-jobs')) return;
  $('ugc-case-jobs').innerHTML = jobs.map(job => `<button data-action="ugc-case-job" data-id="${escapeHtml(job.id)}">
    <strong>${escapeHtml(ugcSampleLabel(state.ugcJob,job.sample_id))}</strong> ${statusPill(job.status)}
    <small class="dim">用例编号 ${escapeHtml(job.sample_id)}</small></button>`).join('');
}

function renderUgcCaseJob(job) {
  if (state.ugcJob?.id !== job.scene_id || !$('ugc-case-result')) return;
  state.ugcCaseJob = job;
  markActive('ugc-case-job', job.id);
  const result = job.result || {};
  let html = `<h3 class="section-title">${escapeHtml(ugcSampleLabel(state.ugcJob,job.sample_id))} · 用例任务分析 ${statusPill(job.status)}</h3>
    <p class="dim">用例编号 ${escapeHtml(job.sample_id)}</p>`;
  if (job.error) html += `<p class="error">${escapeHtml(job.error.message)}</p>`;
  if (result.proposal) {
    for (const item of result.proposal.applicable) {
      html += `<div class="block"><strong>${escapeHtml(item.task)}</strong>
        <p><b>判断标准</b> ${escapeHtml(item.criterion)}</p>
        <p><b>需要的证据</b> ${escapeHtml(item.evidence_needed)}</p>
        <p class="dim">${escapeHtml(item.tool_ids.join(' → '))}</p>
        <blockquote>${escapeHtml(item.source_excerpt)}</blockquote></div>`;
    }
    html += `<ul class="issue-list">${result.proposal.limitations.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }
  if (result.call) html += renderUgcPlanningCall(result.call);
  $('ugc-case-result').innerHTML = html;
}

async function ugcCaseById(jobId) {
  renderUgcCaseJob(await api('/api/ugc-case-planning-jobs/' + route(jobId)));
}

function renderUgcJob(job) {
  if (state.ugcJob?.id !== job.id) state.ugcCaseJob = null;
  state.ugcJob = job;
  saved('ugc-job-id', job.id);
  if (!$('page-ugc-planning').hidden) history.replaceState(null, '', '#ugc-planning=' + route(job.id));
  markActive('ugc-job', job.id);
  const input = job.request;
  const result = job.result || {};
  const call = result.call;
  let html = `<div class="detail-head"><h2>${escapeHtml(input.display_name)} ${statusPill(job.status)}</h2></div>
    <p class="dim">测试集 ${escapeHtml(input.dataset.dataset_id)} · ${input.dataset.samples.length} 条 · 规划模型 ${escapeHtml(input.planning_profile.model)}（${escapeHtml(input.planning_profile.profile_id)}）</p>
    <p class="dim">计划视觉判读 ${escapeHtml(input.evaluation_profile.model)} · 计划文本评分 ${escapeHtml(input.evaluation_profile.model)}，均使用 ${escapeHtml(input.evaluation_profile.profile_id)}</p>`;
  html += `<details class="block"><summary>设计师提交的业务要求</summary>
    ${promptBox('业务背景', input.business_background || '未填写')}
    <ul class="issue-list">${input.focus.map((text, i) => `<li>重点 ${i+1}　${escapeHtml(text)}</li>`).join('')}</ul>
    ${input.attachments.map(file => promptBox(file.name, file.text)).join('')}
    ${input.guidance ? promptBox('维护员规划指引', input.guidance) : ''}
    </details>`;
  if (job.error) html += `<p class="error">${escapeHtml(job.error.message)}</p>`;
  if (!['queued','running'].includes(job.status)) {
    html += `<div class="actions">${job.plan_id ? `<button class="btn primary small" data-action="flow" data-id="${escapeHtml(job.plan_id)}">打开已保存的流程</button>` : ''}
      <button class="btn small" data-action="ugc-refine">沿用材料调整规划</button></div>`;
  }
  if (job.status === 'completed' && result.proposal?.schema_version === 'ugc-scene-plan/1') {
    html += renderUgcSceneProposal(job);
  }
  if (job.plan_id) {
    const sampling = result.changes.sampling;
    html += `<h3 class="section-title">方案改动</h3>
      <div class="block"><strong>抽帧 · media.cut_frames@1</strong>
      <p>密度 ${sampling.before.density} → ${sampling.after.density} · 最多 ${sampling.before.max_frames} → ${sampling.after.max_frames} 帧</p>
      <p class="dim">${escapeHtml(sampling.reason)}</p></div>`;
    for (const item of result.changes.inspect) {
      html += `<details class="block"><summary>视觉判读 · ${escapeHtml(item.check_name)}（${escapeHtml(item.category_id)}）</summary>
        <p>业务重点 ${escapeHtml(item.source_text)}</p>
        ${item.evidence_refs.length ? `<p class="dim">其他来源 ${escapeHtml(item.evidence_refs.join('、'))}</p>` : ''}
        <div class="step-prompts">${promptBox('原判读要求', item.before)}${promptBox('新判读要求（随用例渲染进 prompt）', item.after)}</div></details>`;
    }
    if (result.proposal.limitations.length) {
      html += `<h3 class="section-title">覆盖限制</h3><ul class="issue-list">${result.proposal.limitations.map(item =>
        `<li>${escapeHtml(input.focus[Number(item.source_ref.split('.').at(-1))-1])} · ${escapeHtml(item.reason)}</li>`).join('')}</ul>`;
    }
    html += '<p class="dim">评分沿用模板的评分标准。此任务只生成方案。</p>';
  }
  if (call) html += renderUgcPlanningCall(call);
  $('ugc-result').className = '';
  $('ugc-result').innerHTML = html;
}

async function ugcById(jobId) {
  const serial = ++ugcJobSerial;
  const job = await api('/api/ugc-planning-jobs/' + route(jobId));
  if (serial !== ugcJobSerial) return;
  renderUgcJob(job);
  if (job.status === 'completed' && job.result?.case_handoff?.mode === 'per_case') {
    await refreshUgcCaseJobs(job.id);
    if (state.ugcCaseJob) renderUgcCaseJob(state.ugcCaseJob);
  }
}

async function submitUgcPlanning() {
  const name = val('ugc-name');
  const focus = val('ugc-focus').split(/\r?\n/).map(text => text.trim()).filter(Boolean);
  if (!name || !focus.length) throw new Error('请填写方案名称和至少一项评价重点。');
  const datasetId = val('ugc-dataset');
  const file = $('ugc-dataset-file').files[0];
  let dataset = null;
  if (file) {
    try { dataset = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(await file.arrayBuffer())); }
    catch { throw new Error('测试集清单须为 UTF-8 JSON。'); }
  } else if (!datasetId) {
    dataset = ugcDraftFiles?.dataset;
  }
  if ((!datasetId && !dataset) || (datasetId && file)) throw new Error('请选择一个已有测试集，或上传一份清单。');
  const attachments = [...(ugcDraftFiles?.attachments || [])];
  for (const attachment of $('ugc-files').files) {
    if (!/\.(txt|md|json)$/i.test(attachment.name)) throw new Error('业务附件支持 TXT、Markdown 和 JSON。');
    let text;
    try { text = new TextDecoder('utf-8', {fatal:true}).decode(await attachment.arrayBuffer()).trim(); }
    catch { throw new Error(`业务附件「${attachment.name}」须为 UTF-8 文本。`); }
    if (!text) throw new Error(`业务附件「${attachment.name}」为空。`);
    attachments.push({name: attachment.name, text});
  }
  const referenceAssetIds = [];
  for (const image of $('ugc-reference-files').files) referenceAssetIds.push((await upload(image)).asset_id);
  const jobId = id('ugc-plan');
  const payload = {
    job_id: jobId, idempotency_key: jobId, display_name: name, dataset_id: datasetId || null,
    dataset, focus, business_background: val('ugc-background'), guidance: val('ugc-guidance'),
    attachments, reference_asset_ids: referenceAssetIds.length ? referenceAssetIds : (ugcDraftFiles?.reference_asset_ids || [])
  };
  saved('ugc-job-id', jobId);
  const serial = ++ugcJobSerial;
  const job = await api('/api/ugc-planning-jobs', payload);
  if (serial === ugcJobSerial) renderUgcJob(job);
  await refreshUgcJobs();
}

function refineUgcJob(job) {
  const request = job.request;
  ugcDraftFiles = {dataset:request.dataset, attachments:request.attachments, reference_asset_ids:request.reference_asset_ids};
  $('ugc-name').value = request.display_name;
  $('ugc-dataset').value = request.dataset_id || '';
  for (const field of ['ugc-dataset-file','ugc-reference-files','ugc-files']) $(field).value = '';
  $('ugc-background').value = request.business_background;
  $('ugc-focus').value = request.focus.join('\n');
  $('ugc-guidance').value = request.guidance;
  $('ugc-dataset-hint').textContent = `已载入 ${request.dataset.dataset_id} 的材料和 ${request.attachments.length} 份附件，可补充指引再提交。`;
  $('ugc-guidance').closest('details').open = true;
  $('ugc-guidance').focus();
}

function renderGeneration(job) {
  generationRequestSerial++;
  state.generation = job; saved('generation-id',job.job_id);
  let html = `<div class="detail-head"><h2>流程生成任务${statusPill(job.status)}</h2></div>`;
  if (job.request?.planning_source) html += `<div class="detail-meta"><span>规划来源 <b>${escapeHtml(enumNames[job.request.planning_source] || '未识别的来源')}</b></span></div>`;
  if (job.error) html += detail('生成错误', job.error, true);
  if (job.flow) {
    html += `<div class="row"><p>候选版本 <strong>${escapeHtml(flowName(job.flow.plan.plan_id))}</strong>。结果为技术试跑，尚未获得业务认可。</p><button class="btn small" data-action="flow" data-id="${escapeHtml(job.flow.plan.plan_id)}">查看流程与版本</button></div>`;
    if ((job.flow.metrics || []).length) html += `<h3 class="section-title">选用指标</h3><div class="metric-cards">${job.flow.metrics.map(m => `<div class="metric-card"><strong>${escapeHtml(metricName(m.metric_id))}</strong><p>${escapeHtml(job.flow.metric_reasons?.[m.metric_id] || '选择理由未记录')}</p></div>`).join('')}</div>`;
    html += plannedSteps(job.flow);
  }
  (job.attempts || []).forEach(a => { html += detail(`规划尝试 ${a.number} · ${status(a.status)}`, a); });
  html += '<h3 class="section-title">样例试跑</h3>' + renderRun(job.run,'generation');
  if (job.run) html += `<button class="btn" data-action="run" data-id="${escapeHtml(job.run.run_id)}">在运行评测中查看</button>`;
  $('generation-result').className = ''; $('generation-result').innerHTML = html; animateGauges($('generation-result'), true);
}
async function generationById(jobId) {
  const serial = ++generationRequestSerial;
  const job = await api('/api/generation-jobs/' + route(jobId));
  if (serial !== generationRequestSerial) return job;
  const pending = read('pending-generation');
  if (pending?.payload.request.job_id === job.job_id) { saved('last-generation',pending); localStorage.removeItem('editing-workbench:pending-generation'); }
  renderGeneration(job); return job;
}
async function snapshotRun(runId) {
  // 页面只取精简记录：已有结果的样例，事件里与样例结果重复的大字段不返回；下载时再取完整记录。
  const snap = await api('/api/runs/' + route(runId) + '?view=compact');
  if (Array.isArray(snap.events)) {
    const more = await api('/api/runs/' + route(runId) + '/events?view=compact&after_seq=' + (snap.last_seq || 0));
    const events = new Map(snap.events.map(e=>[e.seq,e]));
    for (const event of more.events || []) events.set(event.seq,event);
    snap.events = [...events.values()].sort((a,b)=>a.seq-b.seq);
    snap.last_seq = Math.max(snap.last_seq || 0, ...snap.events.map(e=>e.seq));
  }
  return snap;
}
async function runById(runId) {
  const switching = state.run?.run_id !== runId;
  state.selectedRunId = runId;
  const serial = ++runRequestSerial;
  if (switching) { $('run-result').classList.add('is-loading'); $('run-result').setAttribute('aria-busy','true'); }
  let run;
  try { run = await snapshotRun(runId); }
  finally { if (serial === runRequestSerial) { $('run-result').classList.remove('is-loading'); $('run-result').removeAttribute('aria-busy'); } }
  if (serial !== runRequestSerial) return run;
  if (switching && state.drawer?.context==='run') closeDrawer();
  state.run = run; state.runFetchedAt = Date.now(); saved('run-id',runId);
  // 打开单次评测时离开任务视图；返回任务从左侧任务列表进入。
  if (state.taskId) { state.taskId=null; state.compare=null; localStorage.removeItem('editing-workbench:task-id'); markActive('task',null); }
  const pending = read('pending-run');
  if (pending?.payload.run_id === run.run_id) { saved('last-run',pending); localStorage.removeItem('editing-workbench:pending-run'); }
  $('run-result').className = ''; $('run-result').innerHTML = renderRun(run);
  animateGauges($('run-result'), !switching);
  if (state.drawer?.context==='run' && state.drawer.runId===run.run_id) renderDrawer();
  return run;
}
async function trialById(trialId) {
  const serial = ++trialRequestSerial;
  const trial = await api('/api/tool-trials/' + route(trialId));
  if (serial !== trialRequestSerial) return trial;
  state.trial = trial; saved('trial-id', trialId);
  const tool=trial.result?.provenance?.tool_version || state.tool?.name;
  $('tool-result').innerHTML = `<div class="case-block"><div class="detail-head"><h2>${escapeHtml(toolName(tool))} · 试用结果${statusPill(trial.status)}</h2><div class="detail-actions">${rawDownload(trial,'试用原始记录')}</div></div>${trialSummary(trial,tool)}</div>`;
  return trial;
}
async function poll() {
  if (state.polling) return; state.polling = true;
  if(!SHARE) void autoPoll();
  try {
    if (!SHARE && state.ugcJob && ['queued','running'].includes(state.ugcJob.status)) {
      const shown = state.ugcJob;
      const jobs = await refreshUgcJobs();
      const current = jobs.find(job => job.id === shown.id);
      if (state.ugcJob === shown && current && current.status !== shown.status) {
        await ugcById(shown.id);
        if (current.status === 'completed') await refreshCatalogs();
      }
    }
    if (!SHARE && state.ugcCaseJob && ['queued','running'].includes(state.ugcCaseJob.status)) {
      await ugcCaseById(state.ugcCaseJob.id);
      await refreshUgcCaseJobs(state.ugcCaseJob.scene_id);
    }
    if (state.generation && generationActive(state.generation.status)) {
      const job = await generationById(state.generation.job_id);
      if (!generationActive(job.status)) { await refreshCatalogs(); await refreshRuns(); }
    }
    if (state.run && state.selectedRunId === state.run.run_id && ['queued','running'].includes(state.run.status)) {
      // 完整运行记录可达十余 MB：先查摘要，只有样例完成、状态变化或每分钟有新事件时才重新取完整记录。
      const brief = await api('/api/runs/' + route(state.run.run_id) + '/summary');
      const shown = state.run, stale = Date.now() - (state.runFetchedAt || 0) > 60000;
      const changed = brief.status !== shown.status || brief.progress?.finished !== shown.progress?.finished
        || brief.progress?.failed !== shown.progress?.failed || (stale && brief.last_seq !== shown.last_seq);
      if (changed && state.selectedRunId === shown.run_id) {
        const run = await runById(shown.run_id);
        if (!['queued','running'].includes(run.status)) await refreshRuns();
      }
    }
    // 任务里有评测在排队或运行：每 10 秒刷新运行摘要；状态或进度变化时更新任务视图（保留打开的用例面板）。
    const task=currentTask();
    if (task && task.entries.some(e=>['running'].includes(entryState(task,e).kind)) && Date.now()-(state.taskPolledAt||0)>10000) {
      state.taskPolledAt=Date.now();
      await refreshRuns();
      if (state.taskId===task.task_id && taskSignature(task)!==state.taskSignature) {
        state.taskSignature=taskSignature(task);
        // 正在看报告时重新载入报告并停在原处；否则刷新任务页。
        if (!$('page-report').hidden) { state.reportTaskId=null; await openReport(task.task_id,{tab:state.reportTab, caseKey:state.taskCaseKey}); }
        else await showTask(task.task_id,{keepDrawer:true});
      }
    }
    if (state.trial && ['queued','running'].includes(state.trial.status)) await trialById(state.trial.id);
    if (state.metricTrial && ['queued','running'].includes(state.metricTrial.job?.status)) await metricTrialById(state.metricTrial);
  } catch (e) { notice(errorMessage(e),'error'); } finally { state.polling = false; }
}
function nextVersion(planId) {
  const match = /^(.*):r(\d+)$/.exec(planId);
  if (!match) throw new Error('流程版本标识格式不正确。');
  const revisions = state.flows.map(x=>new RegExp('^' + match[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ':r(\\d+)$').exec(x.plan.plan_id)).filter(Boolean).map(x=>Number(x[1]));
  // 已删除的版本号保留给历史记录，不再分配。
  revisions.push(...(state.flows.find(x=>x.plan.plan_id===planId)?.retired_revisions || []));
  return match[1] + ':r' + (Math.max(Number(match[2]), ...revisions) + 1);
}
function observationFlowView(flow) {
  const meta=flow.metadata||{}, brief=!!flow.checks?.dimensions, checks=flow.checks?.checks||flow.checks?.dimensions||[], decompositions=flow.checks?.decompositions||[];
  const card=c=>`<div class="metric-card"><strong>${escapeHtml(c.name)}</strong><p>${escapeHtml(c.unit==='adjacent_pair'?'按相邻时刻判断':'逐张对照图判断')}${c.use_references?'，附参考图':''}</p><p class="guide">${escapeHtml(brief?`${c.task} 问题类别：${(c.categories||[]).map(x=>`${x.id} ${x.name}${x.informational?'（只作说明）':''}`).join('、')}`:[...(c.fields||[]).map(f=>f.question),...(c.item_fields?[c.item_fields.question.replace('{text}','（逐项）')]:[])].join('；'))}</p></div>`;
  return `<div class="detail-head"><h2>${escapeHtml(flowName(flow.plan.plan_id))}<span class="tag">候选版本 · ${brief?'一次视觉判读与评分':'逐项判读'}</span></h2><div class="detail-actions">${rawDownload(flow,'完整流程记录')}</div></div>`+
    `<div class="detail-meta"><span>步骤 <b>${escapeHtml(flow.plan.steps.length)} 步</b></span><span>${brief?'维度':'判断项'} <b>${escapeHtml(checks.length)} 个</b></span><span>评分 <b>${flow.scoring?'各维度 0–10 分（试用标准）':'不打分'}</b></span></div>`+
    (flow.planning_job_id?`<div class="actions"><button class="btn small" data-action="ugc-job" data-id="${escapeHtml(flow.planning_job_id)}">查看生成过程与实际模型</button></div>`:'')+
    `<p class="lead">${escapeHtml(meta.rationale||'未记录选择说明')}</p>`+
    `<h3 class="section-title">${brief?'判读维度':'判断项'}<small>${checks.length} 个</small></h3><div class="metric-cards">${checks.map(card).join('')}</div>`+
    (flow.scoring_text?`<h3 class="section-title">评分标准<small>${escapeHtml(flow.scoring.title)} 第 ${escapeHtml(flow.scoring.version)} 版 · 试用</small></h3><details class="block"><summary>查看评分标准全文</summary><div class="step-prompt-text standard-text" tabindex="0">${escapeHtml(flow.scoring_text)}</div></details>`:'')+
    decompositions.map(d=>`<h3 class="section-title">保存的编辑指令拆解</h3><p class="step-note">${escapeHtml(d.instruction)}</p><ul class="issue-list"><li>需要改变：${escapeHtml(d.change_items.map(i=>i.text).join('；'))}</li><li>需要保留：${escapeHtml(d.preserve_items.map(i=>i.text).join('；'))}</li></ul><p class="step-note">${escapeHtml(d.source_note)}</p>`).join('')+
    ((meta.open_questions||[]).length?`<h3 class="section-title">待确认事项</h3><ul class="issue-list">${meta.open_questions.map(q=>`<li>${escapeHtml(q)}</li>`).join('')}</ul>`:'')+
    plannedSteps(flow)+
    `<h3 class="section-title">历史运行</h3><button class="btn small" data-action="flow-runs" data-id="${escapeHtml(flow.plan.plan_id)}">查看此版本历史运行</button><div id="flow-runs"></div>`;
}
function flowView(flow) {
  state.flow=flow;state.editPrompts=structuredClone(flow.prompts); saved('flow-id',flow.plan.plan_id);const meta=flow.metadata||{};
  if (flow.checks) {
    ['flow-detail','flow-editor','flow-feedback','template-editor'].forEach(x=>$(x).className='tab-panel');
    $('flow-detail').innerHTML=observationFlowView(flow);
    const note='<p class="empty">逐项判读流程暂不支持在页面上改写、按反馈生成或拆成指标实现；修改内容需另存新版本。</p>';
    ['flow-editor','flow-feedback','template-editor'].forEach(x=>$(x).innerHTML=note);
    selectTab('flow-detail');return;
  }
  const metrics=meta.metrics||[];
  ['flow-detail','flow-editor','flow-feedback','template-editor'].forEach(x=>$(x).className='tab-panel');
  $('flow-detail').innerHTML=`<div class="detail-head"><h2>${escapeHtml(flowName(flow.plan.plan_id))}<span class="tag">候选版本</span></h2><div class="detail-actions">${rawDownload(flow,'完整流程记录')}</div></div>`+
    `<div class="detail-meta"><span>步骤 <b>${escapeHtml(flow.plan.steps.length)} 步</b></span><span>评价指标 <b>${escapeHtml(metrics.length)} 个</b></span></div>`+
    `<p class="lead">${escapeHtml(localizeProse(meta.rationale||'未记录选择说明'))}</p>`+
    (metrics.length?`<h3 class="section-title">评价指标<small>${metrics.length} 个</small></h3><div class="metric-cards">${metrics.map(m=>`<div class="metric-card"><strong>${escapeHtml(metricName(m.metric_id))}</strong><p>${escapeHtml(localizeProse(meta.metric_reasons?.[m.metric_id]||m.description||'未记录选择理由'))}</p><p class="guide">${escapeHtml(localizeProse(meta.scoring_guidance?.[m.metric_id]||m.score_meaning||''))}</p></div>`).join('')}</div>`:'')+
    plannedSteps(flow)+
    `<h3 class="section-title">历史运行</h3><button class="btn small" data-action="flow-runs" data-id="${escapeHtml(flow.plan.plan_id)}">查看此版本历史运行</button><div id="flow-runs"></div>`;
  $('flow-editor').innerHTML=flowEditor(flow);
  selectTab('flow-detail');
  $('flow-feedback').innerHTML=`<label>选用样例<select id="feedback-case">${state.cases.map(c=>`<option value="${escapeHtml(c.case_id)}">${escapeHtml(caseName(c.case_id))}</option>`).join('')}</select></label><label>对当前流程的反馈<textarea id="feedback-text" rows="3" placeholder="说明希望修改的指标、参数或评分依据"></textarea></label><label>参考运行（可选）<select id="feedback-run"><option value="">不选择</option>${(state.runs||[]).map(r=>`<option value="${escapeHtml(r.run_id)}">${escapeHtml(runName(r))}</option>`).join('')}</select></label><button class="btn" data-action="feedback">根据反馈生成并试跑新版本</button>`;
  const available=state.confirmAvailable?'已启用：确认人由服务端绑定。':'未启用：需要宿主核实确认人并配置确认口令。';
  $('template-editor').innerHTML=`<p>生成提案不会入库。${available}</p><label>选择指标<select id="template-metric">${(meta.metrics||[]).map(m=>`<option value="${escapeHtml(m.metric_id)}">${escapeHtml(metricName(m.metric_id))}</option>`).join('')}</select></label><label>实现名称<input id="template-id" placeholder="例如 换脸画面质量评分"></label><button class="btn" data-action="prepare-template">从当前版本准备提案</button><div id="template-preview"></div><button class="btn" data-action="propose-template">提交提案供确认</button><div id="template-confirm"></div>`;
}
function prepareTemplate() {
  const flow = state.flow, metric = val('template-metric');
  if (!metric) throw new Error('请选择指标。');
  const templateName=val('template-id'); if(!templateName) throw new Error('请填写实现名称。');
  const templateId=/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(templateName)?templateName:id('template');
  const rootSteps = flow.plan.steps.filter(s=>(s.dimension_ids || []).includes(metric));
  if (!rootSteps.length) throw new Error('此指标没有对应的评分步骤。');
  const needed = new Set(rootSteps.map(x=>x.id));
  let changed = true;
  while (changed) { changed = false; flow.plan.steps.filter(s=>needed.has(s.id)).forEach(s => [...(s.needs || []), ...(s.optional_needs || [])].forEach(dep=>{ if (!needed.has(dep)) {needed.add(dep); changed=true;} })); }
  const steps = flow.plan.steps.filter(s=>needed.has(s.id));
  const prompts = {}; steps.forEach(s=>[s.prompt_ref,s.system_prompt_ref].filter(Boolean).forEach(ref=>prompts[ref]=flow.prompts[ref]));
  const old = (flow.metadata.templates || []).find(t=>t.metric_id === metric);
  const template = {template_id:templateId, version:1, metric_id:metric, description:old?.description || '从已保存流程提议的可复用实现', input_contract:old?.input_contract || {sample:'按步骤声明的样例素材角色'}, output_contract:old?.output_contract || {dimensions:'指标评分、理由与证据'}, scoring_guidance:flow.metadata.scoring_guidance?.[metric] || old?.scoring_guidance || '按当前流程评分规则校准', rubric:flow.rubric.dimensions.find(d=>d.id === metric), steps, prompts};
  saved('template-names',{...read('template-names',{}),[templateId]:templateName});
  state.preparedTemplate=template; $('template-preview').innerHTML=detail('提案内容',template,true,{steps});
  if (rootSteps.some(s=>(s.dimension_ids || []).length > 1)) notice('该评分步骤同时负责多个指标。后端会校验模板是否可单独复用，请先检查提案内容。');
}
function selectTab(name) {
  document.querySelectorAll('#page-flows [data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.tab===name)));
  ['flow-detail','flow-editor','flow-feedback','template-editor'].forEach(x=>$(x).hidden=x!==name);
}
// 试用结果与运行步骤一致：只列实际设置、输入素材和产物。
function trialSummary(trial, tool) {
  if (['queued','running'].includes(trial.status)) return '<p class="step-note">正在执行，完成后自动刷新。</p>';
  const parameters=trial.result?.provenance?.parameters || {}, data=trial.result?.data;
  const step={tool,status:trial.status,error:trial.error || trial.result?.error,attempts:data?[{data}]:[]};
  const input=parameters.image || parameters.video;
  const inputHTML=input?.kind==='video' ? stepVideo(input,'输入视频') : input ? stepThumbs([{asset:input,label:'输入图片'}]) : '';
  const settings=stepSettings({tool},parameters,null).replace(/^来源未记录 · /,'');
  let html=stepLine('实际设置',settings?`<p class="step-setting">${escapeHtml(settings)}</p>`:'');
  if (Array.isArray(data?.actual_box_px)) {const [l,t,r,bottom]=data.actual_box_px;html+=stepLine('实际区域',`<p class="step-setting">左 ${escapeHtml(l)}、上 ${escapeHtml(t)}、右 ${escapeHtml(r)}、下 ${escapeHtml(bottom)}（像素）</p>`);}
  html+=stepLine('输入素材',inputHTML);
  html+=stepLine('结果',stepResults(step,[],null));
  return `<div class="step-body trial-body">${html}</div>`;
}
function showProposal(proposal) {
  state.proposal = proposal; saved('proposal-id',proposal.proposal_id);
  $('template-confirm').innerHTML = `<div class="block"><strong>指标实现提案</strong>${detail('审阅提案内容',proposal,true)}<label class="check"><input id="confirm-approved" type="checkbox"> 我已审阅，明确确认将此实现加入指标库</label><label>确认口令<input id="confirm-code" type="password" autocomplete="off"></label><button class="btn primary" data-action="confirm-template" ${state.confirmAvailable ? '' : 'disabled'}>确认入库</button></div>`;
}
// 指标实现只展示说明、输入要求、评分规则和步骤；完整内容通过原始记录下载。
function templateView(template, title) {
  const rubric=template.rubric||{}, range=Array.isArray(rubric.score_range)?`${rubric.score_range[0]} 至 ${rubric.score_range[1]} 分`:'';
  const inputs=Object.entries(template.input_contract||{}).map(([k,v])=>`<span class="chip">${escapeHtml(fieldNames[k]||enumNames[k]||'其他材料')}：${escapeHtml(v)}</span>`).join('');
  const independent=template.steps.some(step=>step.tool==='vlm.inspect_metric@1');
  const s2Validation=isS2ValidationTemplate(template);
  const models=independent?state.metricBackend:null;
  const cases=independent?state.cases.filter(c=>c.output?.media?.output_video):[];
  const role=!s2Validation&&({person_identity:'人物',product_fidelity:'商品'}[template.metric_id]);
  const picker=role?`<label>本次试跑的${role}参考图<select data-metric-reference>${metricReferenceOptions(cases[0])}</select></label>`:'';
  const trial=cases.length?`<div class="fields metric-trial-form"><label>试跑样例<select data-metric-case>${cases.map(c=>`<option value="${escapeHtml(c.case_id)}">${escapeHtml(caseName(c.case_id))}</option>`).join('')}</select></label>${picker}<div class="actions"><button class="btn" data-action="metric-trial-start" data-id="${escapeHtml(template.template_id)}" data-version="${template.version}">单独试跑此模板</button></div></div>`:'';
  return `<details class="block step-card" ${independent&&!s2Validation?'open':''}><summary><span class="step-title">${escapeHtml(title)}</span><span class="step-brief">${escapeHtml((template.steps||[]).length)} 个步骤</span></summary><div class="step-body">`+
    stepLine('说明',`<p class="step-note">${escapeHtml(localizeProse(template.description||'未记录'))}</p>`)+
    (independent&&!s2Validation?stepLine('流程规划', '<p class="step-note">此处显示默认参数和提示词。规划 Agent 根据任务选择模板，将调整写进本次流程版本。</p>'):'')+
    stepLine('需要材料',inputs?`<div class="chips">${inputs}</div>`:'')+
    stepLine('评分规则',`<p class="step-note">${escapeHtml(localizeProse(rubric.description||''))}${range?`（${escapeHtml(range)}${rubric.threshold!=null?`，阈值 ${escapeHtml(rubric.threshold)}`:''}）`:''}</p>`)+
    stepLine('评分建议',template.scoring_guidance?`<p class="step-note">${escapeHtml(localizeProse(template.scoring_guidance))}</p>`:'')+
    (models?stepLine('视觉模型配置',`<p class="step-note"><strong>${escapeHtml(models.model)}</strong> · 每次最多 ${escapeHtml(models.max_images)} 张图（含参考图） · 请求上限 ${escapeHtml(models.max_payload_bytes/1000000)} MB${models.execution_mode==='recorded'?' · 离线回放环境':''}</p>`):'')+
    plannedSteps({plan:{steps:template.steps||[]},prompts:template.prompts||{}},{title:'工具调用链',metricModels:models})+
    trial+rawDownload(template,title)+'</div></details>';
}
function metricReferenceOptions(caseRecord) {
  const refs=caseRecord?.sample?.media?.reference_images||[];
  const placeholder=refs.length>1?'<option value="">请选择对应参考图</option>':refs.length?'':'<option value="">此样例无参考图</option>';
  return placeholder+refs.map((_,i)=>`<option value="${i}">参考图 ${i+1}</option>`).join('');
}
let metricViewSerial=0;
async function showMetric(metricId) {
  const serial=++metricViewSerial;
  const [metric,templates]=await Promise.all([api('/api/metrics/'+route(metricId)),api('/api/metrics/'+route(metricId)+'/templates')]);
  if(serial!==metricViewSerial)return;
  state.metric=metric;$('metric-detail').className='';
  saved('metric-id',metricId);markActive('metric',metricId);
  const tasks=metric.applicable_tasks||[], roles=metric.material_roles||[];
  $('metric-detail').innerHTML=`<div class="detail-head"><h2>${escapeHtml(videoMetricName(metricId))}</h2></div><p class="lead">${escapeHtml(metric.description)}</p><p class="callout"><strong>分数含义：</strong>${escapeHtml(metric.score_meaning)}</p>`+
    stepLine('适用任务',tasks.length?renderValue(tasks,'applicable_tasks'):'<span class="dim">未限定任务</span>')+
    stepLine('需要材料',roles.length?`<div class="chips">${roles.map(r=>`<span class="chip">${escapeHtml(r==='original_instruction'?'用例原始生成要求':fieldNames[r]||displayScalar(r,'material_roles'))}</span>`).join('')}</div>`:'<span class="dim">未记录</span>')+
    `<h3 class="section-title">指标模板<small>${templates.length} 个</small></h3>`+
    (templates.length?templates.map(t=>{
      const tag=isS2ValidationTemplate(t)?'S2 验证版':t.steps.some(s=>s.tool==='vlm.inspect_metric@1')?'视频生成通用':'';
      return templateView(t,`${tag?`${tag} · ${videoMetricName(metricId)}`:metricName(metricId)} · 第 ${t.version} 版`);
    }).join(''):'<p class="empty">暂无可执行实现。</p>')+
    '<div id="metric-trial-result"></div>';
  if(state.metricTrial?.metricId===metricId) renderMetricTrial(state.metricTrial.job);
}
function renderMetricTrial(job) {
  const target=$('metric-trial-result');
  if(!target||!job)return;
  const result=job.result, evaluation=result?.evaluation;
  let html=`<h3 class="section-title">单指标试跑 ${statusPill(job.status)}</h3>`;
  if(job.error)html+=`<p class="step-note">${escapeHtml(job.error.message)}</p>`;
  if(evaluation) {
    const dim=evaluation.dimensions[0];
    const step=evaluation.steps.find(item=>item.tool==='vlm.inspect_metric@1');
    const data=step?.attempts.at(-1)?.data;
    html+=`<p class="lead">${dim.score==null?'证据不足或执行失败':`${escapeHtml(dim.score)} / 10 分`} · ${escapeHtml(dim.reason)}</p>`;
    for(const item of evaluation.steps) {
      if(item.error)html+=`<p class="step-note">${escapeHtml(toolName(item.tool))} · ${escapeHtml(item.error.message)}</p>`;
    }
    if(data?.observations?.length) {
      const names={pass:'通过',partial:'部分通过',fail:'失败',unknown:'证据不足',not_applicable:'不适用'};
      const frames=data.evidence_frames||{};
      html+=`<details class="block"><summary>逐项判读（${data.observations.length} 项）</summary><ul class="issue-list">${data.observations.map(row=>{
        const evidence=(row.evidence_frame_ids||[]).map(name=>frames[name]?timeText(frames[name].actual_time_ms):name).join('、');
        return `<li><strong>${escapeHtml(row.requirement||row.criterion)} · ${escapeHtml(names[row.status]||row.status)}</strong><p>${escapeHtml(row.reason)}${evidence?` · 证据 ${escapeHtml(evidence)}`:''}</p></li>`;
      }).join('')}</ul></details>`;
    }
  }
  if(result?.requests?.length) html+=`<details class="block"><summary>实际模型请求（${result.requests.length} 次）</summary>${result.requests.map(event=>{
    const request=actualVlmRequest({payload:event});
    return `<div class="block"><strong>${escapeHtml(event.request.model)}</strong>${event.step_id==='case_standard'?' · 用例标准':' · 逐项判读'}${request?.images?.length?vlmMaterials(request.images):''}<div class="step-prompts">${promptBox('实际系统提示词',request?.system)}${promptBox('实际评价要求',request?.prompt)}</div></div>`;
  }).join('')}</details>`;
  html+=rawDownload(job,'单指标试跑原始记录');
  target.innerHTML=html;
}
async function metricTrialById(trial) {
  const job=await api('/api/tool-trials/'+route(trial.id));
  if(state.metricTrial?.id!==trial.id)return;
  state.metricTrial={...trial,job};
  if(state.metric?.metric_id===trial.metricId)renderMetricTrial(job);
}
async function showTool(toolId) {
  const tool=await api('/api/tools/'+route(toolId));state.tool=tool;state.judgePreset=null;
  const help={
    'media.extract_clip@1':['选择视频，填写片段的开始和结束时间。','结果包含视频片段和它在原视频中的位置。'],
    'media.extract_frames@1':['选择视频，可按数量、每秒帧数或指定时间采样。','结果包含采样图片和实际时间。'],
    'media.detect_shots@1':['选择视频。模型 uva-cv-lab/OmniShotCut_v1.5 在工作台服务端运行。','每个区间返回起止帧和实际时间，可交给“抽取视频片段”。默认保留镜头和模型给出的转场关系。'],
    'media.crop_region@1':['选择图片并填写裁剪区域，坐标按图片宽高归一化。','结果包含裁剪后的图片和实际像素范围。'],
    'media.resize_view@1':['选择图片并填写目标长边像素数，保持原有宽高比例。'],
    'media.detect_faces@1':['选择一张图片（参考图或视频抽帧），可调整最低置信度、最小人脸尺寸和裁剪边距。','结果列出每张人脸的编号、置信度、像素位置和可直接用于“裁剪画面”的区域，并可生成标出位置的预览图；视频帧会保留原视频中的时间。不判断人物身份，也不跨帧对应同一人。'],
    'vlm.judge@1':['使用样例、评分规则、提示词和素材调用视觉模型评分。'],
    'vlm.judge@2':['使用样例、评分规则、提示词和素材调用视觉模型评分；可使用独立的理想效果参考。']
  };
  const [usage,output]=help[tool.name]||['该工具暂无中文说明。'];
  $('tool-detail').className='';$('tool-detail').innerHTML=`<div class="detail-head"><h2>${escapeHtml(toolName(tool.name))}</h2></div><p class="lead">${escapeHtml(String(tool.description||'').replace(/\s*\bfps\b\s*/g,'每秒帧数'))}</p>`+
    stepLine('使用方法',`<p class="step-note">${escapeHtml(usage)}</p>`)+(output?stepLine('产出',`<p class="step-note">${escapeHtml(output)}</p>`):'');
  $('tool-form').innerHTML=currentToolForm();if($('tool-sampling'))samplingFields();
}
function fillTool() {
  if(!state.tool)throw new Error('请先选择工具。');
  $('tool-form').innerHTML=currentToolForm();if($('tool-sampling'))samplingFields();
  notice('已填入示例参数，可继续修改。','success');
}
async function submitGeneration(request, repeat = false, displayName = null) {
  const pending = read('pending-generation');
  const signature = JSON.stringify({request:{...request,job_id:undefined,run_id:undefined},repeat,...(displayName?{display_name:displayName}:{})});
  let payload;
  if (pending) {
    if (pending.signature !== signature) throw new Error('上一次提交的结果尚未确认，请先查看该生成任务，不能自动发送新请求。');
    payload = pending.payload;
  } else {
    const last = read('last-generation');
    payload = last?.signature === signature ? last.payload : {request,idempotency_key:id('genkey'),repeat,...(displayName?{display_name:displayName}:{})};
    saved('pending-generation',{signature,payload}); saved('generation-id',payload.request.job_id);
  }
  try {
    const job = await api('/api/generation-jobs',payload);
    saved('last-generation',{signature,payload}); localStorage.removeItem('editing-workbench:pending-generation'); renderGeneration(job);
    if (!generationActive(job.status)) { await refreshCatalogs(); await refreshRuns(); }
    notice('生成任务已提交；可以继续查看状态。','success');
  } catch(e) { if (!e.unknown && e.status && e.status < 500) localStorage.removeItem('editing-workbench:pending-generation'); throw e; }
}
async function startRun() {
  const planId = val('run-flow'), target = val('run-kind'), targetId = val(target === 'case' ? 'run-case' : 'run-dataset'), repeat = $('run-repeat').checked;
  if (!planId || !targetId) throw new Error('请选择流程版本和评测对象。');
  const signature = JSON.stringify({planId,target,targetId,repeat});
  const pending = read('pending-run'); let payload;
  if (pending) {
    if (pending.signature !== signature) throw new Error('上一次提交的结果尚未确认，请先查看该运行，不能自动发送新请求。');
    payload = pending.payload;
  } else {
    const last = read('last-run');
    payload = last?.signature === signature ? last.payload : {run_id:id('run'),plan_id:planId,idempotency_key:id('runkey'),repeat,[target === 'case' ? 'case_id' : 'dataset_id']:targetId};
    saved('pending-run',{signature,payload}); saved('run-id',payload.run_id);
  }
  try {
    const run = await api('/api/runs',payload); saved('last-run',{signature,payload}); localStorage.removeItem('editing-workbench:pending-run');
    await runById(run.run_id); await refreshRuns(); notice('运行已提交。','success');
  } catch(e) { if (!e.unknown && e.status && e.status < 500) localStorage.removeItem('editing-workbench:pending-run'); throw e; }
}
let referenceFiles = [];
function renderReferenceOrder() {
  $('reference-order').innerHTML = referenceFiles.map((file,i)=>`<div class="row"><span>${i+1}. ${escapeHtml(niceFilename(file.name, `参考图 ${i+1}`))}</span><span><button class="btn" data-action="ref-up" data-index="${i}" ${i===0?'disabled':''}>上移</button> <button class="btn" data-action="ref-down" data-index="${i}" ${i===referenceFiles.length-1?'disabled':''}>下移</button></span></div>`).join('');
}
$('case-refs').addEventListener('change', e=>{referenceFiles=[...e.target.files];renderReferenceOrder();});
function markActive(action, itemId) {
  document.querySelectorAll(`.list button[data-action="${action}"]`).forEach(x=>x.classList.toggle('active',x.dataset.id===itemId));
}
document.querySelector('#page-flows .tabs').addEventListener('click', e=>{const tab=e.target.closest('[data-tab]');if(tab)selectTab(tab.dataset.tab);});
document.querySelector('nav').addEventListener('click', e=>{const button=e.target.closest('[data-page]');if(button) busy(button,async()=>{
  switchPage(button.dataset.page);
  if (button.dataset.page === 'ugc-planning') await refreshUgcJobs();
  if (button.dataset.page === 'automatic-evaluation') await autoSession();
});});
$('run-kind').addEventListener('change',()=>{$('run-case-label').hidden=val('run-kind')!=='case';$('run-dataset-label').hidden=val('run-kind')!=='dataset';});
$('run-search').addEventListener('input', filterRunList);
$('report-search').addEventListener('input', ()=>{ if(state.compare) renderReportTree(); });
$('run-repeat').addEventListener('change',()=>localStorage.removeItem('editing-workbench:last-run'));
$('create-case').addEventListener('click', e=>busy(e.currentTarget,async()=>{
  const caseLabel=val('case-id'), instruction=val('case-instruction'), outputSource=val('case-output-source');
  if (!caseLabel || !instruction || !outputSource || !$('case-output').files[0]) throw new Error('请填写样例名称、编辑指令、普通输出视频和输出来源。');
  const caseId=/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(caseLabel)?caseLabel:id('case');
  notice('正在上传并检查素材，请稍候。');
  const refs=[]; for (const file of referenceFiles) refs.push((await upload(file)).asset_id);
  const source=$('case-source').files[0] ? (await upload($('case-source').files[0])).asset_id : null;
  const output=(await upload($('case-output').files[0])).asset_id;
  const ideal=$('case-ideal').files[0] ? (await upload($('case-ideal').files[0])).asset_id : null;
  const result=await api('/api/cases',{case_id:caseId,display_name:caseLabel,instruction,reference_image_ids:refs,source_video_id:source,output_video_id:output,ideal_asset_id:ideal,output_source:outputSource});
  saved('case-names',{...read('case-names',{}),[caseId]:caseLabel});
  await refreshCatalogs(); $('generation-case').value=caseId; $('run-case').value=caseId;
  $('case-created').innerHTML = `<p class="success">样例 ${escapeHtml(caseName(caseId))} 已保存。</p>` + linkAssets(result) + detail('素材角色及顺序',result);
  notice('样例已保存，普通输出与可选理想参考分别记录。','success');
}));
$('ugc-submit').addEventListener('click', e=>busy(e.currentTarget,submitUgcPlanning));
$('generate').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const task=val('task-description'), name=val('flow-name'), caseId=val('generation-case');
  if (!task || !name || !caseId) throw new Error('请填写任务描述、流程名称并选择样例。');
  const flowId=/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)?name:id('flow');
  saved('flow-names',{...read('flow-names',{}),[flowId]:name});
  const request={job_id:id('generation'),task_description:task,case_id:caseId,plan_id:flowId+':r1',run_id:id('trial')};
  await submitGeneration(request,false,name);
}));
$('check-generation').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const jobId=state.generation?.job_id || read('generation-id'); if (!jobId) throw new Error('暂无生成任务。');
  await generationById(jobId); notice('已读取生成任务的当前状态。','success');
}));
$('retry-generation').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const pending=read('pending-generation');if(!pending)throw new Error('没有未确认的生成请求。');
  const job=await api('/api/generation-jobs',pending.payload);saved('last-generation',pending);localStorage.removeItem('editing-workbench:pending-generation');renderGeneration(job);
  if(!generationActive(job.status)){await refreshCatalogs();await refreshRuns();}
  notice('已使用原请求查询或提交生成任务。','success');
}));
$('cancel-generation').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const jobId=state.generation?.job_id || read('generation-id'); if (!jobId) throw new Error('暂无生成任务。');
  const job=await api('/api/generation-jobs/'+route(jobId)+'/cancel',{});renderGeneration(job);notice('已取消排队任务。','success');
}));
$('start-run').addEventListener('click',e=>busy(e.currentTarget,startRun));
$('retry-run').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const pending=read('pending-run');if(!pending)throw new Error('没有未确认的运行请求。');
  const run=await api('/api/runs',pending.payload);saved('last-run',pending);localStorage.removeItem('editing-workbench:pending-run');await runById(run.run_id);await refreshRuns();notice('已使用原请求查询或提交运行。','success');
}));
$('cancel-run').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const runId=state.run?.run_id || read('run-id');if(!runId) throw new Error('暂无运行记录。');
  await api('/api/runs/'+route(runId)+'/cancel',{});await runById(runId);await refreshRuns();notice('已取消排队任务。','success');
}));
$('create-dataset').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const datasetLabel=val('dataset-id'), description=val('dataset-description'), caseIds=[...$('dataset-cases').selectedOptions].map(x=>x.value);
  if(!datasetLabel || !description || !caseIds.length) throw new Error('请填写测试集标识、说明并选择样例。');
  const datasetId=/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(datasetLabel)?datasetLabel:id('dataset');
  await api('/api/datasets',{dataset_id:datasetId,description,case_ids:caseIds});saved('dataset-names',{...read('dataset-names',{}),[datasetId]:datasetLabel});await refreshCatalogs();$('run-dataset').value=datasetId;notice('测试集已保存。','success');
}));
$('tool-upload').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const asset=await upload($('tool-file').files[0]); $('tool-asset').value=asset.asset_id; notice('试用素材已上传。','success');
}));
$('tool-fill').addEventListener('click',e=>busy(e.currentTarget,async()=>fillTool()));
$('tool-run').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  if(!state.tool) throw new Error('请先选择工具。');
  const inputs=await toolInputs();
  const trial=await api('/api/tool-trials',{tool:state.tool.name,inputs});
  await trialById(trial.id);
}));
document.addEventListener('change', e=>{
  if(e.target.matches('[data-metric-case]')) {
    const picker=e.target.closest('.metric-trial-form').querySelector('[data-metric-reference]');
    if(picker)picker.innerHTML=metricReferenceOptions(state.cases.find(c=>c.case_id===e.target.value));
  }
  if(e.target.matches('input[type=file]') && e.target.id!=='case-refs') {const display=$(e.target.id+'-name');if(display)display.textContent=e.target.files[0]?niceFilename(e.target.files[0].name,({ 'case-source':'输入视频','case-output':'生成结果视频','case-ideal':'理想效果','tool-file':'试用素材' })[e.target.id]):'未选择文件';}
  if(e.target.id==='tool-sampling')samplingFields();
  if(e.target.id==='report-missing') {state.reportMissingOnly=e.target.checked; if(state.compare) renderReportTree();}
  if(e.target.matches('[data-edit-path]')) {try{
    const path=JSON.parse(e.target.dataset.editPath), modeChange=path.at(-1)==='mode' && path.includes('sampling');
    updateEditedValue(e.target);
    if(modeChange) {
      let sampling=state.editedFlow;path.slice(0,-1).forEach(k=>sampling=sampling[k]);
      const mode=sampling.mode;delete sampling.count;delete sampling.fps;delete sampling.times_ms;
      if(mode==='uniform')sampling.count=3;else if(mode==='fps')sampling.fps=1;else sampling.times_ms=[0];
      repaintFlowEditor();
    }
  }catch(err){notice(errorMessage(err),'error');}}
});
document.addEventListener('click',e=>{
  const zoom=e.target.closest('a[data-lightbox]');
  if(zoom && !e.metaKey && !e.ctrlKey && !e.shiftKey){e.preventDefault();openLightbox(zoom);}
},true);
document.addEventListener('keydown',e=>{
  if(e.target.closest('input, textarea, select, video, [contenteditable]'))return;
  // 可点击的问题卡片：回车或空格与点击相同。
  if((e.key==='Enter'||e.key===' ') && e.target.matches('.story-card[data-action]')){e.preventDefault();e.target.click();return;}
  if(!$('lightbox').hidden){
    if(e.key==='Escape')closeLightbox(); else if(e.key==='ArrowLeft')stepLightbox(-1); else if(e.key==='ArrowRight')stepLightbox(1); else return;
  } else if(!$('drawer').hidden){
    if(e.key==='Escape')closeDrawer(); else if(e.key==='ArrowLeft')stepDrawer(-1); else if(e.key==='ArrowRight')stepDrawer(1); else return;
  } else if(!$('page-report').hidden && state.reportTab==='cases' && state.compare){
    if(e.key==='ArrowUp')stepReportCase(-1); else if(e.key==='ArrowDown')stepReportCase(1); else return;
  } else return;
  e.preventDefault();
});
document.addEventListener('input',e=>{
  if(!e.target.matches('.sync-seek'))return;
  const videos=syncVideos(e.target), duration=Math.min(...videos.map(v=>v.duration||Infinity));
  if(!Number.isFinite(duration))return;
  const t=e.target.value/1000*duration;
  videos.forEach(v=>v.currentTime=t);
  e.target.closest('.sync-bar').querySelector('.sync-time').textContent=`${t.toFixed(1)} 秒`;
});
document.addEventListener('timeupdate',onSyncTime,true);
document.addEventListener('timeupdate',e=>{
  const v=e.target;
  if(v instanceof HTMLVideoElement && v.dataset.stopAt && v.currentTime>=Number(v.dataset.stopAt)){v.pause();delete v.dataset.stopAt;}
},true);
document.addEventListener('ended',onSyncTime,true);
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-action]');if(!button)return;
  busy(button,async()=>{
    const action=button.dataset.action, itemId=button.dataset.id;
    if(action==='ugc-job') { switchPage('ugc-planning'); await refreshUgcJobs(); await ugcById(itemId); return; }
    if(action==='ugc-refine') { refineUgcJob(state.ugcJob); return; }
    if(action==='ugc-case-job') { await ugcCaseById(itemId); return; }
    if(action==='ugc-case-submit') {
      const job = await api('/api/ugc-planning-jobs/' + route(itemId) + '/cases', {sample_id:val('ugc-case-sample')});
      await refreshUgcCaseJobs(itemId);
      renderUgcCaseJob(job);
      return;
    }
    if(action==='add-step') {
      document.querySelectorAll('#flow-editor [data-edit-path]').forEach(updateEditedValue);
      addToolStep(val('new-step-tool'));return;
    }
    if(action==='clone-step' || action==='remove-step') {
      document.querySelectorAll('#flow-editor [data-edit-path]').forEach(updateEditedValue);
      const index=Number(button.dataset.index),steps=state.editedFlow.steps,current=steps[index];
      if(action==='clone-step') {const copy=structuredClone(current);copy.id='step_'+crypto.randomUUID().replaceAll('-','');steps.splice(index+1,0,copy);}
      else {
        if(steps.length===1)throw new Error('流程至少需要保留一个步骤。');
        if(steps.some((s,i)=>i!==index&&((s.needs||[]).includes(current.id)||(s.optional_needs||[]).includes(current.id)||JSON.stringify([s.inputs,s.optional_inputs]).includes('steps.'+current.id+'.'))))throw new Error('其他步骤仍引用此步骤，请先调整对应的输入和依赖。');
        steps.splice(index,1);
      }
      repaintFlowEditor();return;
    }
    if(action==='ref-up' || action==='ref-down') {const i=Number(button.dataset.index),other=i+(action==='ref-up'?-1:1);[referenceFiles[i],referenceFiles[other]]=[referenceFiles[other],referenceFiles[i]];renderReferenceOrder();return;}
    if(action==='flow') {const flow=await api('/api/flows/'+route(itemId));flowView(flow);switchPage('flows');markActive('flow',itemId);return;}
    if(action==='metric') {await showMetric(itemId);return;}
    if(action==='metric-trial-start') {
      const metricId=state.metric.metric_id, form=button.closest('.metric-trial-form');
      const picker=form.querySelector('[data-metric-reference]');
      if(picker?.value===''&&picker.options.length>1)throw new Error('请先选择本指标对应的参考图。');
      const payload={case_id:form.querySelector('[data-metric-case]').value};
      if(picker?.value)payload.reference_index=Number(picker.value);
      const job=await api('/api/templates/'+route(itemId)+'/'+route(button.dataset.version)+'/trials',payload);
      const trial={id:job.id,metricId,job};
      state.metricTrial=trial;saved('metric-trial',{id:job.id,metricId});
      if(state.metric?.metric_id===metricId)renderMetricTrial(job);
      return;
    }
    if(action==='tool') {await showTool(itemId);markActive('tool',itemId);return;}
    if(action==='run') {await runById(itemId);switchPage('run');markActive('run',itemId);return;}
    if(action==='retry-failed') {await retryFailed(button.dataset.context);return;}
    if(action==='archive-run') {
      const target=(state.runs||[]).find(x=>x.run_id===itemId)||state.run;
      if(!window.confirm(`确定删除“${runName(target)}”吗？\n删除后不再出现在评测记录里；数据会保留，可以在左侧“已删除的记录”中恢复。`))return;
      await api('/api/runs/'+route(itemId)+'/archive',{});
      if(state.run?.run_id===itemId){state.run=null;state.selectedRunId=null;localStorage.removeItem('editing-workbench:run-id');$('run-result').className='empty';$('run-result').innerHTML='已删除。从左侧选择一条评测记录。';}
      await refreshRuns();notice('已删除，可在“已删除的记录”中恢复。','success');return;
    }
    if(action==='restore-run') {await api('/api/runs/'+route(itemId)+'/restore',{});await refreshRuns();notice('已恢复到评测记录。','success');return;}
    if(action==='run-case') {showRunCase(button.dataset.context,button.dataset.case);return;}
    if(action==='task') {await showTask(itemId);switchPage('run');return;}
    if(action==='task-create') {await saveTask(null);return;}
    if(action==='task-save') {await saveTask(itemId);return;}
    if(action==='task-include') {
      const task=currentTask(); if(!task)return;
      const picked=[...document.querySelectorAll('[data-action="task-include"]:checked')].map(x=>x.dataset.id);
      state.taskInclude={...(state.taskInclude||{}),[task.task_id]:picked}; saved('task-include',state.taskInclude);
      await showTask(task.task_id);return;
    }
    if(action==='task-eval' || action==='task-eval-all') {
      const task=currentTask(); if(!task)return;
      const targets=action==='task-eval'?[itemId]:task.entries.filter(e=>['none','failed'].includes(entryState(task,e).kind)).map(e=>e.dataset_id);
      if(!window.confirm(`将评测 ${targets.length} 组结果（${targets.map(datasetLabel).join('、')}），会实际调用评分模型；多组会排队依次进行。`))return;
      for(const datasetId of targets) await submitEntryRun(task,datasetId);
      await refreshRuns(); await showTask(task.task_id); notice('已提交评测，完成后这里会自动更新对比。','success');return;
    }
    if(action==='task-retry') {
      const run=await snapshotRun(itemId), plan=retryPlan(run);
      if(!plan)throw new Error('这组结果没有可以重测的样例。');
      if(!window.confirm(`将重新测试 ${plan.failed.length} 条没评完的样例，会实际调用评分模型；${plan.done.length} 条已完成的沿用原结果。`))return;
      await api('/api/runs',plan.payload); await refreshRuns(); await showTask(state.taskId); notice('已提交重测。','success');return;
    }
    if(action==='task-archive') {
      const task=currentTask(); if(!task)return;
      if(!window.confirm(`确定删除任务“${task.display_name}”吗？\n只删除这个任务分组，其中的测试集和评测记录都保留。`))return;
      await api('/api/tasks/'+route(itemId)+'/archive',{}); state.taskId=null; localStorage.removeItem('editing-workbench:task-id');
      await refreshTasks(); $('run-result').className='empty'; $('run-result').innerHTML='已删除任务。从左侧选择一个测试任务。'; notice('任务已删除。','success');return;
    }
    if(action==='compare-scope') {state.compareScope=itemId;closeDrawer();rerenderCompareView();return;}
    if(action==='issue-model') {
      state.issueModel=Number(itemId); rerenderCompareView();
      $('story-issues')?.scrollIntoView({behavior:'smooth',block:'start'}); return;
    }
    if(action==='report-open') {await openReport(itemId,{tab:button.dataset.tab||'overview'}); return;}
    if(action==='report-back' && SHARE) {showShareLanding(); return;}
    if(action==='compare-open' && SHARE) return;
    if(action==='report-back') {switchPage('run'); history.replaceState(null,'',location.pathname); if(state.taskId) await showTask(state.taskId); return;}
    if(action==='report-tab') {closeDrawer(); state.reportTab=itemId; renderReport(); return;}
    if(action==='report-case') {closeDrawer(); state.reportTab='cases'; state.taskCaseKey=itemId; state.openDimRow=null; renderReport(); return;}
    if(action==='report-step') {stepReportCase(Number(itemId)); return;}
    if(action==='seek') {seekColumn(button); return;}
    if(action==='issue-case') {openIssueCase(button); return;}
    if(action==='compare-open') {closeDrawer();switchPage('run');await runById(button.dataset.run);markActive('run',button.dataset.run);showRunCase('run',button.dataset.case);return;}
    if(action==='evidence') {const target=$(button.dataset.context+'-'+encodeURIComponent(button.dataset.case)+'-'+encodeURIComponent(button.dataset.step));if(!target)throw new Error('没有对应的步骤记录，评分依据可能来自未保留的历史数据。');for(let node=target;node;node=node.parentElement?.closest('details'))node.open=true;target.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='drawer-close') {closeDrawer();return;}
    if(action==='drawer-prev') {stepDrawer(-1);return;}
    if(action==='drawer-next') {stepDrawer(1);return;}
    if(action==='lightbox-close') {closeLightbox();return;}
    if(action==='lightbox-prev') {stepLightbox(-1);return;}
    if(action==='lightbox-next') {stepLightbox(1);return;}
    if(action==='sync-toggle') {
      const videos=syncVideos(button), box=button.closest('.f-case');
      if(box.dataset.syncing==='1'){stopSync(box);return;}
      videos.forEach(v=>{delete v.dataset.stopAt;});
      const start=videos[0].ended?0:videos[0].currentTime;
      videos.forEach((v,i)=>{v.currentTime=start;v.muted=i>0;});
      box.dataset.syncing='1';
      await Promise.all(videos.map(v=>v.play().catch(()=>{})));button.textContent='❚❚ 暂停';return;
    }
    if(action==='sync-rate') {const slow=button.textContent.includes('0.5');syncVideos(button).forEach(v=>v.playbackRate=slow?0.5:1);button.textContent=slow?'正常速度 1×':'慢放 0.5×';return;}
    if(action==='download-run') {const full=await api('/api/runs/'+route(itemId)),blob=new Blob([JSON.stringify(full,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='完整运行记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(action==='download-record') {const blob=new Blob([JSON.stringify(rawRecords.get(button.dataset.record),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(button.dataset.filename||'原始记录')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(action==='judge-load') {await loadJudgePreset();return;}
    if(action==='flow-runs') {
      const runs=await api('/api/runs'); const matching=runs.filter(r=>r.request?.plan_id===itemId || r.flow?.plan?.plan_id===itemId);
      $('flow-runs').innerHTML=`<div class="list">${buttonList(matching,'run',x=>x.run_id,runName,null,runListMeta)}</div>`;return;
    }
    if(action==='save-flow') {
      document.querySelectorAll('[data-edit-path]').forEach(updateEditedValue);
      const {steps,rubric}=structuredClone(state.editedFlow);
      const revision=val('new-version');if(!/^[1-9][0-9]*$/.test(revision))throw new Error('请填写有效的版本号。');
      const plan=structuredClone(state.flow.plan);plan.plan_id=plan.plan_id.replace(/:r\d+$/,':r'+revision);plan.steps=steps;
      const prompts={};document.querySelectorAll('[data-prompt]').forEach(x=>prompts[x.dataset.prompt]=x.value);
      const meta=state.flow.metadata || {}, known=new Set(state.metrics.map(x=>x.metric_id));
      const proposal={plan,rubric,prompts,rationale:meta.rationale || '根据评审修改流程',open_questions:meta.open_questions || []};
      const body={proposal,parent_plan_id:state.flow.plan.plan_id,template_refs:(meta.templates || []).map(t=>({template_id:t.template_id,version:t.version})),candidate_metrics:(meta.metrics || []).filter(m=>!known.has(m.metric_id)),metric_reasons:meta.metric_reasons,scoring_guidance:meta.scoring_guidance};
      const name=plan.plan_id.split(':r')[0];const flow=await api('/api/flows/'+route(name)+'/versions',body);await refreshCatalogs();flowView(flow);notice('新版本已保存，原版本保持不变。','success');return;
    }
    if(action==='feedback') {
      const feedback=val('feedback-text'),caseId=val('feedback-case');if(!feedback || !caseId)throw new Error('请选择样例并填写反馈。');
      const request={job_id:id('generation'),task_description:state.flow.metadata.rationale || '根据反馈修改评测流程',case_id:caseId,plan_id:nextVersion(state.flow.plan.plan_id),run_id:id('trial'),parent_plan_id:state.flow.plan.plan_id,feedback};
      if(val('feedback-run'))request.reviewed_run_id=val('feedback-run');
      await submitGeneration(request,false);switchPage('generator');return;
    }
    if(action==='prepare-template') {prepareTemplate();return;}
    if(action==='propose-template') {
      const template=state.preparedTemplate;if(!template)throw new Error('请先准备提案。');
      if(!template.template_id)throw new Error('请填写实现名称并重新准备提案。');
      const proposal=await api('/api/template-proposals',{proposal_id:id('proposal'),source_plan_id:state.flow.plan.plan_id,source_plan_sha256:state.flow.plan_sha256,template});showProposal(proposal);notice('提案已保存，尚未入库。','success');return;
    }
    if(action==='confirm-template') {
      if(!$('confirm-approved').checked)throw new Error('请先审阅并明确勾选确认入库。');
      const code=$('confirm-code').value;if(!code)throw new Error('请输入确认口令。');
      try{await api('/api/template-proposals/'+route(state.proposal.proposal_id)+'/confirm',{approved:true},{code});}finally{$('confirm-code').value='';}
      $('template-confirm').innerHTML='<p class="success">已确认入库。原流程版本没有改变。</p>';await refreshCatalogs();notice('模板已加入指标库。','success');return;
    }
  });
});
// 只读分享入口（局域网同事访问）：只展示分析报告，不显示导航和任何管理操作；写请求由分享服务拒绝。
const SHARE = Boolean(document.body.dataset.share);
const AUTOMATIC_REPORT_SHARE = document.body.dataset.share === 'automatic';
async function initAutomaticReportShare(requestedCase=new URLSearchParams(location.hash.slice(1)).get('case')) {
  switchPage('automatic-evaluation');
  const job=await api('/api/shared-video-evaluation');
  const caseId=Object.hasOwn(job.review_inputs||{},requestedCase)?requestedCase:null;
  autoState.role=job.feedback_reviewer?'designer':'viewer';
  autoState.job=job;
  $('auto-workspace').hidden=false;
  autoRender(job,caseId);
  if(caseId&&job.feedback_sharing){
    $('auto-feedback-dock').classList.add('is-open');
    $('auto-feedback-toggle').setAttribute('aria-expanded','true');
  }
  if(job.feedback_refinement?.available&&job.feedback.reviewed===job.feedback.total&&!job.feedback_refinement.history.length){
    try {await autoRefreshRefinement(job,{action:'start'});}
    catch(error) {notice(errorMessage(error),'error');}
    requestAnimationFrame(autoShowFeedbackRefinement);
  }
}
async function initShare(reportId) {
  state.taskInclude={};
  document.querySelector('[data-action="report-back"]').textContent='← 全部报告';
  await refreshTasks();
  if (reportId && (state.tasks||[]).some(t=>t.task_id===reportId)) await openReport(reportId);
  else showShareLanding();
}
function showShareLanding() {
  closeDrawer(); switchPage('report');
  state.reportTaskId=null; state.compare=null;
  history.replaceState(null,'',location.pathname);
  $('report-title').textContent='评测报告';
  $('report-scope').innerHTML=''; $('report-tree').innerHTML=''; $('report-side-note').textContent='选择一个测试任务查看分析报告。';
  document.querySelectorAll('[data-action="report-tab"]').forEach(b=>b.classList.remove('selected'));
  const tasks=state.tasks||[];
  $('report-main').innerHTML=`<section class="story"><p class="eyebrow">只读分享</p><h3 class="story-title">选择一个测试任务查看分析报告</h3>`+
    `<p class="story-lead">这里展示同一批用例上不同模型（结果组）的评测对比。页面只读，不能提交或修改评测。</p>`+
    (tasks.length?`<div class="share-tasks">${tasks.map(t=>{ const done=t.entries.filter(e=>['done','partial'].includes(entryState(t,e).kind)).length;
      return `<button class="share-task" data-action="report-open" data-id="${escapeHtml(t.task_id)}" data-tab="overview"><b>${escapeHtml(t.display_name)}</b>`+
        `<span class="dim">${escapeHtml(t.entries.map(entryLabel).join('、'))}</span><span class="dim">${t.entries.length} 组结果 · ${done} 组已评测 · ${escapeHtml(flowName(t.plan_id))}</span></button>`; }).join('')}</div>`
      :'<p class="empty">还没有可查看的测试任务。</p>')+`</section>`;
}
async function init() {
  // 先记下报告地址：后面恢复上次页面时会清掉地址中的 #report=。
  const reportId=location.hash.startsWith('#report=')?decodeURIComponent(location.hash.slice(8)):null;
  try {
    if(AUTOMATIC_REPORT_SHARE){
      await initAutomaticReportShare();
      if(!window.STATIC_SNAPSHOT)state.timer=setInterval(autoPoll,1500);
      return;
    }
    const health=await api('/api/health');state.confirmAvailable=health.template_confirmation_available===true;
    state.metricBackend=health.metric_backend;
    $('health').textContent=health.worker_alive?'服务运行中':'工作进程已停止';$('health').className='badge '+(health.worker_alive?'ok':'bad');
    await refreshCatalogs();await refreshRuns();
    if(SHARE){await initShare(reportId);state.timer=setInterval(()=>{poll();},1500);return;}
    const ugcLink=/^#ugc-planning(?:=(.+))?$/.exec(location.hash);
    const metricLink=/^#metrics(?:=(.+))?$/.exec(location.hash);
    const autoLink=/^#automatic-evaluation(?:=(.+))?$/.exec(location.hash);
    const page=autoLink?'automatic-evaluation':ugcLink?'ugc-planning':metricLink?'metrics':read('page','generator');
    switchPage(['automatic-evaluation','ugc-planning','generator','run','flows','metrics','tools'].includes(page)?page:'generator');
    if (page==='ugc-planning') await refreshUgcJobs();
    if (page==='automatic-evaluation') {
      if(autoLink?.[1])autoState.selected=decodeURIComponent(autoLink[1]);
      await autoSession();
    }
    if (page==='metrics') await showMetric(metricLink?.[1]?decodeURIComponent(metricLink[1]):read('metric-id','visual_quality'));
    const metricTrial=read('metric-trial');
    if(metricTrial) {
      state.metricTrial=metricTrial;
      try {await metricTrialById(metricTrial);} catch(e) {if(e.status!==404)notice(errorMessage(e),'error');}
    }
    const ugcJobId=ugcLink?.[1] ? decodeURIComponent(ugcLink[1]) : read('ugc-job-id');
    if (ugcJobId) try { await ugcById(ugcJobId); } catch(e) { if (e.status!==404) notice(errorMessage(e),'error'); }
    const flowId=read('flow-id');if(flowId)try{flowView(await api('/api/flows/'+route(flowId)));markActive('flow',flowId);}catch{}
    const genId=read('generation-id');if(genId)try{await generationById(genId);}catch(e){notice(errorMessage(e),'error');}
    state.taskInclude=read('task-include',{});
    try{await refreshTasks();renderTaskForm();}catch(e){notice(errorMessage(e),'error');}
    const taskId=read('task-id')||(!read('run-id')&&state.tasks?.[0]?.task_id);
    if(taskId&&(state.tasks||[]).some(t=>t.task_id===taskId))try{await showTask(taskId);}catch(e){notice(errorMessage(e),'error');}
    else {const runId=read('run-id');if(runId)try{await runById(runId);markActive('run',runId);}catch(e){notice(errorMessage(e),'error');}}
    if(reportId&&(state.tasks||[]).some(t=>t.task_id===reportId))try{await openReport(reportId);}catch(e){notice(errorMessage(e),'error');}
    const trialId=read('trial-id');if(trialId)try{await trialById(trialId);}catch(e){notice(errorMessage(e),'error');}
    const pending=read('pending-generation');if(pending && !pending.payload.request.parent_plan_id) {const req=pending.payload.request;$('task-description').value=req.task_description;$('flow-name').value=pending.payload.display_name||read('flow-names',{})[req.plan_id.replace(/:r\d+$/,'')]||entityName(req.plan_id,'流程');$('generation-case').value=req.case_id;}
    const pendingRun=read('pending-run');if(pendingRun){const req=pendingRun.payload;$('run-flow').value=req.plan_id;$('run-kind').value=req.case_id?'case':'dataset';$('run-kind').dispatchEvent(new Event('change'));$(req.case_id?'run-case':'run-dataset').value=req.case_id || req.dataset_id;$('run-repeat').checked=req.repeat;}
    state.timer=setInterval(()=>{poll();pruneRawRecords();},1500);
  } catch(e) { $('health').textContent='连接失败';$('health').className='badge bad';notice(errorMessage(e),'error'); }
  finally { document.querySelector('nav').inert=false; document.querySelector('main').inert=false; }
}
const AUTO_API='/api/video-evaluations', AUTO_SESSION='/api/video-evaluation-session';
const autoState={role:null, selected:null, requestSerial:0, job:null, copied:null, polling:false, refinementPolling:false, radarHidden:new Set(), feedbackQueue:Promise.resolve()};
const autoLabels={planning:'入口 Agent 正在设计流程',case_standards:'正在整理共用用例标准',evaluating:'正在评测视频',
  person_realism:'Opus 5.5 正在复核人物真实感',
  reporting:'报告 Agent 正在汇总',completed:'报告已生成'};
const autoTools={'media.detect_shots@1':'检测实际镜头','media.sample_metrics@1':'合并采样证据帧',
  'vlm.inspect_shot@1':'分镜四项视觉判读','media.inspect_shot_audio@1':'口播与嘴形检查',
  'vlm.inspect_metric@1':'视觉判读与程序算分'};
const autoNamed=value=>autoTools[value]||value;
const autoPct=value=>value==null?'证据不足':`${(value*100).toFixed(1)}%`;
const autoText=value=>escapeHtml(value??'—');

function autoDatasets() {
  const select=$('auto-datasets');
  const checked=new Set([...select.selectedOptions].map(row=>row.value));
  select.innerHTML=(state.datasets||[]).map(d=>`<option value="${autoText(d.dataset_id)}"${checked.has(d.dataset_id)?' selected':''}>${autoText(d.display_name||d.dataset_id)} · ${(d.case_ids||[]).length} 条</option>`).join('');
}
async function autoSession() {
  const session=await api(AUTO_SESSION);
  autoState.role=session.role;
  $('auto-login-panel').hidden=!!session.role;
  $('auto-workspace').hidden=!session.role;
  $('auto-form-panel').hidden=session.role!=='designer';
  $('auto-who').textContent=session.role==='maintainer'?'维护员':'设计师';
  if(session.role) {
    autoDatasets();
    await autoList();
    const selected=autoState.selected || read('automatic-job-id');
    if(selected) {
      try {await autoOpen(selected);} catch(e) {if(e.status!==404)throw e;}
    }
  }
}
async function autoList() {
  const jobs=await api(AUTO_API);
  $('auto-jobs').innerHTML=jobs.length?jobs.map(row=>`<button data-action="auto-open" data-id="${autoText(row.id)}"><strong>${autoText(row.name)}</strong> ${statusPill(row.status)}</button>`).join(''):'<p class="empty">暂无评测任务。</p>';
  markActive('auto-open',autoState.selected);
  if(!jobs.length&&autoState.role==='designer')$('auto-form-panel').open=true;
}
function autoDetailsByKey(result) {
  const keys=new Map(), counts=new Map();
  for(const panel of result.querySelectorAll('details')){
    const parent=panel.parentElement.closest('details');
    const label=panel.dataset.autoDetailsKey||panel.id||panel.querySelector(':scope > summary')?.textContent.trim();
    const group=JSON.stringify([keys.get(parent),label]);
    const count=(counts.get(group)||0)+1;
    counts.set(group,count);
    keys.set(panel,JSON.stringify([group,count]));
  }
  return keys;
}
function autoRenderProgress(job) {
  const result=$('auto-result');
  const details=new Map([...autoDetailsByKey(result)].map(([panel,key])=>[key,panel.open]));
  const panel=$('auto-trace'), selection=$('auto-trace-select')?.value;
  const {scrollX,scrollY}=window;
  const top=result.scrollTop;
  autoRender(job);
  for(const [item,key] of autoDetailsByKey(result))if(details.has(key))item.open=details.get(key);
  const select=$('auto-trace-select');
  if(select&&[...select.options].some(option=>option.value===selection))select.value=selection;
  if(panel?.childNodes.length){
    const placeholder=$('auto-trace');
    const trigger=result.querySelector(`[data-action="auto-show-trace"][data-id="${CSS.escape(panel.dataset.traceId)}"]`);
    if(placeholder)placeholder.replaceWith(panel);
    else if(trigger)trigger.after(panel);
    else result.append(panel);
  }
  result.scrollTop=top;
  window.scrollTo(scrollX,scrollY);
}
async function autoOpen(id,{poll=false}={}) {
  const serial=poll?autoState.requestSerial:++autoState.requestSerial;
  const job=await api(AUTO_API+'/'+route(id));
  if(serial!==autoState.requestSerial||!autoState.role)return;
  if(poll){
    const shown=autoState.job;
    if(shown?.id!==id||job.status===shown.status&&JSON.stringify(job.result)===JSON.stringify(shown.result))return;
    autoState.job=job;
    autoRenderProgress(job);
    return job;
  }
  const resultChanged=autoState.job?.id!==id;
  if(resultChanged)autoState.radarHidden.clear();
  autoState.selected=id;
  autoState.job=job;
  saved('automatic-job-id',id);
  markActive('auto-open',id);
  if (!$('page-automatic-evaluation').hidden) history.replaceState(null,'','#automatic-evaluation='+encodeURIComponent(id));
  autoRender(job);
  if(resultChanged)window.scrollTo(0,0);
}
function autoSetReportMode(enabled) {
  document.body.classList.toggle('auto-report-mode',enabled);
  $('auto-report-back').hidden=!enabled;
}

function autoCloseReport() {
  ++autoState.requestSerial;
  autoState.selected=null;
  autoState.job=null;
  saved('automatic-job-id',null);
  markActive('auto-open',null);
  autoShotTooltip(null);
  autoCloseFinding();
  autoCasePages().forEach(autoStopPlayback);
  autoSetReportMode(false);
  $('auto-result').innerHTML='<p class="empty">从左侧选择评测任务。</p>';
  history.replaceState(null,'','#automatic-evaluation');
  window.scrollTo(0,0);
  $('auto-jobs').querySelector('button')?.focus({preventScroll:true});
}
function autoTable(headers, rows) {
  return `<div class="auto-table-wrap"><table class="face-table auto-table"><thead><tr>${headers.map(h=>`<th scope="col">${autoText(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function autoBullets(list) {
  return list?.length?`<ul class="issue-list">${list.map(item=>`<li>${autoText(item)}</li>`).join('')}</ul>`:'<span class="dim">暂无可确认结论</span>';
}
function autoIssue(issue) {
  const trace=autoState.role==='maintainer'
    ?`<button class="btn small" data-action="auto-show-trace" data-id="${autoText(issue.entry_id)}">追溯该问题的工具调用</button>`:'';
  const timestamps=issue.times_ms?.map(timeText).join('、');
  return `<li><strong>${autoText(issue.case_name)} · ${autoText(issue.requirement)}</strong><p>${autoText(issue.reason)}${timestamps?` · ${autoText(timestamps)}`:''}</p>${stepThumbs((issue.evidence||[]).map(frame=>({asset:frame.asset,label:'观察证据',time:frame.actual_time_ms})))}${trace}</li>`;
}
const autoShortModel=name=>name.replace(/^电商 UGC · /,'');
const autoMetricLabels={storyboard:'分镜与拍法',temporal_continuity:'运动与时序',
  product_fidelity:'商品还原',visual_quality:'画面清晰度与质量'};
const autoShotMetricNames={person_identity:'人物一致性',product_fidelity:'商品一致性',
  task_completion:'任务严格完成',physical_compliance:'物理事实与提示词禁令'};

function autoScoreBasis(score, modelCount) {
  if (!score?.comparable_cases) return '没有各组都有分的测试';
  return `共 ${score.total_cases} 条测试，${modelCount} 组都有分的有 ${score.comparable_cases} 条`;
}

function autoComparisonMetrics(report) {
  return report.metrics.flatMap(metric=>{
    const scores=report.models.map(model=>model.scores[metric.id]);
    const rates=report.models.map(model=>model.rates[metric.id]);
    const hasRate=metric.id==='task_completion'&&rates[0]?.count>0&&
      rates.every(rate=>rate?.count===rates[0].count&&Number.isFinite(rate.ratio));
    if(!hasRate&&(!scores[0]?.comparable_cases||scores.some(score=>
      score?.comparable_cases!==scores[0].comparable_cases||!Number.isFinite(score.score))))return [];
    const entries=report.models.map((model,index)=>({
      model:model.id,name:autoShortModel(model.name),value:hasRate?rates[index].ratio:scores[index].score,
      passed:rates[index]?.pass,checkCount:rates[index]?.count
    }));
    const max=Math.max(...entries.map(entry=>entry.value));
    const min=Math.min(...entries.map(entry=>entry.value));
    const leaders=entries.filter(entry=>entry.value===max);
    const format=value=>hasRate?autoPct(value):value.toFixed(2);
    const basis=hasRate?`${rates[0].count} 项检查，各组都能判断`:autoScoreBasis(scores[0],report.models.length);
    return [{...metric,label:hasRate?'关键任务完全通过率':autoMetricLabels[metric.id]||metric.name,
      entries,max,min,leaders,hasRate,format,basis,spread:(max-min)/(hasRate?1:10)}];
  });
}

function autoReportHero(report, comparison) {
  const task=comparison.find(metric=>metric.id==='task_completion'&&metric.hasRate);
  const wider=comparison.filter(metric=>metric!==task&&metric.spread>0).sort((a,b)=>b.spread-a.spread).slice(0,2);
  const highlights=[task,...comparison.filter(metric=>wider.includes(metric))].filter(Boolean);
  const groupCount=report.models.length;
  const taskRange=task&&(task.min===task.max?task.format(task.max):`${task.format(task.min)}–${task.format(task.max)}`);
  const difference=wider.length?`<strong>${autoText(highlights.filter(metric=>metric!==task).map(metric=>metric.label).join('、'))}</strong>`:'';
  const sentence=task&&difference?`关键任务完全通过率为 <strong>${taskRange}</strong>，组间差距较大的指标是${difference}。`:
    task?`关键任务完全通过率为 <strong>${taskRange}</strong>${task.min===task.max?'，各组在该指标上并列':''}。`:
      difference?`本批组间差距较大的指标是${difference}。`:autoText(report.conclusion);
  const groups=report.models.map(model=>`${autoShortModel(model.name)} ${model.matched_count}/${model.available_count} 条`);
  const cards=highlights.map(metric=>{
    const top=metric.leaders;
    const heading=metric.hasRate?(top.length===groupCount?'各组并列':top.length>1?`${top.length} 组并列最高`:top[0].name):top.map(entry=>entry.name).join('、');
    const trailing=metric.entries.filter(entry=>entry.value<metric.max);
    const note=metric.hasRate&&trailing.length===1?
      `${trailing[0].name} ${metric.format(trailing[0].value)}（${trailing[0].passed}/${trailing[0].checkCount}）`:metric.basis;
    return `<div class="auto-hero-stat">
      <span class="auto-hero-stat-label">${autoText(metric.label)}</span>
      <strong class="auto-hero-stat-number">${metric.format(metric.max)}<small>${metric.hasRate?'':'/ 10'}</small></strong>
      <span class="auto-hero-stat-model">${autoText(heading)}</span>
      <span class="auto-hero-stat-basis">${autoText(note)}</span>
    </div>`;
  }).join('');
  const title=report.report_revision?report.title.replace(/ · 禁止项证据复核$/,''):report.title;
  return `<header class="auto-report-hero">
    <p class="auto-report-scope"><span>${groupCount} 组模型</span><span>同一批 ${report.matched_case_count} 条测试</span></p>
    <h2>${autoText(title)}</h2>
    <p class="auto-conclusion">${sentence}</p>
    ${cards?`<div class="auto-hero-stats">${cards}</div>`:''}
    <details class="auto-report-source"><summary>评测范围与报告来源</summary>
      <p>${autoText(groups.join(' · '))}。数量为纳入本次对比的结果 / 已登记结果。</p>
      <p>报告 Agent ${autoText(report.report_model)}${report.report_revision?` · 禁止项证据复核基于任务 ${autoText(report.report_revision.source_job_id)} 的实际请求`:''}</p>
    </details>
  </header>`;
}

function autoModelComparison(models, comparison) {
  const task=comparison.find(metric=>metric.id==='task_completion'&&metric.hasRate&&metric.spread>0);
  const different=comparison.filter(metric=>metric.spread>0&&metric!==task);
  const ties=comparison.filter(metric=>metric.spread===0);
  const rows=models.map(model=>{
    const entries=different.map(metric=>({metric,entry:metric.entries.find(entry=>entry.model===model.id)}));
    const wins=entries.filter(({metric,entry})=>entry.value===metric.max).sort((a,b)=>b.metric.spread-a.metric.spread);
    const outright=wins.filter(({metric})=>metric.leaders.length===1);
    const leaders=(outright.length?outright:wins).slice(0,2);
    const gaps=entries.filter(({metric,entry})=>entry.value<metric.max)
      .sort((a,b)=>(b.metric.max-b.entry.value)/(b.metric.hasRate?1:10)-(a.metric.max-a.entry.value)/(a.metric.hasRate?1:10)).slice(0,2);
    const list=(items,isGap)=>items.length?`<ul class="auto-delta-list">${items.map(({metric,entry})=>{
      const delta=metric.max-entry.value;
      const detail=isGap?`距最高 ${metric.hasRate?`${(delta*100).toFixed(1)} 个百分点`:`${delta.toFixed(2)} 分`}`:
        metric.leaders.length===1?'单独领先':`${metric.leaders.length} 组并列领先`;
      return `<li><div><strong>${autoText(metric.label)}</strong><span class="auto-delta-value">${metric.format(entry.value)}${metric.hasRate?'':' 分'}</span></div>
        <small>${autoText(detail)} · ${autoText(metric.basis)}</small></li>`;
    }).join('')}</ul>`:`<span class="dim">${isGap?'未见组间差距':'暂无相对领先项'}</span>`;
    const taskResult=task?.entries.find(entry=>entry.model===model.id);
    const taskNote=taskResult?`<small class="auto-delta-task">关键任务 ${taskResult.passed}/${taskResult.checkCount} · ${task.format(taskResult.value)}</small>`:'';
    return `<tr><th scope="row">${autoText(autoShortModel(model.name))}${taskNote}</th>
      <td data-label="相对领先">${list(leaders,false)}</td><td class="auto-delta-gap" data-label="主要差距">${list(gaps,true)}</td></tr>`;
  });
  const table=different.length||task?`<div class="auto-table-wrap"><table class="auto-delta-table">
    <thead><tr><th scope="col">候选模型</th><th scope="col">相对领先</th><th scope="col">主要差距</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`:`<p class="auto-tie-note">${comparison.length?'这批能比较的分数相同。':'没有各组都有分的项目，暂时无法比较。'}</p>`;
  const tieNote=ties.length?`<p class="auto-tie-note"><strong>各组同分</strong> ${autoText(ties.map(metric=>`${metric.label} ${metric.format(metric.max)}${metric.hasRate?'':' 分'}`).join(' · '))}</p>`:'';
  return `<section class="auto-delta-section"><h3>模型优劣</h3>${table}${tieNote}</section>`;
}

function autoReportScores(report) {
  const modelCount=report.models.length;
  const columns=report.metrics.map(metric=>{
    const score=report.models[0].scores[metric.id];
    const name=autoMetricLabels[metric.id]||metric.name;
    return `<th scope="col">${autoText(name)}<small>${autoText(autoScoreBasis(score,modelCount))}</small></th>`;
  }).join('');
  const rows=report.models.map(model=>{
    const cells=report.metrics.map(metric=>{
      const score=model.scores[metric.id];
      const points=Number.isFinite(score?.score)?`<b>${score.score.toFixed(2)}</b>`:'<b class="dim">暂无对比分数</b>';
      const ownCount=Number.isFinite(score?.scorable_cases)?`<small>这组有 ${score.scorable_cases} 条拿到分</small>`:'';
      const coverage=Number.isFinite(score?.mean_evidence_coverage)?
        `<small>平均能判断 ${Number((score.mean_evidence_coverage*100).toFixed(1))}% 的检查</small>`:'';
      return `<td>${points}${ownCount}${coverage}</td>`;
    }).join('');
    return `<tr><th scope="row">${autoText(autoShortModel(model.name))}</th>${cells}</tr>`;
  }).join('');
  return `<section class="auto-score-section">
    <h3 id="auto-score-heading">各项得分 <small>满分 10 分</small></h3>
    <p>每一列都用各组拿到分的同一批测试来比。一条测试只要有一组没拿到分，就先从这一列的对比里拿掉。</p>
    <div class="auto-table-wrap" role="region" aria-labelledby="auto-score-heading" tabindex="0">
      <table class="face-table auto-table auto-score-table">
        <thead><tr><th scope="col">模型</th>${columns}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="auto-score-note"><strong>「平均能判断多少检查」</strong>按这组做过该项检查的所有测试取平均。只要能判断结果就算在内，包括判为失败。评测引用的画面和要检查的那一段对不上时，能判断的检查就会变少。各组实际能判断的检查可能不同。</p>
  </section>`;
}

const autoRadarColors=['#efae78','#80c9b9','#e99cb4','#9fb5ff','#dfcd71','#9ccf86','#cb9be5','#64bedf'];

function autoFeedbackLabel(caseId) {
  const row=autoState.job?.feedback?.records[caseId];
  if(!row)return '待核对';
  if(row.needs_reconfirmation)return '推荐已更新，待重新核对';
  if(row.recommendation_agrees===false)return '推荐有出入';
  if(row.recommendation_agrees===true)return '推荐一致';
  return '已记录观察';
}

function autoFeedbackSummary() {
  const data=autoState.job?.feedback;
  if(!data)return '';
  const count=data.recommendation_reviewed;
  const summaryReady=autoState.job.feedback_refinement?.available&&data.reviewed===data.total;
  const eligible=Object.values(data.targets).filter(target=>target.leaders.length>0).length;
  const observations=Object.values(data.records).filter(record=>record.observations).length;
  const agreement=count?
    `<span>推荐一致 <b>${data.recommendation_agreed}/${count}（${(100*data.recommendation_agreed/count).toFixed(1)}%）</b></span>`:
    '<span>填写推荐判断后显示一致率</span>';
  return `<aside class="auto-feedback-summary" data-auto-feedback-summary>
    <div aria-live="polite"><strong>设计师核对</strong>
      <span>已反馈 <b>${data.reviewed}/${data.total} 条</b></span>
      <span>已写观察 <b>${observations}/${data.total} 条</b></span>
      ${agreement}
    </div>
    ${summaryReady?'<button class="btn small primary" type="button" data-action="auto-refinement-view">查看反馈总结</button>':
      autoState.role==='designer'&&count<eligible?`<button class="btn small" type="button" data-action="auto-feedback-next">${count?'下一条未填推荐判断':'开始核对推荐'}</button>`:''}
  </aside>`;
}

function autoFeedbackDraftKey(job,caseId) {
  return ['automatic-feedback',job.id,job.feedback_reviewer?.id,job.feedback.version,caseId].filter(Boolean).join(':');
}

const autoFeedbackImageDrafts=new Map();
const autoFeedbackSaveTimers=new Map();
const autoFeedbackSaving=new Set();
const autoFeedbackStale=new WeakSet();
const autoFeedbackRefreshMessage='报告已更新，请刷新页面后再提交，草稿会保留';

function autoFeedbackImages(job,caseId) {
  return autoFeedbackImageDrafts.get(autoFeedbackDraftKey(job,caseId))??job.feedback.records[caseId]?.images??[];
}

function autoFeedbackImageList(images,editable=false) {
  if(!images.length)return '';
  const group='feedback-'+(++lightboxSerial);
  return `<ul class="auto-feedback-images">${images.map((image,index)=>{
    const url='data:image/jpeg;base64,'+autoText(image);
    const label=`反馈图片 ${index+1}`;
    return `<li><a href="${url}" data-lightbox="${group}" data-caption="${label}"><img loading="lazy" src="${url}" alt="${label}"></a>
      ${editable?`<button type="button" class="btn small" data-action="auto-remove-feedback-image" data-index="${index}" aria-label="移除${label}">移除</button>`:''}</li>`;
  }).join('')}</ul>`;
}

function autoUpdateFeedbackImages(form,images) {
  const box=form.closest('[data-auto-feedback-case]');
  const job=autoState.job;
  autoFeedbackImageDrafts.set(autoFeedbackDraftKey(job,box.dataset.autoFeedbackCase),images);
  form.querySelector('[data-auto-feedback-images]').innerHTML=autoFeedbackImageList(images,true);
  autoScheduleFeedbackSave(job,box.dataset.autoFeedbackCase,0);
}

async function autoAttachFeedbackImages(form,files) {
  const status=form.querySelector('[data-auto-feedback-image-status]');
  const job=autoState.job;
  const caseId=form.closest('[data-auto-feedback-case]').dataset.autoFeedbackCase;
  const key=autoFeedbackDraftKey(job,caseId);
  const images=autoFeedbackImages(job,caseId);
  if(form.dataset.processingImages)return;
  if(images.length+files.length>3){status.textContent='每条反馈最多添加 3 张图片。';return;}
  form.dataset.processingImages='1';
  status.textContent='正在处理图片…';
  try {
    const attached=[];
    for(const file of files){
      if(file.size>20*1024*1024)throw new Error('原图超过 20 MB，请先缩小再添加。');
      const bitmap=await createImageBitmap(file);
      try {
        const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(bitmap.width*scale));
        canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        const context=canvas.getContext('2d');
        context.fillStyle='#fff';
        context.fillRect(0,0,canvas.width,canvas.height);
        context.drawImage(bitmap,0,0,canvas.width,canvas.height);
        let image=canvas.toDataURL('image/jpeg',0.85).split(',')[1];
        if(image.length>699052)image=canvas.toDataURL('image/jpeg',0.65).split(',')[1];
        if(image.length>699052)throw new Error('图片压缩后仍过大，请裁剪后再添加。');
        attached.push(image);
      } finally {bitmap.close();}
    }
    const next=[...autoFeedbackImages(job,caseId),...attached];
    if(next.length>3)throw new Error('每条反馈最多添加 3 张图片。');
    if(form.isConnected&&autoState.job===job)autoUpdateFeedbackImages(form,next);
    else {
      autoFeedbackImageDrafts.set(key,next);
      autoScheduleFeedbackSave(job,caseId,0);
    }
    status.textContent='';
  } catch(error) {
    status.textContent=/[\u3400-\u9fff]/.test(error.message)?error.message:'无法读取这张图片，请换一张再试。';
  } finally {delete form.dataset.processingImages;}
}

function autoFeedbackValues(form) {
  const choice=form.elements.recommendation?.value;
  return {
    recommendation_agrees:choice?choice==='yes':null,
    recommendation_reason:form.elements.recommendation_reason?.value||'',
    preferred_models:[...form.querySelectorAll('input[name="model"]:checked')].map(item=>item.value),
    observations:form.elements.observations.value,
  };
}

function autoFeedbackBox(caseId,title) {
  const job=autoState.job;
  const {leaders}=job.feedback.targets[caseId];
  const row=job.feedback.records[caseId];
  const writable=autoState.role==='designer';
  const key=autoFeedbackDraftKey(job,caseId);
  const draft=writable?read(key):null;
  const hasDraft=Boolean(draft)||writable&&autoFeedbackImageDrafts.has(key);
  const images=writable?autoFeedbackImages(job,caseId):row?.images||[];
  const stored=draft||row;
  const legacyRecommendation=stored?.issues?.includes('recommendation');
  const agreement=stored?.recommendation_agrees??(legacyRecommendation?false:null);
  const reason=stored?.recommendation_reason??(legacyRecommendation?stored.reason:'');
  const observations=stored?.observations??(!legacyRecommendation||stored.issues.includes('evidence')?stored?.reason||'':'');
  const modelNames=Object.fromEntries(job.groups.map(group=>[group.id,autoShortModel(group.name)]));
  const best=leaders.length
    ?`<p class="auto-feedback-recommendation">${job.product_case_decisions?'原评分推荐':'系统推荐'} <strong>${autoText(leaders.map(id=>modelNames[id]).join('、'))}</strong>${leaders.length>1?'（并列）':''}</p>`
    :'<p class="auto-feedback-recommendation dim">系统暂未给出最佳结果。</p>';
  const models=job.groups.map(group=>{
    const checked=stored?.preferred_models.includes(group.id)?' checked':'';
    return `<label><input type="checkbox" name="model" value="${autoText(group.id)}"${checked}> ${autoText(modelNames[group.id])}</label>`;
  }).join('');
  const recommendationControls=leaders.length?`
    <fieldset><legend>和你的判断一致吗？</legend>
      <div class="auto-feedback-choices">
        <label><input type="radio" name="recommendation" value="yes"${agreement===true?' checked':''}> 是</label>
        <label><input type="radio" name="recommendation" value="no"${agreement===false?' checked':''}> 否</label>
      </div>
    </fieldset>
    <fieldset class="auto-feedback-recommendation-details" data-auto-feedback-alternative${agreement===false?'':' hidden disabled'}>
      <legend>你认为哪个最好？（如有并列可多选）</legend>
      <div class="auto-feedback-choices">${models}</div>
      <label>推荐理由<textarea name="recommendation_reason" rows="3" maxlength="4000" required>${autoText(reason)}</textarea></label>
    </fieldset>`:'';
  const savedRecommendation=agreement===false
    ?`<div class="auto-feedback-note"><b>设计师推荐 ${autoText((row?.preferred_models||[]).map(id=>modelNames[id]||id).join('、')||'未填写')}</b><p>${autoText(reason)}</p></div>`
    :`<p class="auto-feedback-note">${agreement===true?'设计师判断一致':'设计师尚未核对推荐'}</p>`;
  return `<section class="auto-feedback-case" data-auto-feedback-case="${autoText(caseId)}">
    <div class="auto-feedback-heading" tabindex="-1">
      <h2 id="auto-feedback-title">${writable?'用例反馈':'设计师判断'}</h2>
      <small aria-live="polite" data-auto-feedback-status>${hasDraft?(autoFeedbackStale.has(job)?autoFeedbackRefreshMessage:'有修改待自动保存'):row?'已保存':autoFeedbackLabel(caseId)}</small>
    </div>
    <p class="auto-feedback-case-name">${autoText(title)}</p>
    ${writable?`<form class="auto-feedback-form">
      <section class="auto-feedback-section" aria-label="最佳结果判断">
        <h3>最佳结果判断</h3>${best}${recommendationControls}
      </section>
      <section class="auto-feedback-section">
        <label for="auto-feedback-observations">其他观察（可选）</label>
        <textarea id="auto-feedback-observations" name="observations" rows="4" maxlength="4000"
          placeholder="可以写模型、分镜或时间戳，也可以直接粘贴截图。">${autoText(observations)}</textarea>
        <label class="auto-feedback-attach">粘贴截图或选择图片
          <input type="file" accept="image/*" multiple data-auto-feedback-image-input>
        </label>
        <p class="dim" data-auto-feedback-image-status aria-live="polite"></p>
        <div data-auto-feedback-images>${autoFeedbackImageList(images,true)}</div>
      </section>
      <small class="dim" data-feedback-save-progress>已保存 ${job.feedback.reviewed}/${job.feedback.total} 条 · 修改会自动保存</small>
      <button class="btn small" type="button" data-action="auto-retry-feedback-save" hidden>重试保存</button>
      <button class="btn small primary" type="button" data-action="auto-refinement-view" data-feedback-summary-shortcut
        ${job.feedback_refinement?.available&&job.feedback.reviewed===job.feedback.total?'':'hidden'}>查看反馈总结</button>
    </form>`:`<section class="auto-feedback-section"><h3>最佳结果判断</h3>${best}${savedRecommendation}</section>
    ${observations||images.length?`<section class="auto-feedback-section"><h3>其他观察</h3><div class="auto-feedback-note"><p>${autoText(observations)}</p></div>${autoFeedbackImageList(images)}</section>`:''}`}
  </section>`;
}

function autoRenderFeedback(page) {
  const dock=$('auto-feedback-dock');
  if(!dock)return;
  const caseId=page.dataset.autoCasePage;
  const job=autoState.job;
  const register=job?.feedback_sharing&&!job.feedback_reviewer;
  dock.hidden=!register&&!job?.feedback?.targets[caseId];
  const title=page.querySelector('.auto-case-heading h3').textContent;
  const identity=job?.feedback_reviewer?`<div class="auto-share-feedback-person">填写人 <b>${autoText(job.feedback_reviewer.name)}</b></div>`:'';
  $('auto-feedback-body').innerHTML=dock.hidden?'':register?`<form class="auto-share-feedback-entry">
    <h2>用例反馈</h2><label>姓名<input name="name" maxlength="60" required autocomplete="name"></label>
    <button type="submit" class="btn small primary">开始填写</button></form>`:identity+autoFeedbackBox(caseId,title);
  $('auto-feedback-toggle').textContent='反馈 · '+title;
}

async function startSharedFeedback(name) {
  const caseId=autoCasePages().find(page=>!page.hidden)?.dataset.autoCasePage;
  const expanded=$('auto-feedback-dock')?.classList.contains('is-open');
  await api('/api/shared-feedback-session',{name});
  await initAutomaticReportShare(caseId||null);
  if(expanded){
    $('auto-feedback-dock').classList.add('is-open');
    $('auto-feedback-toggle').setAttribute('aria-expanded','true');
  }
}

function autoFeedbackNext() {
  const pages=autoCasePages();
  if(pages.length){
    const current=autoState.job.feedback.recommendation_reviewed?pages.findIndex(page=>!page.hidden):-1;
    const ordered=[...pages.slice(current+1),...pages.slice(0,current+1)];
    const next=ordered.find(page=>page.dataset.reviewed==='false');
    if(next)autoShowCase(next.dataset.autoCasePage,true);
    return;
  }
  const target=$('auto-result').querySelector('[data-auto-review-case][data-reviewed="false"]');
  if(!target)return;
  if(target.tagName==='DETAILS')target.open=true;
  target.scrollIntoView({block:'start'});
  target.querySelector(':scope > summary')?.focus({preventScroll:true});
}

function autoFeedbackSaveStatus(caseId,message,retry=false) {
  const box=$('auto-feedback-body').querySelector(`[data-auto-feedback-case="${CSS.escape(caseId)}"]`);
  if(!box)return;
  box.querySelector('[data-auto-feedback-status]').textContent=message;
  const button=box.querySelector('[data-action="auto-retry-feedback-save"]');
  if(button)button.hidden=!retry;
}

function autoScheduleFeedbackSave(job,caseId,delay=1200) {
  if(autoState.job!==job||autoState.role!=='designer'||!job.feedback?.targets[caseId])return;
  const key=autoFeedbackDraftKey(job,caseId);
  if(!read(key)&&!autoFeedbackImageDrafts.has(key))return;
  clearTimeout(autoFeedbackSaveTimers.get(key));
  if(autoFeedbackStale.has(job)){
    autoFeedbackSaveTimers.delete(key);
    autoFeedbackSaveStatus(caseId,autoFeedbackRefreshMessage);
    return;
  }
  autoFeedbackSaveStatus(caseId,'有修改待自动保存');
  autoFeedbackSaveTimers.set(key,setTimeout(()=>{
    autoFeedbackSaveTimers.delete(key);
    void autoSaveFeedbackDraft(job,caseId);
  },delay));
}

function autoRestoreFeedbackDrafts(job) {
  for(const caseId of Object.keys(job?.feedback?.targets||{}))autoScheduleFeedbackSave(job,caseId,0);
}

async function autoSaveFeedbackDraft(job,caseId) {
  if(autoState.job!==job||autoState.role!=='designer')return;
  if(autoFeedbackStale.has(job)){
    autoFeedbackSaveStatus(caseId,autoFeedbackRefreshMessage);
    return;
  }
  const key=autoFeedbackDraftKey(job,caseId);
  if(autoFeedbackSaving.has(key))return;
  const draft=read(key), imageDraft=autoFeedbackImageDrafts.get(key);
  if(!draft&&!imageDraft)return;
  const existing=job.feedback.records[caseId];
  const {recommendation_agrees=null,recommendation_reason='',preferred_models=[],observations=''}=draft||existing||{};
  const values={recommendation_agrees,
    recommendation_reason:recommendation_agrees===false?recommendation_reason.trim():'',
    preferred_models:recommendation_agrees===false?preferred_models:[],observations:observations.trim(),
    images:autoFeedbackImages(job,caseId)};
  if(recommendation_agrees===false&&(!values.preferred_models.length||!values.recommendation_reason)){
    autoFeedbackSaveStatus(caseId,'选择最佳模型并填写理由后会自动保存');
    return;
  }
  if(recommendation_agrees===null&&!values.observations&&!values.images.length&&!existing){
    saved(key,null);
    autoFeedbackImageDrafts.delete(key);
    autoFeedbackSaveStatus(caseId,'待核对');
    return;
  }
  const snapshot=JSON.stringify(draft);
  autoFeedbackSaving.add(key);
  autoFeedbackSaveStatus(caseId,'正在自动保存…');
  try {await autoFeedbackSave(job,caseId,values,snapshot,imageDraft);}
  catch(e) {
    const stale=e.status>=400&&e.status<500&&['feedback_version_changed','feedback_changed'].includes(e.code);
    if(stale)autoFeedbackStale.add(job);
    if(autoState.job===job)autoFeedbackSaveStatus(caseId,stale?autoFeedbackRefreshMessage:'暂未保存，草稿仍在当前浏览器',!stale);
  }
  finally {
    autoFeedbackSaving.delete(key);
    if(!autoFeedbackStale.has(job)&&((read(key)&&JSON.stringify(read(key))!==snapshot)||
       (autoFeedbackImageDrafts.has(key)&&autoFeedbackImageDrafts.get(key)!==imageDraft))){
      autoScheduleFeedbackSave(job,caseId);
    }
  }
}

async function autoFeedbackSave(job,caseId,values,draft,imageDraft) {
  const version=job.feedback.version;
  const path=job.feedback_reviewer?`/api/shared-feedback/${route(caseId)}`:AUTO_API+'/'+route(job.id)+'/feedback/'+route(caseId);
  const key=autoFeedbackDraftKey(job,caseId);
  const work=autoState.feedbackQueue.then(()=>api(path,{version,...values,autosave:true}));
  autoState.feedbackQueue=work.catch(()=>{});
  const feedback=await work;
  const draftUnchanged=JSON.stringify(read(key))===draft&&autoFeedbackImageDrafts.get(key)===imageDraft;
  if(draftUnchanged)saved(key,null);
  if(autoFeedbackImageDrafts.get(key)===imageDraft)autoFeedbackImageDrafts.delete(key);
  if(autoState.job!==job)return;
  const justFinished=job.feedback.reviewed<feedback.total&&feedback.reviewed===feedback.total;
  job.feedback=feedback;
  const page=autoCasePages().find(item=>item.dataset.autoCasePage===caseId);
  if(page){
    page.dataset.reviewed=String(feedback.records[caseId]?.recommendation_agrees!=null||!feedback.targets[caseId].leaders.length);
    const badge=page.querySelector('[data-auto-feedback-label]');
    if(badge)badge.textContent=autoFeedbackLabel(caseId);
    if(!page.hidden&&draftUnchanged)autoFeedbackSaveStatus(caseId,feedback.records[caseId]?'已保存':'待核对');
  }
  const summary=$('auto-result').querySelector('[data-auto-feedback-summary]');
  if(summary)summary.outerHTML=autoFeedbackSummary();
  const progress=$('auto-feedback-body')?.querySelector('[data-feedback-save-progress]');
  if(progress)progress.textContent=`已保存 ${feedback.reviewed}/${feedback.total} 条 · 修改会自动保存`;
  if(job.feedback_refinement?.available){
    const ready=feedback.reviewed===feedback.total;
    const shortcut=$('auto-feedback-body')?.querySelector('[data-feedback-summary-shortcut]');
    if(shortcut)shortcut.hidden=!ready;
    autoRenderRefinement();
    if(!ready)return;
    if(justFinished&&!document.activeElement?.closest('.auto-feedback-form'))autoShowFeedbackRefinement();
    try {await autoRefreshRefinement(job);}
    catch {notice('反馈已保存，暂时无法读取总结状态。','error');return;}
  }
}

function autoDiagnosisContent(answers=[]) {
  if(!answers.length)return '';
  const labels={already_covered:'原报告已判出',clarify:'待确认反馈指向',audio_review:'交给音画复核',
    local:'调整指定用例',scene:'调整有共性的用例'};
  const cases=autoState.job?.result?.report?.comparison?.cases||[];
  const caseName=id=>cases.find(row=>row.id===id)?.name||id;
  return `<details class="block" open><summary>系统为什么这样处理</summary><ol>${answers.map(row=>
    `<li><strong>${autoText(labels[row.decision])}</strong> · ${autoText(row.observed_issue)}
      <p>原判定 ${autoText(row.original_judgment)}</p>
      <p>共性检查 ${autoText(row.commonality)}</p>
      ${row.case_ids.length?`<p>改动范围 ${autoText(row.case_ids.map(caseName).join('、'))}${row.shot?` · 第 ${row.shot} 镜`:''}
        ${row.axis?` · ${autoText(autoShotMetricNames[row.axis]||row.axis)}`:''}</p>`:''}
      <p>${autoText(row.reason)}</p>
      ${row.evidence_ids.length?`<small>原判定记录 ${autoText(row.evidence_ids.join('、'))}</small>`:''}</li>`).join('')}</ol></details>`;
}

function autoRefinementContent() {
  const job=autoState.job;
  const state=job?.feedback_refinement;
  if(!state?.available||job.feedback.reviewed!==job.feedback.total)return '';
  const writable=autoState.role==='designer';
  const latest=state.history.at(-1);
  const shared=Boolean(job.feedback_reviewer);
  const summary=state.history.findLast(step=>step.action==='summarize'&&step.status==='completed');
  const problems=summary?.result.summary.problems;
  const version=latest?.result?.version;
  const caseName=id=>job.result.report.comparison.cases.find(row=>row.id===id)?.name.split(' · ')[0]||id;
  const button=(action,name,primary=false)=>`<button type="button" class="btn small${primary?' primary':''}"
    data-action="auto-refinement-${action}">${name}</button>`;
  const isPending=['queued','running'].includes(latest?.status);
  const status=!latest?'所有用例已反馈，可以汇总这轮发现的问题。':
    isPending?(latest.action==='optimize'?'正在按已确认的问题生成提示词新版本…':
      latest.action==='confirm'?'正在保存你确认的问题清单…':'正在整理这轮问题清单…'):
    ['failed','interrupted'].includes(latest.status)?autoText(latest.error?.message||'这一轮处理失败。'):
    latest.action==='summarize'?'请核对这份问题清单，可以补充或纠正。':
    latest.action==='confirm'?'总结已确认，维护员可在这份报告中查看。':
    version?`新评测版本 <strong>${autoText(version.name)}</strong> 已保存。`:'已确认，本轮没有能落实到现有提示词的改动。';
  const instructions=version?.changes.instructions||[];
  const questions=version?.changes.questions||[];
  const axisName=axis=>autoShotMetricNames[axis]||axis;
  const details=version?`<details><summary>查看提示词改动</summary><ul>${instructions.map(row=>
    `<li><b>${autoText(axisName(row.axis))} · 系统提示词</b> ${autoText(row.text)} <small>对应问题 ${row.problems.join('、')}</small></li>`).join('')}${questions.map(row=>
    `<li><b>${autoText(caseName(row.case_id))} · 第 ${row.shot} 镜 · ${autoText(axisName(row.axis))} · ${row.question_id?'改写题目':'新增题目'}</b> ${autoText(row.text)} <small>对应问题 ${row.problems.join('、')}</small></li>`).join('')}</ul></details>`:'';
  const past=state.history.filter(step=>step.supplement&&step.status==='completed');
  return `<h4>本轮反馈汇总 <small>${autoText(state.model)}</small></h4><p class="dim" aria-live="polite">${status}</p>
    ${problems?`<ol>${problems.map(row=>`<li>${autoText(row.text)}${row.case_ids.length?` <small>${autoText(row.case_ids.map(caseName).join('、'))}</small>`:''}</li>`).join('')}</ol>`:''}
    ${problems&&!problems.length?'<p>这轮反馈没有指出具体问题。</p>':''}
    ${past.length?`<details><summary>查看补充记录</summary><ul>${past.map(step=>`<li>${autoText(step.supplement)}</li>`).join('')}</ul></details>`:''}
    ${autoDiagnosisContent(latest?.result?.diagnosis)}
    ${details}
    ${!latest&&writable?button('start','生成问题清单',true):''}
    ${latest&&['failed','interrupted'].includes(latest.status)&&writable?button('retry','重试这一轮'):''}
    ${latest?.action==='summarize'&&latest.status==='completed'&&writable?`<form class="auto-refinement-form">
      <label>补充或纠正<textarea name="supplement" rows="2" maxlength="4000" required></textarea></label>
      <button type="submit" class="btn small">提交补充</button>${button('confirm',shared?'确认总结':'确认问题并生成新版本',true)}</form>`:''}
    ${version&&!state.run&&writable?`<p>要用这个版本重新评测原来的用例吗？</p>${button('rerun','确定用新版本重跑',true)}`:''}
    ${state.run?button('open-run',state.run.status==='completed'?'查看新评测报告':'查看重新评测进度',true):''}`;
}

function autoRenderRefinement() {
  const panel=document.querySelector('[data-auto-feedback-refinement]');
  if(!panel)return;
  const content=autoRefinementContent();
  panel.hidden=!content;
  panel.innerHTML=content;
}

function autoShowFeedbackRefinement() {
  const panel=document.querySelector('[data-auto-feedback-refinement]:not([hidden])');
  if(!panel)return;
  $('auto-feedback-dock')?.classList.remove('is-open');
  $('auto-feedback-toggle')?.setAttribute('aria-expanded','false');
  panel.scrollIntoView({block:'start'});
  panel.focus({preventScroll:true});
}

async function autoRefreshRefinement(job, body) {
  const path=job.feedback_reviewer?'/api/shared-feedback-refinement':`${AUTO_API}/${route(job.id)}/feedback-refinement`;
  const result=await api(path,body);
  if(autoState.job!==job)return;
  if(JSON.stringify(job.feedback_refinement)===JSON.stringify(result))return;
  job.feedback_refinement=result;
  autoRenderRefinement();
  return result;
}

async function autoRefinementAction(action, supplement) {
  const job=autoState.job;
  if(action==='open-run')return autoOpen(job.feedback_refinement.run.id);
  if(action==='confirm'&&document.querySelector('.auto-refinement-form textarea')?.value.trim()){
    throw new Error('请先提交已填写的补充，再确认更新后的问题清单。');
  }
  const parent=job.feedback_refinement.history.at(-1)?.id;
  const body=action==='start'?{action}:{action,parent,...(supplement?{supplement}:{})};
  const refreshed=await autoRefreshRefinement(job,body);
  if(action==='rerun'&&refreshed?.run){await autoOpen(refreshed.run.id);await autoList();}
}

const autoRadarLabel=metric=>autoMetricLabels[metric.id]||metric.name;
const autoRadarScore=value=>Number.isFinite(value)?value.toFixed(2):'待确认';
const autoRadarKey=(scope,model)=>scope+':'+model;

function autoRadarMetrics(comparison,caseRow) {
  if(!caseRow)return comparison.metrics.filter(metric=>metric.case_count>0);
  return comparison.metrics.flatMap(metric=>{
    const scores=caseRow.metric_scores?.[metric.id];
    return scores?[{...metric,scores}]:[];
  });
}

function autoRadarPanel(models,metrics,scores,scope) {
  if(!metrics.length)return '';
  const overall=scope==='overall';
  const raw=!overall||metrics.length<3?autoTable(['模型',...metrics.map(autoRadarLabel)],
    models.map(model=>[autoText(autoShortModel(model.name)),...metrics.map(metric=>autoRadarScore(metric.scores[model.id]))])):'';
  if(metrics.length<3)return raw;
  const keys=models.map((model,index)=>`<button type="button" class="auto-radar-key" data-action="auto-radar-model"
    data-id="${autoText(model.id)}" data-scope="${autoText(scope)}"
    aria-pressed="${!autoState.radarHidden.has(autoRadarKey(scope,model.id))}">
    <i data-radar-color="${index%autoRadarColors.length}" aria-hidden="true"></i>
    ${autoText(autoShortModel(model.name))} <b>${autoRadarScore(scores[model.id])}</b></button>`).join('');
  return `<div class="auto-radar-panel${overall?'':' auto-case-radar'}">
    <canvas ${overall?'id="auto-radar" ':''}data-auto-radar="${autoText(scope)}" role="img"
      aria-label="${overall?'按各维度最低分和最高分归一化的模型对比雷达图':'本用例各项得分雷达图'}"></canvas>
    <div class="auto-radar-legend">${keys}</div>
    ${overall?'<small>各维度最低分在中圈、最高分在外圈。同分按 0–10 分刻度绘制。图例显示整批均分。</small>':
      `<details class="auto-report-source"><summary>查看本用例原始分</summary>${raw}</details>`}
  </div>`;
}

function autoRecommendationPair(cases,winner,other,axis,skip) {
  const contenders=cases.filter(item=>item.id!==skip&&item.leaders.includes(winner)
    &&item.metric_scores?.[axis]?.[winner]>item.metric_scores[axis][other]);
  const gap=item=>item.metric_scores[axis][winner]-item.metric_scores[axis][other];
  contenders.sort((a,b)=>gap(b)-gap(a));
  for(const item of contenders){
    const input=autoState.job?.review_inputs?.[item.id];
    for(const [index,shot] of Object.entries(input?.native_shots?.[winner]||{})){
      const opposing=input.native_shots[other]?.[index];
      const question=Object.values(shot.items||{}).find(check=>{
        const rival=opposing?.items?.[check.id];
        return check.axis===axis&&check.status==='pass'&&rival?.axis===axis&&rival.status==='fail'
          &&check.evidence?.length&&rival.evidence?.length;
      });
      if(question)return {item,shotIndex:Number(index),winner,other,checks:[question,opposing.items[question.id]]};
    }
  }
  return null;
}

function autoRecommendationExample(example,labels,framesPerModel) {
  if(!example)return '';
  const {item,shotIndex,winner,other,checks}=example;
  const input=autoState.job?.review_inputs?.[item.id];
  const title=item.name.split(' · ')[0];
  const shot=input?.script_shots?.find(row=>row.index===shotIndex);
  const buttonAttrs=`data-action="auto-recommendation-example" data-case-id="${autoText(item.id)}" data-shot-index="${shotIndex}"`;
  const lightboxGroup='media-'+(++lightboxSerial);
  const evidence=[winner,other].map((id,index)=>{
    const check=checks[index];
    const frames=check.evidence.slice().sort((a,b)=>a.actual_time_ms-b.actual_time_ms);
    const points=framesPerModel===2&&frames.length>1?[frames[0],frames.at(-1)]:frames.slice(0,1);
    const hasVideo=stepMediaURL(item.entries.find(row=>row.model_id===id)?.video);
    const cut=input.shots?.[id]?.find(row=>row.index===input.shot_mapping?.[id]?.[shotIndex]);
    const strip=points.map(point=>{
      const image=stepMediaURL(point.asset),time=point.actual_time_ms;
      const stamp=timeText(time),caption=labels[id]+' · '+stamp;
      const end=cut?.end_ms>time?Math.min(time+2200,cut.end_ms):time+1200;
      return `<div>
        ${image?`<a href="${autoText(image)}" data-lightbox="${lightboxGroup}" data-caption="${autoText(caption)}"
          aria-label="${autoText('放大 '+caption)}"><img src="${autoText(image)}" loading="lazy" alt="${autoText(caption)}"></a>`:''}
        ${hasVideo&&Number.isFinite(time)?`<button type="button" class="auto-case-time" ${buttonAttrs}
          data-model="${autoText(id)}" data-time="${time}" data-end-time="${end}"
          aria-label="${autoText('播放 '+caption)}">${autoText(stamp)}</button>`:''}
      </div>`;
    }).join('');
    const reason=check.reason.replace(/^违反[^。；：]{1,32}：/,'')
      .replace(/^frame-\d+(?:\s*(?:至|到|~|–)\s*frame-\d+)?\s*(?:中|里)?[，、]?\s*/i,'')
      .replace(/\bcord\s*\/\s*hose\b/gi,'电线/软管')
      .replace(/，(?:属于原文明确禁止出现的 cord|未触犯其[他它]原文禁令)(?=。?$)/,'');
    return `<figure><div class="auto-recommendation-strip">${strip}</div>
      <figcaption><b>${autoText(labels[id])}</b> · ${autoText(reason)}</figcaption></figure>`;
  }).join('');
  return `<div class="auto-recommendation-example">
    <div class="auto-recommendation-frames">${evidence}</div>
    <button type="button" class="auto-case-time" ${buttonAttrs}>回看 ${autoText(title)}${shot?.title?' · '+autoText(shot.title):''}</button>
  </div>`;
}

function autoReportOpening(report,labels,outcome,allCompared) {
  const {leaders,case_wins:wins,metrics,cases,ranked_case_count:ranked}=report.comparison;
  if(!wins||!leaders.length)return `<p class="auto-opening-summary">${outcome}</p>`;
  const name=id=>autoText(labels[id]);
  const names=ids=>ids.map(name).join('、');
  const winner=leaders[0],count=wins[winner].total;
  const others=Object.keys(wins).filter(id=>!leaders.includes(id));
  const runnerCount=Math.max(0,...others.map(id=>wins[id].total));
  const runners=others.filter(id=>wins[id].total===runnerCount);
  const take=leaders.length>1?`<strong>${allCompared?'并列推荐':'暂并列推荐'} ${names(leaders)}。</strong> 各有 ${count} 条排在第一或并列第一。`:
    `<strong>这批可以先用 ${name(winner)}。</strong> ${ranked} 条${ranked===report.matched_case_count?'':'已排名的'}测试里，它有 ${count} 条排在第一或并列第一${runners.length?`，${names(runners)} ${runners.length>1?'各有':'有'} ${runnerCount} 条`:''}。`;
  const metricsCompared=leaders.length===1?metrics.flatMap(metric=>{
    const score=metric.scores[winner];
    const other=others.filter(id=>Number.isFinite(metric.scores[id])).sort((a,b)=>metric.scores[b]-metric.scores[a])[0];
    return other&&Number.isFinite(score)&&metric.case_count?[{metric,other,score,gap:score-metric.scores[other]}]:[];
  }).sort((a,b)=>b.gap-a.gap):[];
  const strength=metricsCompared.find(row=>row.gap>0);
  const tradeoff=metricsCompared.findLast(row=>row.gap<0);
  const axisTitle={task_completion:'脚本里的动作做得更完整',physical_compliance:'更符合动作常识和脚本禁令'};
  const axisName={task_completion:'任务完成度',physical_compliance:'物理与禁令检查'};
  const metricName=metric=>autoText(axisName[metric.id]||autoRadarLabel(metric));
  const summary=take+(runners.length&&count-runnerCount===1?'领先幅度只有一条。':'')
    +(tradeoff?` ${metricName(tradeoff.metric)}这项，${name(tradeoff.other)} 的分更高（${autoRadarScore(tradeoff.metric.scores[tradeoff.other])} 对 ${autoRadarScore(tradeoff.score)}）。`:'');
  if(!strength)return `<p class="auto-opening-summary">${summary}</p>`;
  const first=autoRecommendationPair(cases,winner,strength.other,strength.metric.id);
  const visual=cases.filter(item=>item.leaders.length===1&&item.leaders[0]===winner&&item.id!==first?.item.id
    &&item.advantages[0]?.id==='physical_compliance'&&item.decisive_example).sort((a,b)=>b.advantages[0].gap-a.advantages[0].gap)[0];
  const second=visual&&strength.metric.id!=='physical_compliance'
    ?autoRecommendationPair([visual],winner,visual.decisive_example.model_id,'physical_compliance'):null;
  const axis=strength.metric;
  const headline=axisTitle[axis.id]||`${metricName(axis)}得分最高`;
  const detail=`看同样的 ${axis.case_count} 条测试，${name(winner)} 的${metricName(axis)}平均 ${autoRadarScore(strength.score)} 分，${name(strength.other)} 平均 ${autoRadarScore(axis.scores[strength.other])} 分。`;
  const exampleTitle=example=>autoText(autoState.job?.review_inputs?.[example.item.id]?.script_shots?.find(row=>row.index===example.shotIndex)?.title||`第 ${example.shotIndex} 镜`);
  return `<p class="auto-opening-summary">${summary}</p>
    <section class="auto-recommendation" aria-labelledby="auto-recommendation-title">
      <h3 id="auto-recommendation-title">推荐理由</h3>
      <div class="auto-recommendation-row"><div>
        <h4>${headline}</h4><p>${detail}</p>
        ${first?`<p>${autoText(first.item.name.split(' · ')[0])} · ${exampleTitle(first)}</p>`:''}
      </div>${autoRecommendationExample(first,labels,2)}</div>
      ${second?`<div class="auto-recommendation-row"><div>
        <h4>同一镜里，脚本禁令执行得更好</h4>
        <p>${autoText(second.item.name.split(' · ')[0])} · ${exampleTitle(second)}。</p>
      </div>${autoRecommendationExample(second,labels,1)}</div>`:''}
    </section>`;
}

const deliveryNames={ready:'画面通过',rework:'要返工',blocked:'无法交付',review:'待复核',missing:'未提供成片'};

function autoDeliveryIssue(issue,labels,cases) {
  const {example,model_id:model}=issue;
  const id=example.case_id;
  const title=cases.find(row=>row.id===id)?.name.split(' · ')[0]||id;
  const input=autoState.job?.review_inputs?.[id];
  const index=example.shot_index;
  const shot=input?.script_shots?.find(row=>row.index===index);
  const cut=input?.shots?.[model]?.find(row=>row.index===input.shot_mapping?.[model]?.[index]);
  const attrs=`data-action="auto-recommendation-example" data-case-id="${autoText(id)}" data-shot-index="${index}"`;
  const group='media-'+(++lightboxSerial);
  const frames=example.frames.map(point=>{
    const url=stepMediaURL(point.asset),time=point.actual_time_ms;
    const end=cut?.end_ms>time?Math.min(time+2200,cut.end_ms):time+1200;
    const label=timeText(time);
    return `<figure>${url?`<a href="${autoText(url)}" data-lightbox="${group}" data-caption="${autoText(label)}">
      <img src="${autoText(url)}" loading="lazy" alt="${autoText(`${title} ${labels[model]} ${label}`)}"></a>`:''}
      <figcaption><button type="button" class="auto-case-time" ${attrs} data-model="${autoText(model)}"
        data-time="${time}" data-end-time="${end}">${autoText(label)}</button></figcaption></figure>`;
  }).join('');
  const scenes=Object.entries(issue.scenes).map(([scene,count])=>`${scene} ${count} 条`).join('、');
  const reason=example.reason.replace(/\bframe-(\d+)\b/gi,'第 $1 张抽帧');
  return `<article class="auto-delivery-issue">
    <div><h4>${autoText(labels[model])} · ${autoText(issue.topic)}</h4>
      <p class="auto-delivery-note">${issue.count} 条有此类问题 · ${autoText(scenes)}</p>
      <p>${autoText(reason)}</p>
      <button type="button" class="auto-case-time" ${attrs}>回看 ${autoText(title)}${shot?.title?' · '+autoText(shot.title):''}</button>
    </div>${frames?`<div class="auto-delivery-frames">${frames}</div>`:''}
  </article>`;
}

function autoDeliveryOpening(report,labels,cases) {
  const {delivery,comparison}=report;
  const models=Object.keys(delivery.counts);
  const names=ids=>autoText(ids.map(id=>labels[id]).join('、'));
  const wins=comparison.case_wins;
  const leaders=comparison.leaders||[];
  const pick=wins&&leaders.length===1&&comparison.ranked_case_count===delivery.case_count?leaders[0]:null;
  const total=delivery.case_count;
  const action=comparison.metrics.find(metric=>metric.id==='task_completion'&&metric.case_count===total);
  const bestAction=action&&pick&&models.every(id=>Number.isFinite(action.scores[id])&&
    (id===pick||action.scores[pick]>action.scores[id]));
  const summary=pick?`这批片子优先试 ${names([pick])}。`:'这批片子还挑不出唯一的首选。';
  const runners=pick?models.filter(id=>id!==pick).sort((a,b)=>wins[b].total-wins[a].total):[];
  const nearest=runners.filter(id=>wins[id].total===wins[runners[0]].total);
  const comparisonText=pick?`同样的 ${total} 条脚本，${names([pick])} 有 ${wins[pick].total} 条排第一，其中 ${wins[pick].tied} 条是并列。${nearest.length?`${names(nearest)}${nearest.length>1?'各':''}有 ${wins[nearest[0]].total} 条排第一。`:''}`:
    `这次有 ${comparison.ranked_case_count??0} 条能排出名次，共测了 ${total} 条。`;
  const records=Object.values(report.person_realism_cases||{});
  const reasons=models.map(id=>{
    const issues=delivery.issues.filter(issue=>issue.model_id===id);
    const weak=records.filter(row=>row.consensus?.overall?.status==='stable'&&row.consensus.overall.weakest.includes(id));
    const examples=weak.flatMap(row=>{
      const frame=row.evidence?.find(point=>point.model_id===id&&point.reason&&point.dimension==='skin');
      return frame?[{...frame,case_id:row.case_id}]:[];
    });
    const issue=issues.find(item=>item.topic==='脚本中的动作或结果没做到');
    const paragraphs=[];
    if(weak.length>=2){
      paragraphs.push(`有 ${weak.length} 条，两轮对比都把它的人物排在最不像实拍的一档。`);
      if(examples.length){
        const frame=examples[0], name=cases.find(item=>item.id===frame.case_id)?.name.split(' · ')[0]||frame.case_id;
        const url=stepMediaURL(frame.asset);
        paragraphs.push(`例如 ${autoText(name)}，${autoText(frame.reason)} ${url?`<a href="${autoText(url)}" data-lightbox="realism-${++lightboxSerial}" data-caption="${autoText(name)}">看 ${autoText(timeText(frame.time_ms))} 的画面</a>`:''}`);
      }
    }
    if(issue)paragraphs.push(`${total} 条里有 ${issue.count} 条漏了脚本要求的动作，或没拍出要求的结果。`);
    if(!paragraphs.length)paragraphs.push('已有记录还说不清它反复在哪里出错。');
    // 频次属于整个问题类别，具体画面只作单条例子。
    const example=weak.length>=2?null:issues.find(item=>item.topic==='物理异常、跳变或画面崩坏'&&item.count>=2)||issue;
    if(example){
      if(example!==issue)paragraphs.push(`画面上，有 ${example.count} 条出现了画面跳变或物体变形。`);
      const row=example.example;
      const title=cases.find(item=>item.id===row.case_id)?.name.split(' · ')[0]||row.case_id;
      const clip=row.frames[0];
      paragraphs.push(`例如 ${autoText(title)}，${autoText(row.reason.split(/[；;]/,1)[0].replace(/frame-(\d+)/gi,'第$1帧').replace(/[。.]?$/,'。'))}
        <button type="button" class="auto-case-time" data-action="auto-recommendation-example" data-case-id="${autoText(row.case_id)}"
        data-shot-index="${row.shot_index}" data-model="${autoText(id)}"${clip?` data-time="${clip.actual_time_ms}" data-end-time="${clip.actual_time_ms+1500}"`:''}>回看这段</button>`);
    }
    return `<article class="auto-delivery-issue auto-model-story"><div><h4>${names([id])}</h4><p>${paragraphs.join(' ')}</p></div></article>`;
  });
  const statusKeys=Object.keys(deliveryNames);
  const totals=autoTable(['模型',...Object.values(deliveryNames)],models.map(id=>[
    names([id]),...statusKeys.map(key=>delivery.counts[id][key]),
  ]));
  const byScene=autoTable(['场景',...models.map(id=>labels[id]),'怎么选'],delivery.scenes.map(scene=>[
    `${autoText(scene.name)} · ${scene.case_count} 条`,
    ...models.map(id=>`${scene.counts[id].ready}/${scene.case_count}`),
    scene.leaders.length===0?'这批还没有画面全过的成片':scene.leaders.length===1?`${names(scene.leaders)}通过最多`:'通过数并列',
  ]));
  const shown=new Set();
  const highlights=delivery.issues.filter(issue=>{
    if(shown.has(issue.model_id))return false;
    shown.add(issue.model_id);
    return true;
  });
  const more=delivery.issues.filter(issue=>!highlights.includes(issue));
  const renderIssue=issue=>autoDeliveryIssue(issue,labels,cases);
  return `<h3>这个任务选谁</h3><p class="auto-opening-summary"><strong>${summary}</strong>
    ${bestAction?`它照脚本做动作的得分最高（${autoRadarScore(action.scores[pick])}/10）。`:''}</p>
    <p>${comparisonText}</p>
    ${pick?`<p>真要直接用，${names([pick])} 的 ${total} 条里有 ${delivery.counts[pick].ready} 条通过了全部画面检查。台词还要另听。</p>`:''}
    <section class="auto-delivery-section"><h3>这几家分别用起来有什么差别</h3>${reasons.join('')}</section>
    <details class="auto-delivery-more"><summary>查看各场景的条数和扣分画面</summary>
    <section class="auto-delivery-section"><h3>成片一览</h3>${totals}</section>
    <section class="auto-delivery-section"><h3>不同场景怎么选</h3>
      <p class="auto-delivery-note">表里是通过画面检查的条数。样本少的场景只看本批表现。</p>${byScene}</section>
    ${highlights.length?`<section class="auto-delivery-section"><h3>最影响使用的问题</h3>
      ${highlights.map(renderIssue).join('')}
      ${more.length?`<details class="auto-delivery-more"><summary>查看各模型的其他问题</summary>${more.map(renderIssue).join('')}</details>`:''}
    </section>`:''}</details>`;
}

function autoProductCaseVerdict(rows,labels) {
  const ready=rows.filter(row=>row.status==='能用').map(row=>labels[row.model_id]);
  const title=ready.length?'可以直接用的有'+ready.join('、'):'这条用例没有能直接用的成片';
  return `<section class="auto-case-verdict auto-product-case"><h4>${autoText(title)}</h4>
    <ul>${rows.map(row=>`<li><strong>${autoText(labels[row.model_id])}</strong>
      <b class="${row.status==='能用'?'pass':'fail'}">${autoText(row.status)}</b>
      <p>${autoText(row.reason)}</p></li>`).join('')}</ul></section>`;
}

function autoReportOverview(report) {
  const comparison=report.comparison;
  const shotBased=report.schema_version==='video-evaluation-report/2';
  const labels=Object.fromEntries(report.models.map(model=>[model.id,autoShortModel(model.name)]));
  const graded=autoRadarMetrics(comparison);
  const format=autoRadarScore;
  const names=ids=>autoText(ids.map(id=>labels[id]).join('、'));
  const best=comparison.leaders;
  const singleTask=graded.length===1&&comparison.metrics.length===1&&graded[0].id==='task_completion';
  const allCompared=comparison.metrics.every(metric=>metric.case_count===report.matched_case_count)&&
    (!singleTask||comparison.cases.every(item=>item.task_checks?.total===item.task_checks?.comparable))&&
    (!shotBased||comparison.cases.every(item=>Object.values(item.shot_coverage||{}).every(axis=>axis.applicable===axis.scored)));
  const winner=best.length===1?(allCompared?'排名第一':'暂列第一'):(allCompared?'并列第一':'暂并列第一');
  const counts=comparison.case_wins;
  const outcome=!best.length?'目前没有足够的共同检查可用来排出名次。':counts?
    `在 ${comparison.ranked_case_count} 条已排名用例中，<strong>${names(best)} ${winner}</strong>，${best.length>1?'各获':'共获'} ${counts[best[0]].total} 次第一。`:
    `${names(best)}的整批综合均分最高（${format(comparison.scores[best[0]])} 分）。`;
  const ranking=counts?autoTable(['模型','第一次数','单独第一','并列第一'],
    [...report.models].sort((a,b)=>counts[b.id].total-counts[a.id].total).map(({id})=>[
      autoText(labels[id]),counts[id].total,counts[id].outright,counts[id].tied,
    ])):'';
  const table=autoTable(['模型',...comparison.metrics.map(autoRadarLabel)],
    report.models.map(model=>[autoText(labels[model.id]),...comparison.metrics.map(metric=>
      `<b>${format(metric.scores[model.id])}</b><small>${metric.case_count? `比了 ${metric.case_count} 条测试`:'待复核'} </small>`)]));
  const modelSuffix=new RegExp(` · (?:${Object.values(labels).map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})$`);
  const delivery=report.delivery;
  const cases=comparison.cases.map(item=>{
    const heading=item.name.replace(modelSuffix,'');
    const task=item.task_checks;
    const complete=item.metric_count===comparison.metrics.length&&(!singleTask||!task||task.comparable===task.total)&&
      (!shotBased||Object.values(item.shot_coverage).every(axis=>axis.applicable===axis.scored));
    const checks=task?(task.total===task.comparable?`各组都完成了同样的 ${task.total} 项画面检查。`:
      `关键任务共 ${task.total} 项画面检查，各组都能判断的有 ${task.comparable} 项。`):'';
    const shotChecks=shotBased?Object.entries(item.shot_coverage).filter(([,row])=>row.applicable)
      .map(([id,row])=>`${autoText(autoShotMetricNames[id]||id)} ${row.scored}/${row.applicable} 镜`).join(' · '):'';
    const verdict=item.leaders.length===0?'等待复核':
      item.leaders.length===1?`${names(item.leaders)} ${complete?'表现最好':'暂列第一'}`:`${names(item.leaders)} 并列`;
    const reason=item.realism_ranking?'已结合人物真实感调整推荐。':item.advantages.length?`比最接近的对手，${item.advantages.map(row=>`${autoText(row.name)}高 ${format(row.gap)} 分`).join('，')}。`:
      item.leaders.length>1?'各项平均后，领先组同分。':
        item.leaders.length===1?'各项平均后，这组得分最高。':'';
    const hasCritical=item.critical_counts&&Object.values(item.critical_counts).some(Boolean);
    const severe=item.severe_visual_counts;
    const severeLine=severe?`<p><strong>优先扣分的严重画面问题</strong> · ${item.entries.map(entry=>
      `${autoText(labels[entry.model_id])} ${severe[entry.model_id]} 镜`).join('、')}</p>`:'';
    const critical=hasCritical?`<p>${severe?'其他主要问题':'先比较已确认的主要问题'} · ${item.entries.map(entry=>
      `${autoText(labels[entry.model_id])} ${item.critical_counts[entry.model_id]} 项`).join('、')}</p>`:'';
    const example=severe?item.severe_visual_example:hasCritical?item.critical_example:item.decisive_example;
    const exampleShot=example&&autoState.job?.review_inputs?.[item.id]?.script_shots?.find(shot=>shot.index===example.shot_index);
    const exampleText=example?'<p>'+autoText((exampleShot?.title?exampleShot.title+' · ':'')+labels[example.model_id]+'的扣分原因是'+example.reason)+'</p>':'';
    const videos=item.entries.map(entry=>({id:entry.model_id,name:labels[entry.model_id],video:entry.video}));
    const radar=autoRadarPanel(report.models,autoRadarMetrics(comparison,item),
      Object.fromEntries(item.entries.map(entry=>[entry.model_id,entry.score])),item.id);
    const realism=report.person_realism_cases?.[item.id]||(report.person_realism?.case_id===item.id?report.person_realism:null);
    const deliveryRows=delivery?.cases.filter(row=>row.case_id===item.id);
    const reviewed=autoState.job?.product_case_decisions?.[item.id];
    return {id:item.id,heading,body:`
      ${reviewed?autoProductCaseVerdict(reviewed,labels)+'<details class="auto-report-source"><summary>查看复审前的评分与排名</summary>':''}
      <section class="auto-case-verdict${radar?' has-radar':''}">
        <div><h4>${verdict}</h4>
          ${deliveryRows?.length?`<ul class="auto-case-delivery">${deliveryRows.map(row=>
            `<li>${autoText(labels[row.model_id])} · <b data-status="${autoText(row.status)}">${autoText(deliveryNames[row.status])}</b></li>`).join('')}</ul>`:''}
          ${severeLine}${severe?exampleText:''}
          ${(!(severe||hasCritical)&&reason)||checks||item.metric_count!==comparison.metrics.length?`<p>${severe||hasCritical?'':reason}${checks}${item.metric_count!==comparison.metrics.length?`已有 ${item.metric_count}/${comparison.metrics.length} 项指标可比较。`:''}</p>`:''}
          ${critical}${severe?'':exampleText}
          ${shotChecks?`<small>各组都能比较的镜头 · ${shotChecks}</small>`:''}
        </div>
        ${radar?`<div class="auto-case-scores"><h4>本用例各项得分</h4>${radar}</div>`:''}
      </section>
      ${realism?autoPersonRealism(realism,labels,item.realism_ranking):''}
      ${reviewed?'</details>':''}
      ${autoCaseInputs(item.id)}
      ${autoCaseVideos(item.id,videos)}`};
  });
  const supplement=report.supplement;
  const revised=Object.entries(report.recheck_shots||{}).map(([caseId,shots])=>{
    const name=cases.find(item=>item.id===caseId)?.heading||caseId;
    return name+' · '+shots.map(index=>'第 '+index+' 镜').join('、');
  });
  return `<article class="automatic-report auto-overview">
    <header class="auto-overview-head auto-reading-head">
      <p class="auto-report-scope"><span>${report.models.length} 组模型</span><span>同一批 ${report.matched_case_count} 条测试</span></p>
      <h2>${autoText(report.title)}</h2>
      ${window.STATIC_SNAPSHOT?.feedback_url?'<a class="btn small primary" data-auto-feedback-link target="_blank" rel="noopener noreferrer">填写本条反馈</a>':''}
      ${!autoState.job?.product_case_decisions&&!window.STATIC_SNAPSHOT?(autoState.job?.impact_versions||[]).map(v=>`<a class="btn small" href="/review-versions/${encodeURIComponent(v)}/${encodeURIComponent(autoState.job.id)}">成片复查${v.endsWith('-pair')?' · 指定视频':''}</a>`).join(''):''}
      ${!autoState.job?.product_case_decisions&&autoState.job?.impact_review&&!window.STATIC_SNAPSHOT?`<a class="btn small" href="/review-versions/impact-v2/${encodeURIComponent(autoState.job.id)}">看新版 · 这些片子能不能用</a>`:''}
      ${autoState.job?.pilot_preview?'<a class="btn small" href="/review-versions/V1" target="_blank" rel="noopener">查看 V1 输入预览</a>':''}
      ${!autoState.job?.product_case_decisions&&revised.length?`<p class="callout">本版复评 ${autoText(revised.join('；'))}。其余分镜沿用原报告。</p>`:''}
      ${autoState.job?.designer_opening || (delivery?autoDeliveryOpening(report,labels,comparison.cases):autoReportOpening(report,labels,outcome,allCompared))}
    </header>
    <section class="auto-case-list"><h3>${autoState.job?.product_case_decisions?'逐条用例分析':'逐条测试对比'}</h3>${autoFeedbackSummary()}
      <section class="auto-feedback-refinement" data-auto-feedback-refinement tabindex="-1" hidden></section>${autoCasePager(cases)}</section>
    <details class="auto-report-source auto-overall-results"><summary>${autoState.job?.product_case_decisions?'复审前的整批排名与评分':'整批排名与评分'}</summary>
      ${ranking?`<p>单独第一和并列第一各计 1 次。${comparison.ranked_case_count<report.matched_case_count?` 有 ${report.matched_case_count-comparison.ranked_case_count} 条用例暂未排名。`:''}</p>${ranking}`:''}
      ${autoRadarPanel(report.models,graded,comparison.scores,'overall')}
      ${shotBased&&report.shot_summary?`<p>${autoText(report.shot_summary)}</p>`:''}
      <p>各模型在每条用例上用同一批可判断的检查打分。表内每一列是该指标的用例均分。</p>
      ${table}
      ${supplement?`<p>补评使用 ${autoText(supplement.judge_model)}，有 ${supplement.case_metrics_adopted} 项测试指标采用了补评结果。</p>`:''}
    </details>
    <details class="auto-report-source"><summary>报告来源与下载</summary>
      <p>报告生成模型 ${autoText(report.report_model)}。${report.repair_from?` 补评沿用流程 ${autoText(report.repair_from)} 的有效结果。`:''}</p>${rawDownload(report,'下载报告数据')}
    </details>
  </article>`;
}

const autoRealismNames={overall:'综合',skin:'皮肤纹理',fabric:'衣料质感',lighting:'人物光影'};

function autoPersonRealism(review,names,ranking) {
  const describe=ids=>ids.map(id=>names[id]||id).join('、');
  const roundText=round=>`第 ${round.round} 轮 ${round.weakest.length?`${describe(round.weakest)}${round.weakest.length>1?'并列':''}末位`:'证据不足'}`;
  const states={stable:'两轮一致',tie:'两轮一致',single_round:'只完成一轮',disagreement:'换序后有分歧',unclear:'证据不足',failed:'未完成'};
  const overall=review.consensus.overall;
  const others=Object.keys(names).filter(id=>!overall.weakest.includes(id));
  const agrees=['stable','tie'].includes(overall.status);
  const confirmed=agrees&&overall.weakest.length>0&&others.length>0;
  const summary=confirmed?`<dl class="auto-realism-order">
    <div><dt>${others.length===1?'相对靠前':'相对靠前 · 未细排'}</dt><dd>${autoText(describe(others))}</dd></div>
    <div><dt>${overall.weakest.length>1?'并列末位':'末位'}</dt><dd>${autoText(describe(overall.weakest))}</dd></div>
  </dl>`:`<p><strong>${autoText(agrees?'未分出先后':states[overall.status])}</strong>${
    overall.status==='disagreement'?` · ${autoText(overall.rounds.map(roundText).join('；'))}`:''}</p>`;
  const descriptions=Object.entries(autoRealismNames).filter(([key])=>key!=='overall').map(([key,label])=>{
    const decision=review.consensus[key];
    const text=decision.weakest.length?`${describe(decision.weakest)}${decision.status==='tie'?'并列':''}末位`:
      decision.rounds.map(roundText).join(' · ');
    return `<li><b>${label}</b><span>${autoText(text||states[decision.status])}</span>
      ${text?`<small>${states[decision.status]}</small>`:''}</li>`;
  }).join('');
  const removed=ranking?.removed||[];
  const evidence=point=>{
    const timestamp=point.label_seconds+' 秒';
    const name=names[point.model_id]||point.model_id;
    return `<li><b>${autoText(name)} · ${autoRealismNames[point.dimension]}</b> ${autoVideoTime(point.model_id,point.time_ms,timestamp,point.time_ms+1200)}
      <span>${autoText(point.reason)}</span></li>`;
  };
  const priority=removed.flatMap(id=>{
    const points=review.evidence.filter(point=>point.model_id===id);
    const selected=['skin','fabric'].flatMap(key=>points.filter(point=>point.dimension===key).slice(0,1));
    return selected.length?selected:points.slice(0,1);
  });
  return `<section class="auto-realism" aria-label="人物真实感横评">
    <h4>人物真实感横评 <small>Opus 5.5</small></h4>
    ${summary}
    ${removed.length?`<aside class="auto-realism-alert"><b>建议复核 ${autoText(describe(removed))}</b>
      <p>原${ranking.original_leaders.length>1?'并列':''}第一，两轮真实感均为${overall.weakest.length>1?'并列':''}末位，已取消本用例第一资格。</p>
      ${priority.length?`<ul class="auto-realism-evidence">${priority.map(evidence).join('')}</ul>`:''}</aside>`:''}
    ${review.error?`<p class="error">${autoText(review.error.message)}</p>`:''}
    <details><summary>查看分项和原片证据</summary><ul class="auto-realism-axes">${descriptions}</ul>${review.rounds.map(round=>{
      const points=review.evidence.filter(point=>point.round===round.round);
      return `<section><h5>第 ${round.round} 轮 · ${round.status==='ok'?'已完成':'未完成'}</h5>
        ${round.result?`<p>${autoText(round.result.overall.reason)}</p>
          <ul class="auto-realism-evidence">${points.map(evidence).join('')}</ul>
          ${round.result.uncertainty?`<p class="dim">${autoText(round.result.uncertainty)}</p>`:''}`:''}</section>`;
    }).join('')}</details>
    ${autoState.role==='maintainer'?`<button type="button" class="btn small" data-action="auto-show-trace" data-id="${autoText(review.trace_id)}">查看正反两轮实际调用</button>`:''}
  </section>`;
}

function drawAutoRadar() {
  const report=autoState.job?.result?.report;
  if(!report?.comparison)return;
  for(const canvas of $('auto-result').querySelectorAll('canvas[data-auto-radar]')){
    if(!canvas.clientWidth)continue;
    const scope=canvas.dataset.autoRadar;
    const item=report.comparison.cases.find(row=>row.id===scope);
    paintAutoRadar(canvas,report.models,autoRadarMetrics(report.comparison,item),scope);
  }
}

function paintAutoRadar(canvas,models,metrics,scope) {
  // 隐藏模型时沿用图中所有模型的分数范围。
  const axes=metrics.map(metric=>{
    const scores=models.map(model=>metric.scores[model.id]);
    const min=Math.min(...scores), max=Math.max(...scores);
    return {...metric,min,max,span:max-min};
  });
  const width=canvas.clientWidth, height=canvas.clientHeight, scale=devicePixelRatio||1;
  canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
  const ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);
  const center=[width/2,height/2];
  const narrow=width<430;
  const radius=Math.min(width*(narrow ? .22 : .29),(height-66)/2,height*.34);
  const angles=axes.map((_,index)=>index/axes.length*Math.PI*2-Math.PI/2);
  const point=(index,dist)=>[center[0]+Math.cos(angles[index])*dist,center[1]+Math.sin(angles[index])*dist];
  const polygon=points=>{
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  };
  ctx.textBaseline='middle';
  for(const level of [.25,.5,.75,1]){
    ctx.strokeStyle=level===.5?'#806557':'#59443b';
    polygon(axes.map((_,i)=>point(i,radius*level)));
    ctx.stroke();
  }
  ctx.strokeStyle='#59443b';
  axes.forEach((axis,index)=>{
    ctx.beginPath();ctx.moveTo(...center);ctx.lineTo(...point(index,radius));ctx.stroke();
    const text=narrow&&axis.id==='physical_compliance'?'物理与禁令':autoRadarLabel(axis);
    const horizontal=Math.cos(angles[index]);
    const [x,y]=point(index,radius+17);
    const drawLabel=(label,dy)=>{
      const textWidth=ctx.measureText(label).width;
      const left=horizontal<-.35?x-textWidth:horizontal>.35?x:x-textWidth/2;
      ctx.fillText(label,Math.min(width-textWidth-3,Math.max(3,left)),y+dy);
    };
    ctx.font=`500 ${narrow?11:13}px system-ui`;
    ctx.textAlign='left';ctx.fillStyle='#e9dbcf';
    drawLabel(text,-5);
    ctx.font='11px system-ui';ctx.fillStyle='#bda99b';
    const range=axis.span?`${axis.min.toFixed(2)}–${axis.max.toFixed(2)} 分`:`同分 ${axis.min.toFixed(2)}`;
    drawLabel(range,11);
  });
  models.forEach((model,index)=>{
    if(autoState.radarHidden.has(autoRadarKey(scope,model.id)))return;
    const color=autoRadarColors[index%autoRadarColors.length];
    const points=axes.map((axis,i)=>{
      const fraction=axis.span
        ? .5+.5*(axis.scores[model.id]-axis.min)/axis.span
        : axis.min/10;
      return point(i,radius*fraction);
    });
    polygon(points);
    ctx.strokeStyle=color;ctx.fillStyle=color+'29';ctx.fill();ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=color;
    for(const [x,y] of points){ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
  });
}

function autoCasePager(cases) {
  const feedback=autoState.job?.feedback;
  const feedbackUrl=window.STATIC_SNAPSHOT?.feedback_url;
  return `<div class="auto-case-pager">
    <div class="auto-case-navigation" role="group" aria-label="切换测试用例" ${cases.length<2&&!feedbackUrl?'hidden':''}>
      <button class="btn small" type="button" data-action="auto-case-step" data-step="-1">‹ 上一条</button>
      <select data-auto-case-select aria-label="跳转到指定用例">${cases.map((item,i)=>
        `<option value="${autoText(item.id)}">${i+1} / ${cases.length} · ${autoText(item.heading)}</option>`).join('')}</select>
      <button class="btn small" type="button" data-action="auto-case-step" data-step="1">下一条 ›</button>
      ${feedbackUrl?'<a class="btn small primary" data-auto-feedback-link target="_blank" rel="noopener noreferrer">填写本条反馈</a>':''}
    </div>
    ${cases.map(item=>`<section class="auto-case auto-case-page" data-auto-case-page="${autoText(item.id)}" hidden
      ${feedback?.targets[item.id]?`data-auto-review-case="${autoText(item.id)}" data-reviewed="${feedback.records[item.id]?.recommendation_agrees!=null||!feedback.targets[item.id].leaders.length}"`:''}>
      <header class="auto-case-heading"><h3 tabindex="-1">${autoText(item.heading)}</h3>
        ${feedback?.targets[item.id]?`<span data-auto-feedback-label>${autoFeedbackLabel(item.id)}</span>`:''}</header>
      ${item.body}
    </section>`).join('')}
  </div>`;
}

function autoCasePages() {
  return [...$('auto-result').querySelectorAll('[data-auto-case-page]')];
}

const autoPlayRequests=new WeakMap();
function autoStopPlayback(page) {
  autoPlayRequests.get(page)?.abort();
  page.querySelectorAll('video').forEach(video=>video.pause());
}

function autoShowCase(id,focus=false) {
  const pages=autoCasePages();
  const index=Math.max(0,pages.findIndex(page=>page.dataset.autoCasePage===id));
  const current=pages[index];
  if(!current)return;
  const previous=pages.find(page=>!page.hidden);
  if(previous&&previous!==current)autoScheduleFeedbackSave(autoState.job,previous.dataset.autoCasePage,0);
  autoShotTooltip(null);
  autoCloseFinding();
  for(const page of pages){
    if(page!==current&&!page.hidden)autoStopPlayback(page);
    page.hidden=page!==current;
  }
  current.querySelectorAll('video[data-src]').forEach(video=>{
    if(!video.hasAttribute('src'))video.src=video.dataset.src;
  });
  const revisedShot=autoState.job.result?.report?.recheck_shots?.[current.dataset.autoCasePage]?.[0];
  const firstShot=(revisedShot&&current.querySelector(`[data-auto-shot-choice][data-shot-index="${revisedShot}"]`))
    ||current.querySelector('[data-auto-shot-choice]');
  if(firstShot&&!current.querySelector('[data-auto-shot-choice][aria-pressed="true"]'))autoSelectShot(current,firstShot);
  const pager=current.parentElement;
  pager.querySelector('[data-auto-case-select]').value=current.dataset.autoCasePage;
  for(const link of $('auto-result').querySelectorAll('[data-auto-feedback-link]')){
    link.href=window.STATIC_SNAPSHOT.feedback_url+'#case='+route(current.dataset.autoCasePage);
  }
  pager.querySelector('[data-step="-1"]').disabled=index===0;
  pager.querySelector('[data-step="1"]').disabled=index===pages.length-1;
  saved('automatic-case:'+autoState.job.id,current.dataset.autoCasePage);
  autoRenderFeedback(current);
  if(focus){
    requestAnimationFrame(drawAutoRadar);
    pager.scrollIntoView({block:'start'});
    current.querySelector('.auto-case-heading h3').focus({preventScroll:true});
  }
}

function autoCaseInputs(caseId) {
  const input=autoState.job?.review_inputs?.[caseId];
  if(!input)return '';
  const model=autoState.job.translation_model;
  ++lightboxSerial;
  const refs=input.references.map((image,i)=>mediaFigure(image,`参考图 ${i+1}`,'image')).join('');
  return `<section class="auto-case-inputs">
    <div><h4>输入提示词</h4>
      ${model?`<div class="auto-prompt-switch" role="group" aria-label="提示词语言">
        <button type="button" class="btn small" data-action="auto-prompt-original" aria-pressed="true">原文</button>
        <button type="button" class="btn small" data-action="auto-prompt-translate" aria-pressed="false"
          title="翻译模型 ${autoText(model)}">中文翻译</button>
      </div>`:''}
      <pre class="auto-input-prompt" data-auto-original>${autoText(input.instruction)}</pre>
      <pre class="auto-input-prompt" data-auto-translation hidden></pre>
      <small data-auto-translation-status aria-live="polite" hidden></small>
    </div>
    <div><h4>输入参考图</h4>${refs?`<div class="auto-case-references">${refs}</div>`:'<p class="dim">这条测试没有参考图。</p>'}</div>
  </section>`;
}

const autoShotTranslations=new WeakMap();

function autoTranslationPath(page) {
  return AUTO_API+'/'+route(autoState.job.id)+'/translations/'+route(page.dataset.autoCasePage);
}

function autoSetPromptLanguage(box,translated) {
  box.querySelector('[data-auto-original]').hidden=translated;
  box.querySelector('[data-auto-translation]').hidden=!translated;
  box.querySelector('[data-action="auto-prompt-original"]').setAttribute('aria-pressed',String(!translated));
  box.querySelector('[data-action="auto-prompt-translate"]').setAttribute('aria-pressed',String(translated));
  box.querySelector('[data-auto-translation-status]').hidden=true;
  if(box.closest('[data-auto-case-page]').contains(autoShotAnchor))autoShotTooltip(autoShotAnchor);
}

async function autoTranslatePrompt(button) {
  const page=button.closest('[data-auto-case-page]');
  const box=button.closest('.auto-case-inputs');
  const output=box.querySelector('[data-auto-translation]');
  const status=box.querySelector('[data-auto-translation-status]');
  box.dataset.promptLanguage='zh';
  if(!output.textContent){
    status.textContent=`正在用 ${autoState.job.translation_model} 翻译…`;
    status.hidden=false;
    try {
      const result=await api(autoTranslationPath(page),{});
      autoShotTranslations.set(page,new Map(Object.entries(result.shot_translations||{}).map(([key,text])=>[key,{text}])));
      output.textContent=result.translation;
    } catch (error) {
      status.textContent=errorMessage(error);
      return;
    }
  }
  if(box.dataset.promptLanguage==='zh')autoSetPromptLanguage(box,true);
}

function autoVideoTime(modelId,ms,label,endMs,withSound=false) {
  return Number.isFinite(ms)?`<button type="button" class="auto-case-time" data-action="auto-case-play"
    data-model="${autoText(modelId)}" data-time="${ms}"${Number.isFinite(endMs)?` data-end-time="${endMs}"`:''}${withSound?' data-sound="1"':''}>${autoText(label)}</button>`:'';
}

function autoShotHint(shot) {
  return shot?.prompt?` data-shot-prompt="${autoText(shot.prompt)}" data-shot-index="${shot.index}" aria-describedby="auto-shot-tooltip"`:'';
}

const autoIsShotIssue=row=>row.status==='fail'||row.status==='partial';

function autoFindingStatus(label,tone,content='',title=label) {
  if(!content)return `<b class="auto-shot-badge" data-state="${tone}">${autoText(label)}</b>`;
  const id=`auto-finding-${++lightboxSerial}`;
  return `<button type="button" class="auto-shot-badge auto-finding-trigger" data-state="${tone}"
    aria-expanded="false" aria-controls="${id}" aria-label="${autoText(title)} · ${autoText(label)}，查看详情">${autoText(label)}</button>
    <div id="${id}" class="auto-finding-popover" role="group" aria-label="${autoText(title)}" hidden>
      <div class="auto-finding-popover-heading"><strong>${autoText(title)}</strong>
        <button type="button" class="auto-finding-close" aria-label="关闭说明">×</button></div>
      ${content}
    </div>`;
}

function autoReviewIssueList(issues,modelId,cut) {
  if(!issues.length)return '';
  return `<ul class="auto-review-issues">${issues.map(issue=>{
    const frames=[...(issue.evidence||[])].sort((a,b)=>a.actual_time_ms-b.actual_time_ms);
    const group='media-'+(++lightboxSerial);
    return `<li>${issue.title?`<b>${autoText(issue.title)}</b>`:''}${issue.reason?`<p>${autoText(issue.reason)}</p>`:''}
      ${frames.length?`<div class="auto-shot-evidence-grid">${frames.map(point=>{
        const url=stepMediaURL(point.asset), label=timeText(point.actual_time_ms);
        const end=point.actual_time_ms>=cut?.end_ms?point.actual_time_ms+700:cut?.end_ms;
        return `<figure>${url?`<a href="${autoText(url)}" data-lightbox="${group}" data-caption="${autoText(label)}">
          <img src="${autoText(url)}" loading="lazy" alt="${autoText(label)}"></a>`:''}
          <figcaption>${cut?autoVideoTime(modelId,point.actual_time_ms,label,end):autoText(label)}</figcaption></figure>`;
      }).join('')}</div>`:''}</li>`;
  }).join('')}</ul>`;
}

function autoShotCheckStatus(check,title,labels,item,cut,extra='') {
  const status=check?.status;
  const label=labels[status]??(status==='not_applicable'?'不适用':status?'无法确认':'未评测');
  const tone=status==='pass'?'ok':autoIsShotIssue({status})?'warn':'pending';
  const fallback=cut?'这项没有保存具体判读。':'没有定位到这组视频的对应片段。';
  const details=status==='pass'?'':check?.issues?.length?autoReviewIssueList(check.issues,item.id,cut):
    check?.evidence?.length?autoReviewIssueList([check],item.id,cut):`<p>${autoText(check?.reason||fallback)}</p>`;
  return autoFindingStatus(label,tone,details+extra,title);
}

function autoNativeShotCard(row,item,shot,cut,index) {
  const checks=row?.checks||{};
  const stored=row?.items||{};
  const items=Object.values(stored);
  const tasks=row?.task_questions?.map(question=>({...stored[question.id],title:question.title}))
    ??items.filter(check=>check.axis==='task_completion');
  const taskLabels={pass:'完成',partial:'部分完成',fail:'未完成'};
  const identityLabels={pass:'一致',partial:'有偏差',fail:'不一致'};
  const line=(title,check,labels,below='',extra='')=>`<div class="auto-shot-dimension">
    <div class="auto-shot-finding-heading"><b>${title}</b>${autoShotCheckStatus(check,title,labels,item,cut,extra)}</div>
    ${below}</div>`;
  const taskList=tasks.length?`<ul class="auto-shot-tasks">${tasks.map(task=>{
    const title=(task.title||task.requirement)?.replace(/^是否做到这项要求：\s*(.*?)\s*[？?]?$/s,'$1');
    return `<li><span>${autoText(title)}</span>${autoShotCheckStatus(task,title,taskLabels,item,cut)}</li>`;
  }).join('')}</ul>`:checks.task_completion?'<p class="auto-shot-task-history">此版本仅记录整镜结果</p>':'';
  const audio=row?.audio;
  const audioReason={
    '同步信号不够明确':'听到了口播，也看到了嘴形，但无法确认两者是否同步。',
    '可见嘴形时长不足':'能连续看清的嘴形太少，无法跟口播对照。',
    '没有可靠识别到口播，无法确认嘴形同步':'有音轨，但未能可靠辨认出口播。',
  }[audio?.reason]||audio?.reason;
  const transcript=audio?.transcript?.length?`<p><b>识别到的口播</b></p><p>${audio.transcript.map(line=>autoText(line.text)).join(' ')}</p>`:'';
  const playback=cut&&item.url&&audio?.audio_track!==false
    ?autoVideoTime(item.id,cut.start_ms,'回听该镜',cut.end_ms,true)
    :'<button type="button" class="auto-case-time" disabled>回听该镜</button>';
  const physical=checks.physical_compliance;
  const physicalIssues=autoIsShotIssue(physical||{})?(physical.issues?.length?physical.issues:[physical]):[];
  const severe=items.filter(check=>check.severe_visual);
  const ordinary=physicalIssues.filter(check=>!check.severe_visual);
  const scoredIds=new Set(physicalIssues.map(check=>check.id));
  const notes=items.flatMap(check=>{
    if(check.observation)return [check.observation];
    return !check.core&&!check.severe_visual&&check.axis!=='person_identity'&&!scoredIds.has(check.id)
      &&autoIsShotIssue(check)?[check]:[];
  });
  const alerts=[
    [severe,'严重画面问题','bad'],[ordinary,'异常或违禁','warn'],[notes,'建议回看 · 未扣分','pending'],
  ].filter(([issues])=>issues.length).map(([issues,label,tone])=>
    autoFindingStatus(label,tone,autoReviewIssueList(issues,item.id,cut))).join('');
  const clipTime=cut?`${timeText(cut.start_ms)} – ${timeText(cut.end_ms)}`:'片段未定位';
  return `<section class="auto-shot-finding" data-auto-shot-finding="${index}" hidden>
    <header><strong>${autoText(shot.title)}</strong><small class="auto-shot-clip-time">${clipTime}</small>${alerts}</header>
    ${line(autoShotMetricNames.person_identity,checks.person_identity,identityLabels)}
    ${line(autoShotMetricNames.product_fidelity,checks.product_fidelity,identityLabels)}
    ${line(autoShotMetricNames.task_completion,checks.task_completion,taskLabels,taskList)}
    ${line('音频与嘴形',audio?{...audio,reason:audioReason}:null,{pass:'同步',fail:'有问题'},playback,transcript)}
  </section>`;
}

function autoLegacyShotRow(input,item,shot,cut) {
  const data=input?.shot_findings?.[item.id]?.[cut.index];
  const action=input?.action_review?.findings[item.id]?.[cut.index]?.find(row=>row.script_index===shot.index);
  const normalize=checks=>(checks||[]).map(check=>({...check,
    evidence:(check.evidence||[]).map(point=>({...point,actual_time_ms:point.time_ms})),
  }));
  const aggregate=checks=>{
    if(!checks.length)return null;
    const issues=checks.filter(autoIsShotIssue);
    if(issues.length)return {status:'fail',issues};
    if(checks.every(check=>check.status==='pass'))return {status:'pass'};
    return {status:'unknown',reason:checks.find(check=>check.status!=='pass')?.reason};
  };
  const tasks=normalize(data?.task);
  const actionIssues=[];
  if(action){
    const evidence=action.evidence.map(point=>({...point,actual_time_ms:point.time_ms}));
    if(action.strict_deviation||action.operation==='有偏差'||action.outcome==='未见'){
      tasks.push({title:'主要动作',status:'fail',reason:action.strict_deviation||action.reason,evidence});
    }
    if(action.physics_issue)actionIssues.push({reason:action.physics_issue,evidence});
    if(action.forbidden)actionIssues.push({reason:action.forbidden,evidence});
  }
  const taskCheck=aggregate(tasks);
  const unresolvedAction=action&&(action.operation==='无法确认'||action.outcome==='无法确认');
  const physicalIssues=[...normalize(data?.prohibitions).filter(autoIsShotIssue),...actionIssues];
  return {items:Object.fromEntries(tasks.map((task,index)=>[index,{...task,axis:'task_completion',core:true}])),checks:{
    person_identity:aggregate(normalize(data?.person)),product_fidelity:aggregate(normalize(data?.product)),
    task_completion:unresolvedAction&&!autoIsShotIssue(taskCheck||{})?{status:'unknown',reason:action.reason}:taskCheck,
    physical_compliance:physicalIssues.length?{status:'fail',issues:physicalIssues}:null,
  }};
}

function autoShotCard(input,item,shot,cut,index) {
  const row=input?.native_shots?input.native_shots[item.id]?.[shot.index]:cut?autoLegacyShotRow(input,item,shot,cut):null;
  return autoNativeShotCard(row,item,shot,cut,index);
}

function autoCaseVideos(caseId,videos,moments=[]) {
  const input=autoState.job?.review_inputs?.[caseId];
  const script=input?.script_shots||[];
  const grouped=moments.length?moments.map(moment=>({
    ...script.find(shot=>shot.index===moment.expected_shot),title:moment.name,index:moment.expected_shot,
    rows:new Map(moment.rows.map(row=>[row.model_id,row.actual_shots])),
  })):script;
  const candidates=videos.map(item=>{
    const cuts=item.shots?.map(shot=>({index:shot.index,start_ms:shot.range_ms[0],end_ms:shot.range_ms[1]}))
      ??input?.shots[item.id]??[];
    const matches=grouped.map(shot=>input?.shot_mapping
      ?cuts.find(cut=>cut.index===input.shot_mapping[item.id]?.[shot.index])
      :shot.rows
      ?cuts.find(cut=>shot.rows.get(item.id)?.includes(cut.index))
      :cuts.length===script.length?cuts.find(cut=>cut.index===shot.index):undefined);
    return {...item,url:stepMediaURL(item.video),matches};
  });
  const shotControls=grouped.map((shot,index)=>{
    const clips=Object.fromEntries(candidates.flatMap(item=>{
      const cut=item.matches[index];
      return cut&&item.url?[[item.id,[cut.start_ms,cut.end_ms]]]:[];
    }));
    const count=Object.keys(clips).length;
    return `<button type="button" class="btn small" data-action="auto-case-sync"
      data-auto-shot-choice="${index}" aria-pressed="false"
      data-clips="${autoText(JSON.stringify(clips))}"${autoShotHint(shot)}>
      ${autoText(shot.title)}${count<candidates.length?` <small>${count}/${candidates.length} 组</small>`:''}</button>`;
  }).join('');
  return `<section class="auto-video-comparison">
    <h4>结果对比</h4>
    <div class="auto-video-controls">
      <button type="button" class="btn small primary" data-action="auto-case-sync">从头同步播放</button>
      <button type="button" class="btn small" data-action="auto-case-pause">全部暂停</button>
      <small data-auto-play-status aria-live="polite"></small>
    </div>
    ${shotControls?`<div class="auto-shot-controls" aria-label="按分镜同步播放">
      ${shotControls}
      <small>${moments.length?'按已定位的动作播放':'按脚本顺序对照'}<span class="auto-shot-hover-note"> · 悬停看该镜提示词</span></small>
    </div>`:''}
    <div class="auto-video-grid">${candidates.map(item=>`<div class="auto-video-tile" data-auto-video-model="${autoText(item.id)}">
      <strong>${autoText(autoShortModel(item.name))}</strong>
      ${autoState.role==='maintainer'?`<button type="button" class="btn small" data-action="auto-show-trace" data-id="${autoText(caseId+'-'+item.id)}">查看这组实际调用</button>`:''}
      ${item.url?`<video controls playsinline muted preload="metadata" data-src="${autoText(item.url)}" aria-label="${autoText(autoShortModel(item.name))}"></video>`:'<div class="auto-video-missing">视频未保留</div>'}
      ${grouped.map((shot,index)=>autoShotCard(input,item,shot,item.matches[index],index)).join('')}
    </div>`).join('')}</div>
  </section>`;
}

let autoShotAnchor=null;

async function autoTranslateShot(page,translations,index) {
  translations.set(index,{});
  try {
    const result=await api(autoTranslationPath(page),{shot_index:Number(index)});
    translations.set(index,{text:result.translation});
  } catch(error) {
    translations.set(index,{error:errorMessage(error)});
  }
  if(page.contains(autoShotAnchor))autoShotTooltip(autoShotAnchor);
}

function autoShotTooltip(button) {
  const changed=button!==autoShotAnchor;
  autoShotAnchor=button;
  const tooltip=$('auto-shot-tooltip');
  if(!tooltip)return;
  tooltip.hidden=!button;
  if(!button)return;
  const page=button.closest('[data-auto-case-page]');
  const translations=autoShotTranslations.get(page);
  const inChinese=translations&&page.querySelector('[data-action="auto-prompt-translate"][aria-pressed="true"]');
  const index=button.dataset.shotIndex;
  let translation=inChinese?translations.get(index):null;
  if(inChinese&&(!translation||(translation.error&&changed))){
    autoTranslateShot(page,translations,index);
    translation=translations.get(index);
  }
  $('auto-shot-tooltip-title').textContent=translation&&!translation.error?'分镜提示词（中文）':'分镜提示词原文';
  $('auto-shot-tooltip-prompt').textContent=translation?.text??(translation
    ?translation.error?`${translation.error}\n\n${button.dataset.shotPrompt}`:'正在翻译这一镜…'
    :button.dataset.shotPrompt);
  const ranges=JSON.parse(button.dataset.clips);
  $('auto-shot-tooltip-times').textContent=(autoState.job?.groups||[]).flatMap(model=>{
    const range=ranges[model.id];
    return range?[`${autoShortModel(model.name)} ${timeText(range[0])}`]:[];
  }).join(' · ');
  autoPositionTooltip(tooltip,button);
}

function autoPositionTooltip(tooltip,anchor) {
  const rect=anchor.getBoundingClientRect();
  const width=tooltip.offsetWidth, height=tooltip.offsetHeight;
  tooltip.style.left=Math.max(8,Math.min(rect.left,innerWidth-width-8))+'px';
  const top=rect.bottom+height+8<=innerHeight?rect.bottom+6:rect.top-height-6;
  tooltip.style.top=Math.max(8,Math.min(top,innerHeight-height-8))+'px';
}

let autoFindingAnchor=null, autoFindingPinned=false, autoFindingTimer;

function autoCloseFinding(restoreFocus=false) {
  clearTimeout(autoFindingTimer);
  if(!autoFindingAnchor)return;
  const anchor=autoFindingAnchor;
  const popup=anchor.nextElementSibling;
  autoFindingAnchor=null;
  autoFindingPinned=false;
  popup.hidden=true;
  anchor.setAttribute('aria-expanded','false');
  if(restoreFocus)anchor.focus({preventScroll:true});
}

function autoOpenFinding(anchor,pinned=false) {
  clearTimeout(autoFindingTimer);
  if(autoFindingAnchor!==anchor)autoCloseFinding();
  autoFindingAnchor=anchor;
  autoFindingPinned=pinned;
  const popup=anchor.nextElementSibling;
  popup.hidden=false;
  anchor.setAttribute('aria-expanded','true');
  autoPositionTooltip(popup,anchor);
}

function autoRepositionFinding() {
  if(!autoFindingAnchor)return;
  const rect=autoFindingAnchor.getBoundingClientRect();
  if(!autoFindingAnchor.isConnected||rect.bottom<=0||rect.top>=innerHeight)autoCloseFinding();
  else autoPositionTooltip(autoFindingAnchor.nextElementSibling,autoFindingAnchor);
}

function autoVideoEvent(video,event,signal) {
  return new Promise((resolve,reject)=>{
    const cleanup=()=>{
      video.removeEventListener(event,done);
      video.removeEventListener('error',failed);
      signal.removeEventListener('abort',failed);
    };
    const done=()=>{cleanup();resolve();};
    const failed=()=>{cleanup();reject(new Error('视频加载中断'));};
    if(signal.aborted||video.error){failed();return;}
    video.addEventListener(event,done);
    video.addEventListener('error',failed);
    signal.addEventListener('abort',failed);
  });
}

function autoStopAtShotEnd(video,start,end,signal) {
  if(!Number.isFinite(end)||end<=start||end>=video.duration-0.001)return;
  const watchesFrames=typeof video.requestVideoFrameCallback==='function';
  let callback, previousFrame;
  const release=()=>{
    video.removeEventListener('play',watch);
    video.removeEventListener('ended',release);
    video.removeEventListener('seeking',release);
    signal.removeEventListener('abort',release);
    if(callback==null)return;
    if(watchesFrames)video.cancelVideoFrameCallback(callback);
    else cancelAnimationFrame(callback);
    callback=null;
  };
  const pauseBeforeCut=(time,lead)=>{
    if(time+lead<end)return false;
    release();
    // 在本镜的尾帧暂停，保留当前画面，避免切镜后回跳。
    video.pause();
    return true;
  };
  const checkFrame=(_,frame)=>{
    callback=null;
    const frames=frame.presentedFrames-(previousFrame?.presentedFrames??frame.presentedFrames);
    const interval=frames>0?(frame.mediaTime-previousFrame.mediaTime)/frames:1/30;
    previousFrame=frame;
    if(!pauseBeforeCut(frame.mediaTime,interval+0.001))watch();
  };
  const checkClock=()=>{
    callback=null;
    if(!video.paused&&!pauseBeforeCut(video.currentTime,0.025*video.playbackRate))watch();
  };
  const watch=()=>{
    if(callback!=null)return;
    callback=watchesFrames?video.requestVideoFrameCallback(checkFrame):requestAnimationFrame(checkClock);
  };
  signal.addEventListener('abort',release,{once:true});
  video.addEventListener('play',watch);
  video.addEventListener('ended',release,{once:true});
  video.addEventListener('seeking',release,{once:true});
  watch();
}

async function autoPlayClips(page,starts,{muted=false,missing=0}={}) {
  autoStopPlayback(page);
  const controller=new AbortController();
  autoPlayRequests.set(page,controller);
  const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]);
  const status=page.querySelector('[data-auto-play-status]');
  status.textContent=starts.length?'正在定位画面…':'这一镜没有可播放的视频';
  if(!starts.length)return;
  const positioned=await Promise.allSettled(starts.map(async ([video,ms,endMs])=>{
    if(!video.readyState)await autoVideoEvent(video,'loadedmetadata',signal);
    const time=Math.min(ms/1000,video.duration);
    if(Math.abs(video.currentTime-time)>0.001){
      video.currentTime=time;
      if(video.seeking)await autoVideoEvent(video,'seeked',signal);
    }
    if(muted)video.muted=true;
    return {video,start:time,end:Math.min(endMs/1000,video.duration)};
  }));
  if(controller.signal.aborted)return;
  const results=await Promise.allSettled(positioned.filter(item=>item.status==='fulfilled').map(item=>{
    const {video,start,end}=item.value;
    autoStopAtShotEnd(video,start,end,controller.signal);
    return video.play();
  }));
  if(controller.signal.aborted)return;
  const playing=results.filter(item=>item.status==='fulfilled').length;
  status.textContent=[playing?'':'视频未能播放，请重试',
    missing?`${missing} 组没有这一镜的时间点`:'',
    starts.length>playing?`${starts.length-playing} 组未播放`:''].filter(Boolean).join(' · ');
}

function playAutoEvidence(button,page=button.closest('[data-auto-case-page]')) {
  const video=page.querySelector(`[data-auto-video-model="${CSS.escape(button.dataset.model)}"] video`);
  if(!video)return;
  if(button.dataset.sound==='1')video.muted=false;
  autoPlayClips(page,[[video,Number(button.dataset.time),Number(button.dataset.endTime)]]);
  video.scrollIntoView({block:'nearest'});
}

function autoSelectShot(page,button) {
  autoCloseFinding();
  const selected=button.dataset.autoShotChoice;
  page.querySelectorAll('[data-auto-shot-choice]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
  page.querySelectorAll('[data-auto-shot-finding]').forEach(card=>{card.hidden=card.dataset.autoShotFinding!==selected;});
}

function autoPlayCaseTogether(button) {
  const page=button.closest('[data-auto-case-page]');
  const choice=button.hasAttribute('data-auto-shot-choice')?button:page.querySelector('[data-auto-shot-choice]');
  if(choice)autoSelectShot(page,choice);
  const ranges=button.dataset.clips?JSON.parse(button.dataset.clips):null;
  const tiles=[...page.querySelectorAll('[data-auto-video-model]')];
  const clips=tiles.flatMap(tile=>{
    const video=tile.querySelector('video');
    const range=ranges?ranges[tile.dataset.autoVideoModel]:[0];
    return video&&range?[[video,...range]]:[];
  });
  autoPlayClips(page,clips,{muted:true,missing:tiles.length-clips.length});
  page.querySelector('.auto-video-comparison').scrollIntoView({block:'nearest'});
}

function autoChronologicalReport(report) {
  const review=report.chronological_review;
  const caseId=report.cases[0]?.id;
  const byId=new Map(review.candidates.map(row=>[row.id,row]));
  const name=id=>autoShortModel(byId.get(id).name);
  const play=autoVideoTime;
  const evidence=row=>row.evidence.map(point=>`<li>${play(row.model_id,point.time_ms,timeText(point.time_ms))}
    <span>${autoText(point.note)}</span></li>`).join('');
  const winner=review.leaders.length===1?`${review.provisional?'按已确认的画面，建议看':'本条建议看'} ${autoText(name(review.leaders[0]))}`:
    review.leaders.length?`${review.leaders.map(id=>autoText(name(id))).join('、')} 表现接近`:'当前证据不足，暂未给出推荐';
  const highlights=review.highlights.map(item=>{
    const details=row=>`<p><b>${autoText(name(row.model_id))}</b> ${play(row.model_id,row.evidence[0]?.time_ms,timeText(row.evidence[0]?.time_ms||0))}
      <span>${autoText(item.dimension==='filming'?row.filming_reason:row.reason)}</span></p>`;
    return `<div class="auto-chrono-difference"><h4>${autoText(item.name)}</h4>${details(item.preferred)}${details(item.other)}</div>`;
  }).join('');
  const byAction=new Map(review.moments.map(moment=>[moment.id,moment.name]));
  const activityOrder=review.candidates.map(candidate=>{
    const activities=(candidate.actual_action_order||[]).map(id=>{
      const row=candidate.actions.find(item=>item.id===id);
      const ms=row?.evidence[0]?.time_ms??row?.time_ms;
      return `<li>${autoText(byAction.get(id))} ${play(candidate.id,ms,timeText(ms||0))}</li>`;
    }).join('');
    return `<div class="auto-case-entry">
      <div class="auto-case-model"><span>${autoText(name(candidate.id))}</span></div>
      <small>${autoText(candidate.action_order)} · ${candidate.shots.length} 个实际镜头</small>
      <ol class="auto-chrono-steps">${activities}</ol>
      ${autoState.role==='maintainer'?`<button type="button" class="btn small" data-action="auto-show-trace" data-id="${autoText(candidate.trace_id)}">查看实际调用</button>`:''}
    </div>`;
  }).join('');
  const moments=review.moments.map(moment=>`<details class="auto-chrono-moment"${moment.id===review.highlights[0]?.id?' open':''}>
    <summary><b>${autoText(moment.name)}</b></summary>
    <p class="dim">${autoText(moment.filming)}</p>
    <div class="auto-case-entries">${moment.rows.map(row=>{
      const candidate=byId.get(row.model_id);
      const ranges=row.actual_shots.map(index=>{
        const shot=candidate.shots.find(item=>item.index===index);
        const bounds=shot?.range_ms?.map(ms=>(ms/1000).toFixed(2)).join('–');
        return '实际第 '+index+' 镜'+(bounds?'（'+bounds+' 秒）':'');
      });
      const shots=ranges.join('、')||'未定位';
      const how=row.operation==='合理'&&row.outcome==='可见'?'做法与结果符合':row.operation;
      return `<div class="auto-case-entry"><div class="auto-case-model">
        <span>${autoText(name(row.model_id))}</span><b>${autoText(how)}</b></div>
        <p>${autoText(row.reason)}</p>
        <small>${autoText(shots)} · 拍法${autoText(row.filming)}${row.filming_reason?' · '+autoText(row.filming_reason):''}</small>
        <ul class="auto-case-deductions">${evidence(row)}</ul>
      </div>`;
    }).join('')}</div></details>`).join('');
  const heading=report.cases[0]?.name ?? report.title;
  const body=`${autoCaseInputs(caseId)}${autoCaseVideos(caseId,review.candidates,review.moments)}
    ${highlights?`<h3>影响推荐的画面</h3><div class="auto-chrono-highlights">${highlights}</div>`:''}
    <details class="auto-report-source"><summary>查看各组的动作顺序</summary><div class="auto-case-entries">${activityOrder}</div></details>
    <h3>顺着视频看证据</h3><p class="dim">同一动作放在一起，点击时间可跳到相应视频。</p>${moments}
    <details class="auto-report-source"><summary>查看判定依据</summary>
      <p>${autoText(review.method)}</p><p>判读模型 ${autoText(review.review_model)}</p>${rawDownload(report,'下载完整记录')}
    </details>`;
  return `<article class="automatic-report auto-overview auto-chrono">
    <header class="auto-overview-head"><p class="auto-report-scope"><span>${autoText(report.title)}</span><span>${review.candidates.length} 条候选视频</span></p>
      <h2 class="auto-chrono-winner">${winner}</h2><p class="dim">${autoText(review.scope)}</p>
    </header>
    ${autoFeedbackSummary()}
    ${caseId?autoCasePager([{id:caseId,heading,body}]):''}
  </article>`;
}

function autoRenderReport(report) {
  if(report.chronological_review)return autoChronologicalReport(report);
  if(report.comparison)return autoReportOverview(report);
  const comparison=autoComparisonMetrics(report);
  const metrics=report.metrics;
  const compare=report.models.map(model=>[autoText(model.name),...metrics.map(metric=>{
    const rate=model.rates[metric.id], score=model.scores[metric.id];
    if (rate) {
      return rate.count?`<b>${autoPct(rate.ratio)}</b><small>各组都能判断的 ${rate.count} 项里，通过 ${rate.pass} 项</small>`:
        '<b class="dim">暂无可对比的检查</b>';
    }
    const points=Number.isFinite(score?.score)?score.score.toFixed(2):'暂无对比分数';
    return `<b>${points}</b><small>${autoText(autoScoreBasis(score,report.models.length))}</small>`;
  })]);
  const issues=report.models.map(model=>{
    const findings=report.issues.filter(issue=>issue.model_id===model.id);
    return `<section class="block"><h4>${autoText(model.name)}</h4>${findings.length?`<ul class="issue-list">${findings.map(autoIssue).join('')}</ul>`:'<p class="dim">本次未记录可展示的问题证据。</p>'}</section>`;
  }).join('');
  return `<article class="automatic-report">
    ${autoReportHero(report,comparison)}
    ${autoModelComparison(report.models,comparison)}
    <h3>设计师关注的关键表现</h3>${autoBullets(report.focus)}
    ${autoTable(['候选模型',...metrics.map(m=>m.id==='task_completion'?'关键任务完全通过比例':m.has_rate?m.name+'通过比例':m.name+'分数')],compare)}
    <p class="dim">通过率只比较各组都能判断的同一批检查项，按完全通过的项数来算。</p>
    ${report.limitations.length?`<h3>哪些情况没法判断</h3>${autoBullets(report.limitations.map(item=>`${report.focus[item.focus_number-1]||'评价重点'} · ${item.reason}`))}`:''}
    <h3>各模型的具体问题</h3>${issues}
    ${autoReportScores(report)}
    ${rawDownload(report,'下载报告数据')}</article>`;
}
function autoTraceLabel(id, job) {
  if(id==='entry-agent')return '入口 Agent 的实际请求与答复';
  if(id==='report-agent')return '报告 Agent 的实际请求与答复';
  if(id.endsWith('-person-realism')){
    const caseId=id.slice(0,-'-person-realism'.length);
    const item=job.result?.report?.comparison?.cases.find(row=>row.id===caseId);
    return `${item?.name||caseId} · Opus 5.5 正反两轮`;
  }
  if(id.startsWith('media-'))return '共享切镜和采样 · '+id.slice(-8);
  const parts=/^(case-\d+)-(standard|model-\d+)(?:-part(\d+))?$/.exec(id);
  if(!parts)return id;
  const report=job.result?.report;
  const example=(report?.cases||report?.comparison?.cases||[]).find(caseInfo=>caseInfo.id===parts[1]);
  const title=example?.name||`用例 ${Number(parts[1].split('-')[1])}`;
  return parts[2]==='standard'?title+' · 共用用例标准'+(parts[3]?' 第 '+parts[3]+' 部分':''):title+' · '+(job.groups.find(row=>row.id===parts[2])?.name||parts[2]);
}
function autoAudit(job) {
  const audit=job.audit, flow=audit.flow;
  const stepNames=Object.fromEntries((flow?.tool_chain||[]).map(step=>[step.id,autoNamed(step.tool)]));
  const steps=(flow?.tool_chain||[]).map(step=>`<li><b>${autoText(autoNamed(step.tool))}</b> ${autoText(step.model||'程序执行')} · ${autoText(step.scope)}${step.dependencies?.length?`<small> · 依赖 ${autoText(step.dependencies.map(dep=>stepNames[dep]).join('、'))}</small>`:''}</li>`).join('');
  const metrics=(flow?.metrics||[]).map(metric=>`<details class="block"><summary>${autoText(metric.name)} · ${autoText(metric.template_id)} 第 ${metric.template_version} 版</summary>
      <p>${autoText(metric.reason)}</p>
      ${metric.focus_numbers.length?autoBullets(metric.focus_numbers.map(number=>job.focus[number-1])):''}
      ${autoTable(['配置','模板默认','本任务实际'],[
        ['采样',`<code>${autoText(JSON.stringify(metric.sample_defaults))}</code>`,`<code>${autoText(JSON.stringify(metric.sample_effective))}</code>`],
        ['判读',`<code>${autoText(JSON.stringify(metric.judge_defaults))}</code>`,`<code>${autoText(JSON.stringify(metric.judge_effective))}</code>`]])}
      <div class="step-prompts">${promptBox('默认判读提示词',metric.base_prompt)}${promptBox('实际判读提示词',metric.user_prompt)}${promptBox('实际系统提示词',metric.system_prompt)}</div>
      ${metric.case_prompt_addition?promptBox('用例标准补充指令',metric.case_prompt_addition):''}</details>`).join('');
  const traces=[...audit.agents,...audit.traces];
  const execution=job.result?.report?.execution;
  const guests=autoSharedFeedbackAudit(job);
  return `<section class="auto-audit"><h2>流程与实际调用</h2>
    ${audit.person_realism_available?'<button type="button" class="btn small" data-action="auto-run-realism">运行 S2-12 人物真实感横评</button>':''}
    ${flow?.report_revision?`<p class="dim">沿用 ${autoText(flow.report_revision.source_flow_id)} 的原始调用和完结结果。按实际抽样看过的帧复核了 ${flow.report_revision.changed_observations} 个禁止项观察。</p>`:''}
    <p class="dim">规划模型 ${autoText(audit.planner_model)} · 判读模型 ${autoText(audit.judge_model)}${audit.supplement_model?` · 补评模型 ${autoText(audit.supplement_model)}`:''}</p>
    ${flow?`<h3>流程版本 ${autoText(flow.id)}</h3><p>${autoText(flow.scene)}</p><p>${autoText(flow.case_analysis_reason)}</p><ol>${steps}</ol>${metrics?`<h3>指标选择与模板调整</h3>${metrics}`:''}`:''}
    ${flow?.repair_from?`<p class="dim">补评沿用 ${autoText(flow.repair_from)} 的有效结果。${flow.replanned_cases?.length?'缺失共用标准的用例重新出题，随后复核四组视频。':''}</p>`:''}
    ${flow?.shot_parameters?`<h3>逐镜实际配置</h3>${promptBox('抽帧与提交参数',JSON.stringify(flow.shot_parameters,null,2))}
      ${promptBox('入口 Agent 选定的设置',JSON.stringify(flow.shot_design,null,2))}
      ${promptBox('判读提示词',flow.shot_prompt)}
      ${flow.audio_parameters?promptBox('音画同步参数',JSON.stringify(flow.audio_parameters,null,2)):''}`:''}
    ${flow?.prompt_refinement?`<details class="block"><summary>已确认的反馈与提示词改动 · ${autoText(flow.prompt_refinement.name)}</summary>
      ${promptBox('基线与确认记录',JSON.stringify(flow.prompt_refinement,null,2))}</details>`:''}
    ${execution?`<p class="callout">共享用例标准 ${execution.case_standard_groups} 组，切镜 ${execution.detector_calls} 次，合并抽帧 ${execution.sampling_calls} 次。实际提取 ${execution.unique_frames}/${execution.requested_frames} 帧，视觉判读请求 ${execution.judgment_calls} 次。</p>`:''}
    ${traces.length?`<h3>实际调用记录</h3><label>选择调用记录<select id="auto-trace-select">${traces.map(id=>`<option value="${autoText(id)}">${autoText(autoTraceLabel(id,job))}</option>`).join('')}</select></label><button class="btn small" data-action="auto-show-trace">查看请求、参数、提示词和返回</button><div id="auto-trace" class="auto-trace-panel"></div>`:''}
    ${job.status==='completed'&&flow?.shot_parameters&&!flow.repair_from&&audit.problems.some(row=>['standards','shot_batch','shot_video','audio'].includes(row.stage))?
      '<button type="button" class="btn small" data-action="auto-retry-shots">补评缺失分镜</button>':''}
    ${audit.problems.length?`<details class="block" data-auto-details-key="audit-problems"><summary>执行中记录的问题（${audit.problems.length}）</summary>${autoBullets(audit.problems.map(row=>`${row.entry} · ${row.error.code} · ${row.error.message}`))}</details>`:''}
    ${guests}
    </section>`;
}

function autoSharedFeedbackAudit(job) {
  const guests=job.audit.shared_feedback||[];
  if(!guests.length)return '';
  const caseNames=Object.fromEntries((job.result?.report?.comparison?.cases||[]).map(row=>[row.id,row.name.split(' · ').slice(0,2).join(' · ')]));
  const modelNames=Object.fromEntries(job.groups.map(row=>[row.id,autoShortModel(row.name)]));
  return `<section class="auto-shared-feedback-audit"><h3>内网设计师反馈</h3>${guests.map(guest=>{
    const feedback=guest.feedback;
    return `<details class="block" data-auto-details-key="reviewer-${autoText(guest.id)}"><summary>${autoText(guest.name)} · 已填写 ${feedback.reviewed}/${feedback.total} 条</summary>
      ${guest.confirmed_summary?`<section><h4>已确认的反馈总结</h4>${guest.confirmed_summary.problems.length?
        `<ul>${guest.confirmed_summary.problems.map(row=>`<li>${autoText(row.text)}${row.case_ids.length?
          ` <small>${autoText(row.case_ids.map(id=>caseNames[id]||id).join('、'))}</small>`:''}</li>`).join('')}</ul>`:
        '<p>这轮反馈没有指出具体问题。</p>'}
        <div data-shared-feedback-version="${autoText(guest.id)}">${autoSharedVersionContent(guest.version_generation,guest.id)}</div></section>`:
        '<p class="dim">设计师填齐并确认总结后，可生成提示词版本。</p>'}
      ${guest.adopted_version&&(!guest.confirmed_summary||guest.adopted_version.latest)?
        `<div data-adopted-feedback-version="${autoText(guest.id)}">${autoSharedVersionContent(guest.adopted_version,guest.id,true)}</div>`:''}
      ${Object.entries(feedback.records).map(([id,record])=>`<section class="auto-shared-feedback-record"><h4>${autoText(caseNames[id]||id)}</h4>
        ${record.recommendation_agrees===true?'<p>同意系统推荐</p>':record.recommendation_agrees===false?`<p>设计师推荐 ${autoText(record.preferred_models.map(id=>modelNames[id]||id).join('、'))}</p>
        <p>${autoText(record.recommendation_reason)}</p>`:''}
        ${record.observations?`<p>${autoText(record.observations)}</p>`:''}
        ${autoFeedbackImageList(record.images||[])}</section>`).join('')||'<p class="dim">尚未保存用例反馈。</p>'}</details>`;
  }).join('')}</section>`;
}

function autoSharedVersionContent(state,reviewerId,adopted=false) {
  const latest=state.latest;
  const version=latest?.result?.version;
  const model=autoText(state.model);
  const cases=autoState.job?.result?.report?.comparison?.cases||[];
  const caseName=id=>cases.find(row=>row.id===id)?.name||id;
  const button=(label,step='')=>`<button class="btn small primary" type="button" data-action="auto-generate-shared-version"
    data-reviewer="${autoText(reviewerId)}" data-version-step="${step}">${label}</button>`;
  if(adopted&&!latest)return button('以当前已保存反馈开始总结','adopt');
  const source=adopted?`<p class="dim">维护员采用已保存的 ${state.source.reviewed}/${state.source.total} 条反馈。</p>`:'';
  const summary=adopted&&state.summary?`<details ${latest.action==='summarize'?'open':''}><summary>查看系统生成的反馈总结</summary>
    <ul>${state.summary.problems.map(problem=>`<li>${autoText(problem.text)}</li>`).join('')}</ul></details>`:'';
  const answers=latest?.result?.diagnosis||[];
  const diagnosis=autoDiagnosisContent(answers);
  const reply=(label)=>`<form class="auto-refinement-form" data-adopted-feedback-reply="${autoText(reviewerId)}">
    <label>${label}<textarea name="supplement" rows="2" maxlength="4000" required></textarea></label>
    <button type="submit" class="btn small">更新问题清单</button></form>`;
  const followup=adopted&&answers.some(row=>row.decision==='clarify')?reply('补充待确认的用例、模型或时间点'):'';
  const reanalyze=adopted&&latest?.action==='optimize'&&latest.status==='completed'?button('重新诊断已保存的反馈','reanalyze'):'';
  if(!latest)return `<p class="dim">使用 ${model} 根据已确认的总结生成提示词版本。</p>${button('生成提示词版本')}`;
  if(['queued','running'].includes(latest.status))return `${source}${summary}<p role="status">${model} 正在${latest.action==='summarize'?'整理反馈':'生成提示词版本'}…</p>`;
  if(['failed','interrupted'].includes(latest.status))return `${source}${summary}<p class="error">${autoText(latest.error?.message||'处理反馈失败。')}</p>${button('重试',adopted?'retry':'')}`;
  if(adopted&&latest.action==='summarize')return `${source}${summary}${reply('补充或纠正总结')}${button('采用总结并生成提示词版本','generate')}`;
  if(!version)return `${source}${summary}${diagnosis}<p>系统检查完毕，本轮没有可落实到提示词的改动。</p>${followup}${reanalyze}`;
  const instructions=version.changes.instructions.map(row=>
    `<li><b>${autoText(autoShotMetricNames[row.axis]||row.axis)} · 系统提示词</b> ${autoText(row.text)}
      ${row.case_ids?`<small>适用用例 ${autoText(row.case_ids.map(caseName).join('、'))}${row.shot?` · 第 ${row.shot} 镜`:''}</small>`:''}</li>`);
  const questions=version.changes.questions.map(row=>
    `<li><b>${autoText(caseName(row.case_id))} · 第 ${row.shot} 镜 · ${row.question_id?'改写判断题':'新增判断题'}</b> ${autoText(row.text)}</li>`);
  return `${source}${summary}${diagnosis}${followup}<section><h4>系统生成的提示词版本 ${autoText(version.name)}</h4>
    <p class="dim">生成模型 ${model} · 来源流程 ${autoText(version.source_flow)}</p>
    <ul>${[...instructions,...questions].join('')}</ul>${reanalyze}</section>`;
}

async function autoRefreshSharedVersion(job,guest,generate=false,adopted=false,step='',supplement) {
  const endpoint=adopted?'shared-feedback-adoption':'shared-feedback-version';
  const path=`${AUTO_API}/${route(job.id)}/${endpoint}/${route(guest.id)}`;
  const body=adopted&&step?(['adopt','reanalyze'].includes(step)?{action:step}:{action:step,parent:guest.adopted_version.latest.id}):generate?{}:undefined;
  if(step==='revise')body.supplement=supplement;
  const state=await api(path,body);
  if(autoState.job!==job)return;
  guest[adopted?'adopted_version':'version_generation']=state;
  const attribute=adopted?'data-adopted-feedback-version':'data-shared-feedback-version';
  const panel=$('auto-result').querySelector(`[${attribute}="${CSS.escape(guest.id)}"]`);
  if(panel)panel.innerHTML=autoSharedVersionContent(state,guest.id,adopted);
}

function autoTraceView(trace) {
  const excerpt=(title,value)=>value==null?'':promptBox(title,typeof value==='string'?value:JSON.stringify(value,null,2));
  const raw=`<details class="block"><summary>展开完整调用记录</summary><pre class="prompt-text auto-trace">${autoText(JSON.stringify(trace,null,2))}</pre></details>`;
  if(trace.kind==='person_realism') {
    const name=id=>autoShortModel(autoState.job.groups.find(group=>group.id===id)?.name||id);
    const parameters=trace.parameters;
    return `<h3>Opus 5.5 人物真实感 · 正反两轮</h3>
      <p>${autoText(parameters.method)}，每条 ${parameters.frames_per_video} 张整帧。上限 ${parameters.max_request_bytes.toLocaleString()} 字节。</p>
      ${trace.error?`<p class="error">${autoText(trace.error.message)}</p>`:''}
      ${trace.rounds.map(round=>{
        const request=round.request;
        return `<section class="block"><h4>第 ${round.round} 轮 · ${round.status==='ok'?'已校验':'未通过'}</h4>
          <p>请求模型 <b>${autoText(request.model)}</b> · ${autoText(request.codec==='jpeg'?'原尺寸 JPEG 98，4:4:4':'原尺寸无损 WebP')} · ${request.size_bytes.toLocaleString()} 字节 · ${request.frames.length} 张图</p>
          <p>${autoText(Object.entries(request.order).map(([letter,id])=>`${letter} = ${name(id)}`).join(' · '))}</p>
          <p class="dim">提示词 ${autoText(request.prompt_version)} · 最多 ${request.max_tokens} 输出 token · 超时 ${request.timeout_seconds} 秒</p>
          ${round.revalidation?`<p class="dim">${autoText(round.revalidation.reason)}</p>`:''}
          <details><summary>实际发送的提示词</summary>${excerpt('用户提示词',request.prompt)}</details>
          <details><summary>送审帧、原片 PTS 与图片校验值</summary>${autoTable(['匿名标签','抽帧目标','实际时间','原片 PTS','编码图 SHA-256','证据图'],request.frames.map(frame=>{
            const meta=frame.asset.metadata?.parent_mapping?.frame;
            const url=stepMediaURL(frame.asset);
            return [autoText(frame.label),timeText(frame.requested_time_ms),timeText(frame.actual_time_ms),
              autoText(meta?`${meta.root_pts} × ${meta.root_time_base.join('/')}`:''),autoText(frame.image_sha256),
              url?`<a href="${autoText(url)}" target="_blank" rel="noopener">打开原尺寸帧</a>`:''];
          }))}</details>
          ${round.attempts.map((attempt,index)=>`<details ${attempt.error?'open':''}><summary>请求 ${index+1} · ${autoText(attempt.response_model||'无响应模型')} · ${attempt.elapsed_seconds} 秒</summary>
            ${attempt.usage?`<p>${autoText(attempt.usage.input_tokens)} 输入 token · ${autoText(attempt.usage.output_tokens)} 输出 token</p>`:''}
            ${attempt.error?`<p class="error">${autoText(attempt.error)}</p>`:''}${excerpt('模型实际回复',attempt.response)}</details>`).join('')}
          ${round.result?`<details><summary>已校验的结论和证据</summary>${excerpt('校验结果',round.result)}</details>`:''}
        </section>`;
      }).join('')}${raw}`;
  }
  if(Array.isArray(trace)) {
    return trace.map((row,index)=>`<section class="block"><h4>第 ${index+1} 次实际请求 · ${autoText(row.model)}</h4>
      <p class="dim">接口返回模型 ${autoText(row.transport?.response_model)}</p>
      ${row.validation_error||row.request_error?`<p class="error">${autoText(row.validation_error||row.request_error.message)}</p>`:''}
      ${row.revalidated_from?`<p class="dim">重新校验原始模型回复 · ${autoText(row.revalidated_from)}</p>`:''}
      ${excerpt('系统提示词',row.request?.system_prompt)}
      <details><summary>实际用户输入</summary>${excerpt('发送给模型的材料与要求',row.request?.context)}</details>
      ${excerpt('模型原始回复',row.response)}</section>`).join('')+raw;
  }
  const steps=(trace.steps||[]).map(step=>{
    const events=step.events.filter(event=>event.kind==='vlm_request');
    const calls=step.result?.calls||[];
    const batches=step.events.filter(event=>event.kind==='metric_batch');
    const metric=step.inputs.dimension_ids?.map(metricName).join('、');
    const isReview=step.inputs.review_items?.length || step.step_id.endsWith('-supplement');
    const segmentLabels=step.inputs.shots?.map(row=>row.index).join('、');
    const requestParams=Object.fromEntries(Object.entries(step.inputs).filter(([key])=>
      !['prompt','system_prompt','video','output','instruction','references','evidence','case_standard','rubric'].includes(key)));
    return `<details class="block"><summary>${autoText(autoNamed(step.tool))}${segmentLabels?' · 镜头 '+autoText(segmentLabels):''}${metric?' · '+autoText(metric):''}${isReview?' · 补评':''} ${statusPill(step.status)}</summary>
      ${step.error?`<p class="error">${autoText(step.error.message)}</p>`:''}
      ${excerpt('本次执行参数',requestParams)}
      ${excerpt('实际系统提示词',step.inputs.system_prompt)}
      ${excerpt('实际判读提示词',step.inputs.prompt)}
      ${step.tool==='media.inspect_shot_audio@1'?excerpt('逐镜音画检查结果',step.result):''}
      ${step.tool==='vlm.inspect_shot@1'?excerpt('已通过校验的分镜判定',step.result?.accepted):''}
      ${events.map((event,index)=>{
        const batch=batches[index];
        const call=calls[index]||batch;
        const state=batch?(batch.status==='backend_timeout'?'超时':batch.status==='saved'?'已保存':'有检查结果待复核'):'';
        const info=batch?` · ${state} · ${batch.elapsed_seconds.toFixed(1)} 秒`:
          Number.isFinite(call?.elapsed_seconds)?` · ${call.elapsed_seconds.toFixed(1)} 秒`:'';
        const sent=event.request.messages?.find(message=>message.role==='user')?.content;
        const input=Array.isArray(sent)?sent.find(part=>part.type==='text')?.text:sent;
        return `<details><summary>第 ${index+1} 次模型请求 · ${autoText(event.request.model)}${info}</summary>
          ${call?.response_model?`<p class="dim">接口返回模型 ${autoText(call.response_model)}</p>`:''}
          ${call?.response_error?`<p class="error">${autoText(call.response_error)}</p>`:''}
          ${excerpt('这组实际发给模型的检查和指令',input)}
          ${batch?.batch_result_ref?.startsWith('/api/artifacts/')?`<p><a href="${autoText(batch.batch_result_ref)}">查看这组已保存的结果</a></p>`:''}
          ${vlmMaterials(event.views||[])}${responseLinks(call)}</details>`;
      }).join('')}</details>`;
  }).join('');
  const shared=trace.shared_media?.id?`<button class="btn small" data-action="auto-show-trace" data-id="${autoText(trace.shared_media.id)}">查看本视频共用的切镜与抽帧</button>`:'';
  return shared+steps+raw;
}
function autoRender(job,caseId=null) {
  const result=job.result||{};
  let html='';
  if(result.report)html+=autoRenderReport(result.report);
  else {
    html+=`<h2>${autoText(job.name)} ${statusPill(job.status)}</h2>`;
    if(job.error)html+=`<p class="error">${autoText(job.error.message)}</p>`;
    else html+=`<p class="lead">${autoText(autoLabels[result.phase]||'正在等待执行')}${result.standard_groups&&result.phase==='case_standards'?` · ${result.completed_standards}/${result.standard_groups} 组已处理`:''}${result.total?` · ${result.finished}/${result.total} 条视频已处理`:''}${Number.isInteger(result.realism_finished)?` · ${result.realism_finished}/${result.cases} 条用例的 Opus 横评已处理`:''}</p>`;
  }
  if(autoState.role==='designer'&&job.submission)html+=`<button class="btn small" data-action="auto-copy">复用本次提交设置</button>`;
  if(job.audit)html+=autoAudit(job);
  autoShotTooltip(null);
  autoCloseFinding();
  autoCasePages().forEach(autoStopPlayback);
  autoSetReportMode(Boolean(result.report));
  const hasFeedback=result.report&&(job.feedback_sharing||job.feedback&&Object.keys(job.feedback.targets).length>0);
  $('auto-result').innerHTML=hasFeedback?`<div class="auto-report-layout">
    <div class="auto-report-content">${html}</div>
    <aside id="auto-feedback-dock" class="auto-feedback-dock" aria-label="当前用例反馈">
      <button id="auto-feedback-toggle" class="btn small" type="button" data-action="auto-feedback-toggle"
        aria-controls="auto-feedback-body" aria-expanded="false">用例反馈</button>
      <div id="auto-feedback-body"></div>
    </aside>
  </div>`:html;
  $('auto-result').querySelectorAll('[data-radar-color]').forEach(dot=>{
    dot.style.backgroundColor=autoRadarColors[Number(dot.dataset.radarColor)];
  });
  autoShowCase(caseId||read('automatic-case:'+job.id)||Object.keys(job.result?.report?.recheck_shots||{})[0],Boolean(caseId));
  autoRenderRefinement();
  autoRestoreFeedbackDrafts(job);
  requestAnimationFrame(drawAutoRadar);
}
async function autoPoll() {
  if(autoState.polling||!autoState.role||$('page-automatic-evaluation').hidden)return;
  const job=autoState.job;
  if(!job)return;
  if(!['queued','running'].includes(job.status)){
    const refinement=job.feedback_refinement;
    const isPending=status=>['queued','running'].includes(status);
    const versions=(job.audit?.shared_feedback||[]).filter(guest=>isPending(guest.version_generation?.latest?.status));
    const adopted=(job.audit?.shared_feedback||[]).filter(guest=>isPending(guest.adopted_version?.latest?.status));
    const personal=[refinement?.history.at(-1)?.status,refinement?.run?.status].some(isPending);
    if(!autoState.refinementPolling&&(personal||versions.length||adopted.length)){
      autoState.refinementPolling=true;
      try {
        if(personal)await autoRefreshRefinement(job);
        await Promise.all([...versions.map(guest=>autoRefreshSharedVersion(job,guest)),
          ...adopted.map(guest=>autoRefreshSharedVersion(job,guest,false,true))]);
      }
      catch(e) {if(e.status===401)await (job.feedback_reviewer?initAutomaticReportShare():autoSession());}
      finally {autoState.refinementPolling=false;}
    }
    return;
  }
  autoState.polling=true;
  try {if(await autoOpen(job.id,{poll:true}))await autoList();}
  catch(e) {if(e.status===401)await autoSession();}
  finally {autoState.polling=false;}
}

$('auto-login').addEventListener('submit',e=>{
  e.preventDefault();
  busy(e.submitter,async()=>{
    await api(AUTO_SESSION,{role:e.submitter.value});
    await autoSession();
  });
});
$('auto-report-back').addEventListener('click',autoCloseReport);
$('auto-logout').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  await api(AUTO_SESSION,{logout:true});
  ++autoState.requestSerial;
  autoState.job=null;
  autoSetReportMode(false);
  autoShotTooltip(null);
  autoCasePages().forEach(autoStopPlayback);
  $('auto-result').innerHTML='';
  await autoSession();
}));
$('auto-form').addEventListener('submit',e=>{
  e.preventDefault();
  busy(e.submitter,async()=>{
    const dataset_ids=[...$('auto-datasets').selectedOptions].map(o=>o.value);
    if(dataset_ids.length<2)throw new Error('请至少选择两组待评结果。');
    const files=[...$('auto-files').files], images=[...$('auto-images').files];
    const attachments=files.length?await Promise.all(files.map(async f=>({name:f.name,text:await f.text()}))):autoState.copied?.attachments||[];
    const reference_asset_ids=images.length?[]:[...autoState.copied?.reference_asset_ids||[]];
    for(const file of images)reference_asset_ids.push((await upload(file)).asset_id);
    const key=id('auto');
    const job=await api(AUTO_API,{job_id:key,idempotency_key:key,display_name:val('auto-name'),dataset_ids,
      business_background:val('auto-background'),focus:val('auto-focus').split('\n').map(x=>x.trim()).filter(Boolean),attachments,reference_asset_ids});
    $('auto-form-panel').open=false;
    await autoOpen(job.id); await autoList();
  });
});
$('auto-import').addEventListener('click',e=>busy(e.currentTarget,async()=>{
  const file=$('auto-import-manifest').files[0];
  if(!file)throw new Error('请选择结果组 JSON 清单。');
  const spec=JSON.parse(await file.text()), files=[...$('auto-import-media').files], loaded=new Map();
  const assetMap={...spec.asset_map};
  const byName=new Map(files.map(item=>[item.name,item]));
  if(byName.size!==files.length)throw new Error('上传的素材文件名需要唯一。');
  for(const [old,name] of Object.entries(spec.asset_files||{})) {
    if(!byName.has(name))throw new Error(`缺少清单中的素材 ${name}`);
    if(!loaded.has(name))loaded.set(name,(await upload(byName.get(name))).asset_id);
    Object.defineProperty(assetMap,old,{value:loaded.get(name),enumerable:true,configurable:true});
  }
  const dataset=await api('/api/datasets/import',{dataset:spec.dataset,outputs:spec.outputs,asset_map:assetMap,description:spec.description});
  await refreshCatalogs(); autoDatasets();
  for(const option of $('auto-datasets').options)if(option.value===dataset.dataset_id)option.selected=true;
  notice('结果组已导入。','success');
}));
$('page-automatic-evaluation').addEventListener('change',e=>{
  if(e.target.matches('[data-auto-case-select]'))autoShowCase(e.target.value,true);
  if(e.target.matches('[data-auto-feedback-image-input]')){
    const files=[...e.target.files];
    e.target.value='';
    if(files.length)autoAttachFeedbackImages(e.target.form,files);
  }
});
$('page-automatic-evaluation').addEventListener('paste',e=>{
  const form=e.target.closest('.auto-feedback-form');
  if(!form)return;
  const images=[...e.clipboardData.files].filter(file=>file.type.startsWith('image/'));
  if(!images.length)return;
  e.preventDefault();
  autoAttachFeedbackImages(form,images);
});
$('page-automatic-evaluation').addEventListener('input',e=>{
  const form=e.target.closest('.auto-feedback-form');
  if(!form||e.target.type==='file')return;
  const box=form.closest('[data-auto-feedback-case]');
  const values=autoFeedbackValues(form);
  if(e.target.name==='recommendation'){
    const details=form.querySelector('[data-auto-feedback-alternative]');
    details.hidden=details.disabled=values.recommendation_agrees!==false;
  }
  saved(autoFeedbackDraftKey(autoState.job,box.dataset.autoFeedbackCase),values);
  autoScheduleFeedbackSave(autoState.job,box.dataset.autoFeedbackCase);
});
for(const event of ['pointerover','focusin']){
  $('auto-result').addEventListener(event,e=>{
    const button=e.target.closest('[data-shot-prompt]');
    if(button&&!button.contains(e.relatedTarget))autoShotTooltip(button);
  });
}
for(const event of ['pointerout','focusout']){
  $('auto-result').addEventListener(event,e=>{
    const button=e.target.closest('[data-shot-prompt]');
    if(button&&!button.contains(e.relatedTarget))autoShotTooltip(null);
  });
}
window.addEventListener('scroll',()=>{
  if(autoShotAnchor)autoShotTooltip(autoShotAnchor.matches(':hover, :focus-visible')?autoShotAnchor:null);
  autoRepositionFinding();
},{passive:true});
window.addEventListener('resize',autoRepositionFinding);
$('auto-result').addEventListener('pointerover',e=>{
  if(e.pointerType!=='mouse')return;
  if(e.target.closest('.auto-finding-popover'))clearTimeout(autoFindingTimer);
  const anchor=e.target.closest('.auto-finding-trigger');
  if(anchor&&!autoFindingPinned)autoOpenFinding(anchor);
});
$('auto-result').addEventListener('pointerout',e=>{
  if(!autoFindingAnchor||autoFindingPinned||e.pointerType!=='mouse')return;
  const popup=autoFindingAnchor.nextElementSibling;
  if((autoFindingAnchor.contains(e.target)||popup.contains(e.target))
    &&!autoFindingAnchor.contains(e.relatedTarget)&&!popup.contains(e.relatedTarget)){
    clearTimeout(autoFindingTimer);
    autoFindingTimer=setTimeout(autoCloseFinding,180);
  }
});
document.addEventListener('click',e=>{
  const anchor=e.target.closest('.auto-finding-trigger');
  if(anchor){
    if(autoFindingAnchor===anchor&&autoFindingPinned)autoCloseFinding();
    else autoOpenFinding(anchor,true);
  }else if(e.target.closest('.auto-finding-close'))autoCloseFinding(true);
  else if(!e.target.closest('.auto-finding-popover'))autoCloseFinding();
});
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('lightbox').hidden)autoCloseFinding(!!document.activeElement?.closest('.auto-finding-popover'));
});
$('page-automatic-evaluation').addEventListener('submit',e=>{
  if(e.target.matches('.auto-share-feedback-entry')){
    e.preventDefault();
    const name=e.target.elements.name.value.trim();
    if(name)busy(e.submitter,()=>startSharedFeedback(name));
    return;
  }
  if(e.target.matches('.auto-refinement-form')){
    e.preventDefault();
    const supplement=e.target.elements.supplement.value.trim();
    if(e.target.dataset.adoptedFeedbackReply){
      const job=autoState.job;
      const guest=job.audit.shared_feedback.find(row=>row.id===e.target.dataset.adoptedFeedbackReply);
      if(guest&&supplement)busy(e.submitter,()=>autoRefreshSharedVersion(job,guest,false,true,'revise',supplement));
      return;
    }
    if(supplement)busy(e.submitter,()=>autoRefinementAction('revise',supplement));
    return;
  }
  if(!e.target.matches('.auto-feedback-form'))return;
  e.preventDefault();
});
$('page-automatic-evaluation').addEventListener('click',e=>{
  const button=e.target.closest('button[data-action]');
  if(!button)return;
  const action=button.dataset.action;
  if(action==='auto-retry-feedback-save'){
    autoScheduleFeedbackSave(autoState.job,button.closest('[data-auto-feedback-case]').dataset.autoFeedbackCase,0);
    return;
  }
  if(action==='auto-generate-shared-version'){
    const job=autoState.job;
    const guest=job.audit.shared_feedback.find(item=>item.id===button.dataset.reviewer);
    const step=button.dataset.versionStep;
    if(guest)busy(button,()=>autoRefreshSharedVersion(job,guest,!step,Boolean(step),step));
    return;
  }
  if(action==='auto-remove-feedback-image'){
    const form=button.closest('.auto-feedback-form');
    const caseId=form.closest('[data-auto-feedback-case]').dataset.autoFeedbackCase;
    autoUpdateFeedbackImages(form,autoFeedbackImages(autoState.job,caseId).filter((_,i)=>i!==Number(button.dataset.index)));
    return;
  }
  if(action.startsWith('auto-refinement-')){
    if(action==='auto-refinement-view'){
      autoShowFeedbackRefinement();
      if(!autoState.job.feedback_refinement.history.length)busy(button,()=>autoRefinementAction('start'));
      return;
    }
    busy(button,()=>autoRefinementAction(action.slice('auto-refinement-'.length)));
    return;
  }
  if(action==='auto-open')busy(button,()=>autoOpen(button.dataset.id));
  if(action==='auto-case-play'||action==='auto-case-sync')autoShotTooltip(null);
  if(action==='auto-case-play')playAutoEvidence(button);
  if(action==='auto-recommendation-example'){
    const page=autoCasePages().find(row=>row.dataset.autoCasePage===button.dataset.caseId);
    if(!page)return;
    autoShowCase(button.dataset.caseId,true);
    const shot=page.querySelector(`[data-auto-shot-choice][data-shot-index="${CSS.escape(button.dataset.shotIndex)}"]`);
    if(shot)autoSelectShot(page,shot);
    if(button.dataset.time)playAutoEvidence(button,page);
  }
  if(action==='auto-case-step'){
    const pages=autoCasePages();
    const next=pages[pages.findIndex(page=>!page.hidden)+Number(button.dataset.step)];
    if(next)autoShowCase(next.dataset.autoCasePage,true);
  }
  if(action==='auto-case-sync')autoPlayCaseTogether(button);
  if(action==='auto-case-pause'){
    const page=button.closest('[data-auto-case-page]');
    autoStopPlayback(page);
    page.querySelector('[data-auto-play-status]').textContent='';
  }
  if(action==='auto-prompt-original'){
    const box=button.closest('.auto-case-inputs');
    box.dataset.promptLanguage='original';
    autoSetPromptLanguage(box,false);
  }
  if(action==='auto-prompt-translate')busy(button,()=>autoTranslatePrompt(button));
  if(action==='auto-feedback-next')autoFeedbackNext();
  if(action==='auto-feedback-toggle'){
    const expanded=button.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',String(!expanded));
    $('auto-feedback-dock').classList.toggle('is-open',!expanded);
  }
  if(action==='auto-radar-model'){
    const chosen=autoRadarKey(button.dataset.scope,button.dataset.id);
    if(autoState.radarHidden.has(chosen))autoState.radarHidden.delete(chosen);
    else autoState.radarHidden.add(chosen);
    button.setAttribute('aria-pressed',String(!autoState.radarHidden.has(chosen)));
    drawAutoRadar();
  }
  if(action==='auto-copy'){
    const savedInput=autoState.job?.submission;
    if(!savedInput)return;
    if(document.body.classList.contains('auto-report-mode'))autoCloseReport();
    autoState.copied=savedInput;
    $('auto-name').value=savedInput.display_name;
    $('auto-background').value=savedInput.business_background;
    $('auto-focus').value=savedInput.focus.join('\n');
    for(const option of $('auto-datasets').options)option.selected=savedInput.dataset_ids.includes(option.value);
    $('auto-form-panel').open=true;
  }
  if(action==='auto-retry-shots')busy(button,async()=>{
    const key=id('auto');
    const job=await api(AUTO_API+'/'+route(autoState.selected)+'/report-revisions',{job_id:key,idempotency_key:key});
    await autoOpen(job.id); await autoList();
  });
  if(action==='auto-run-realism')busy(button,async()=>{
    const key=id('person-realism');
    const job=await api(AUTO_API+'/'+route(autoState.selected)+'/report-revisions',
      {job_id:key,idempotency_key:key,person_realism:true});
    await autoOpen(job.id); await autoList();
  });
  if(action==='auto-show-trace')busy(button,async()=>{
    const jobId=autoState.selected;
    const traceId=button.dataset.id||$('auto-trace-select')?.value;
    if(!traceId)return;
    const trace=await api(AUTO_API+'/'+route(jobId)+'/trace/'+route(traceId));
    if(autoState.selected!==jobId)return;
    const select=$('auto-trace-select');
    if(select&&[...select.options].some(option=>option.value===traceId))select.value=traceId;
    let panel=$('auto-trace');
    if(!panel){
      panel=document.createElement('div');
      panel.id='auto-trace';
      panel.className='auto-trace-panel';
      if(button.isConnected)button.after(panel);
      else $('auto-result').append(panel);
    }
    panel.dataset.traceId=traceId;
    panel.innerHTML=autoTraceView(trace)+rawDownload(trace,'实际调用记录');
    if(button.dataset.id)panel.scrollIntoView({block:'start'});
  });
});

window.addEventListener('resize',drawAutoRadar);
$('auto-result').addEventListener('toggle',event=>{
  if(event.target.matches('.auto-overall-results')&&event.target.open)requestAnimationFrame(drawAutoRadar);
},true);
window.addEventListener('online',()=>autoRestoreFeedbackDrafts(autoState.job));
window.addEventListener('hashchange',()=>{
  const match=/^#automatic-evaluation(?:=(.+))?$/.exec(location.hash);
  if(!match || SHARE)return;
  autoState.selected=match[1]?decodeURIComponent(match[1]):null;
  switchPage('automatic-evaluation');
  autoSession().catch(error=>notice(errorMessage(error),'error'));
});

init();
