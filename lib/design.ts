import type { HomeConfig } from './home-config';
export function basicDesign(prompt:string,current:HomeConfig){
  const config={...current};const edits:string[]=[];const p=prompt.toLowerCase();
  const set=<K extends keyof HomeConfig>(key:K,value:HomeConfig[K],label:string)=>{config[key]=value;edits.push(label);};
  if(/山间|山地|山居|木屋|alpine|cabin/.test(p))set('architecture','alpine','山间木屋');
  else if(/亭|玻璃屋|玻璃房|pavilion|glass house/.test(p))set('architecture','pavilion','玻璃展亭');
  else if(/庭院|现代|混凝土|courtyard|modern/.test(p))set('architecture','courtyard','现代庭院');
  if(/松|森林|pine|forest/.test(p))set('plants','pine','松林');
  else if(/橄榄|地中海|olive|mediterranean/.test(p))set('plants','olive','橄榄树');
  else if(/柏|cypress/.test(p))set('plants','cypress','柏树');
  if(/夜|星空|night|midnight/.test(p))set('time','night','夜色');
  else if(/日落|黄昏|傍晚|暖光|夕阳|sunset|dusk/.test(p))set('time','sunset','黄昏暖光');
  else if(/白天|清晨|明亮|day|morning/.test(p))set('time','day','日间光线');
  if(/雨后|晴|无雨|不下雨|(?:不要|别|停止|取消|关闭)(?:再)?(?:下)?雨|\b(?:clear|sunny)\b|\b(?:no|without)\s+rain\b|\bstop\s+(?:the\s+)?rain\b/.test(p))set('weather','clear','晴朗天气');
  else if(/雨|rain/.test(p))set('weather','rain','细雨');
  // A wheel finish is independent of the paint colour. Remove wheel-specific
  // colour phrases before looking for a requested body colour.
  const paintPrompt=p.replace(/(?:银色?|黑色?|红色?|蓝色?|绿色?|白色?)\s*(?:的\s*)?(?:轮毂|轮圈|轮胎|轮)|\b(?:silver|black|red|blue|green|white)\s+(?:alloy\s+)?(?:wheels?|rims?|tyres?|tires?)\b/g,'');
  const colors:[RegExp,string,string][]=[[/银|silver/,'#b9c0ba','银色车漆'],[/红|red/,'#9d2927','红色车漆'],[/蓝|blue/,'#466b82','蓝色车漆'],[/绿|green/,'#556b58','绿色车漆'],[/黑色车|黑车|black car/,'#252a29','黑色车漆'],[/白色车|白车|white car/,'#e9e7dc','白色车漆']];
  for(const [pattern,color,label] of colors)if(pattern.test(paintPrompt)){set('carColor',color,label);break;}
  if(/黑(?:色)?(?:的)?轮(?:毂|圈)?|\bblack\s+(?:alloy\s+)?(?:wheels?|rims?)\b/.test(p))set('wheels','black','黑色轮毂');
  else if(/银(?:色)?(?:的)?轮(?:毂|圈)?|\bsilver\s+(?:alloy\s+)?(?:wheels?|rims?)\b/.test(p))set('wheels','silver','银色轮毂');
  return {config,summary:edits.length?'已按关键词布置：'+edits.join('、')+'。':'基础模式暂未识别到场景选项。试试“松林、山间木屋、黄昏、银色车”，或用右侧选项布置。',mode:'basic' as const,aiReady:false};
}
