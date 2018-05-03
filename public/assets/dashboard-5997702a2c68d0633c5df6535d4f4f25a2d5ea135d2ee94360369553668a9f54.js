(function(document,Math,undefined){(function(factory){if(typeof define==="function"&&define.amd){define(["jquery"],factory)}else if(jQuery&&!jQuery.fn.sparkline){factory(jQuery)}})(function($){"use strict";var UNSET_OPTION={},getDefaults,createClass,SPFormat,clipval,quartile,normalizeValue,normalizeValues,remove,isNumber,all,sum,addCSS,ensureArray,formatNumber,RangeMap,MouseHandler,Tooltip,barHighlightMixin,line,bar,tristate,discrete,bullet,pie,box,defaultStyles,initStyles,VShape,VCanvas_base,VCanvas_canvas,VCanvas_vml,pending,shapeCount=0;getDefaults=function(){return{common:{type:"line",lineColor:"#00f",fillColor:"#cdf",defaultPixelsPerValue:3,width:"auto",height:"auto",composite:false,tagValuesAttribute:"values",tagOptionsPrefix:"spark",enableTagOptions:false,enableHighlight:true,highlightLighten:1.4,tooltipSkipNull:true,tooltipPrefix:"",tooltipSuffix:"",disableHiddenCheck:false,numberFormatter:false,numberDigitGroupCount:3,numberDigitGroupSep:",",numberDecimalMark:".",disableTooltips:false,disableInteraction:false},line:{spotColor:"#f80",highlightSpotColor:"#5f5",highlightLineColor:"#f22",spotRadius:1.5,minSpotColor:"#f80",maxSpotColor:"#f80",lineWidth:1,normalRangeMin:undefined,normalRangeMax:undefined,normalRangeColor:"#ccc",drawNormalOnTop:false,chartRangeMin:undefined,chartRangeMax:undefined,chartRangeMinX:undefined,chartRangeMaxX:undefined,tooltipFormat:new SPFormat('<span style="color: {{color}}">&#9679;</span> {{prefix}}{{y}}{{suffix}}')},bar:{barColor:"#3366cc",negBarColor:"#f44",stackedBarColor:["#3366cc","#dc3912","#ff9900","#109618","#66aa00","#dd4477","#0099c6","#990099"],zeroColor:undefined,nullColor:undefined,zeroAxis:true,barWidth:4,barSpacing:1,chartRangeMax:undefined,chartRangeMin:undefined,chartRangeClip:false,colorMap:undefined,tooltipFormat:new SPFormat('<span style="color: {{color}}">&#9679;</span> {{prefix}}{{value}}{{suffix}}')},tristate:{barWidth:4,barSpacing:1,posBarColor:"#6f6",negBarColor:"#f44",zeroBarColor:"#999",colorMap:{},tooltipFormat:new SPFormat('<span style="color: {{color}}">&#9679;</span> {{value:map}}'),tooltipValueLookups:{map:{"-1":"Loss",0:"Draw",1:"Win"}}},discrete:{lineHeight:"auto",thresholdColor:undefined,thresholdValue:0,chartRangeMax:undefined,chartRangeMin:undefined,chartRangeClip:false,tooltipFormat:new SPFormat("{{prefix}}{{value}}{{suffix}}")},bullet:{targetColor:"#f33",targetWidth:3,performanceColor:"#33f",rangeColors:["#d3dafe","#a8b6ff","#7f94ff"],base:undefined,tooltipFormat:new SPFormat("{{fieldkey:fields}} - {{value}}"),tooltipValueLookups:{fields:{r:"Range",p:"Performance",t:"Target"}}},pie:{offset:0,sliceColors:["#3366cc","#dc3912","#ff9900","#109618","#66aa00","#dd4477","#0099c6","#990099"],borderWidth:0,borderColor:"#000",tooltipFormat:new SPFormat('<span style="color: {{color}}">&#9679;</span> {{value}} ({{percent.1}}%)')},box:{raw:false,boxLineColor:"#000",boxFillColor:"#cdf",whiskerColor:"#000",outlierLineColor:"#333",outlierFillColor:"#fff",medianColor:"#f00",showOutliers:true,outlierIQR:1.5,spotRadius:1.5,target:undefined,targetColor:"#4a2",chartRangeMax:undefined,chartRangeMin:undefined,tooltipFormat:new SPFormat("{{field:fields}}: {{value}}"),tooltipFormatFieldlistKey:"field",tooltipValueLookups:{fields:{lq:"Lower Quartile",med:"Median",uq:"Upper Quartile",lo:"Left Outlier",ro:"Right Outlier",lw:"Left Whisker",rw:"Right Whisker"}}}}};defaultStyles=".jqstooltip { "+"position: absolute;"+"left: 0px;"+"top: 0px;"+"visibility: hidden;"+"background: rgb(0, 0, 0) transparent;"+"background-color: rgba(0,0,0,0.6);"+"filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#99000000, endColorstr=#99000000);"+'-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorstr=#99000000, endColorstr=#99000000)";'+"color: white;"+"font: 10px arial, san serif;"+"text-align: left;"+"white-space: nowrap;"+"padding: 5px;"+"border: 1px solid white;"+"box-sizing: content-box;"+"z-index: 10000;"+"}"+".jqsfield { "+"color: white;"+"font: 10px arial, san serif;"+"text-align: left;"+"}";createClass=function(){var Class,args;Class=function(){this.init.apply(this,arguments)};if(arguments.length>1){if(arguments[0]){Class.prototype=$.extend(new arguments[0],arguments[arguments.length-1]);Class._super=arguments[0].prototype}else{Class.prototype=arguments[arguments.length-1]}if(arguments.length>2){args=Array.prototype.slice.call(arguments,1,-1);args.unshift(Class.prototype);$.extend.apply($,args)}}else{Class.prototype=arguments[0]}Class.prototype.cls=Class;return Class};$.SPFormatClass=SPFormat=createClass({fre:/\{\{([\w.]+?)(:(.+?))?\}\}/g,precre:/(\w+)\.(\d+)/,init:function(format,fclass){this.format=format;this.fclass=fclass},render:function(fieldset,lookups,options){var self=this,fields=fieldset,match,token,lookupkey,fieldvalue,prec;return this.format.replace(this.fre,function(){var lookup;token=arguments[1];lookupkey=arguments[3];match=self.precre.exec(token);if(match){prec=match[2];token=match[1]}else{prec=false}fieldvalue=fields[token];if(fieldvalue===undefined){return""}if(lookupkey&&lookups&&lookups[lookupkey]){lookup=lookups[lookupkey];if(lookup.get){return lookups[lookupkey].get(fieldvalue)||fieldvalue}else{return lookups[lookupkey][fieldvalue]||fieldvalue}}if(isNumber(fieldvalue)){if(options.get("numberFormatter")){fieldvalue=options.get("numberFormatter")(fieldvalue)}else{fieldvalue=formatNumber(fieldvalue,prec,options.get("numberDigitGroupCount"),options.get("numberDigitGroupSep"),options.get("numberDecimalMark"))}}return fieldvalue})}});$.spformat=function(format,fclass){return new SPFormat(format,fclass)};clipval=function(val,min,max){if(val<min){return min}if(val>max){return max}return val};quartile=function(values,q){var vl;if(q===2){vl=Math.floor(values.length/2);return values.length%2?values[vl]:(values[vl-1]+values[vl])/2}else{if(values.length%2){vl=(values.length*q+q)/4;return vl%1?(values[Math.floor(vl)]+values[Math.floor(vl)-1])/2:values[vl-1]}else{vl=(values.length*q+2)/4;return vl%1?(values[Math.floor(vl)]+values[Math.floor(vl)-1])/2:values[vl-1]}}};normalizeValue=function(val){var nf;switch(val){case"undefined":val=undefined;break;case"null":val=null;break;case"true":val=true;break;case"false":val=false;break;default:nf=parseFloat(val);if(val==nf){val=nf}}return val};normalizeValues=function(vals){var i,result=[];for(i=vals.length;i--;){result[i]=normalizeValue(vals[i])}return result};remove=function(vals,filter){var i,vl,result=[];for(i=0,vl=vals.length;i<vl;i++){if(vals[i]!==filter){result.push(vals[i])}}return result};isNumber=function(num){return!isNaN(parseFloat(num))&&isFinite(num)};formatNumber=function(num,prec,groupsize,groupsep,decsep){var p,i;num=(prec===false?parseFloat(num).toString():num.toFixed(prec)).split("");p=(p=$.inArray(".",num))<0?num.length:p;if(p<num.length){num[p]=decsep}for(i=p-groupsize;i>0;i-=groupsize){num.splice(i,0,groupsep)}return num.join("")};all=function(val,arr,ignoreNull){var i;for(i=arr.length;i--;){if(ignoreNull&&arr[i]===null)continue;if(arr[i]!==val){return false}}return true};sum=function(vals){var total=0,i;for(i=vals.length;i--;){total+=typeof vals[i]==="number"?vals[i]:0}return total};ensureArray=function(val){return $.isArray(val)?val:[val]};addCSS=function(css){var tag,iefail;if(document.createStyleSheet){try{document.createStyleSheet().cssText=css;return}catch(e){iefail=true}}tag=document.createElement("style");tag.type="text/css";document.getElementsByTagName("head")[0].appendChild(tag);if(iefail){document.styleSheets[document.styleSheets.length-1].cssText=css}else{tag[typeof document.body.style.WebkitAppearance=="string"?"innerText":"innerHTML"]=css}};$.fn.simpledraw=function(width,height,useExisting,interact){var target,mhandler;if(useExisting&&(target=this.data("_jqs_vcanvas"))){return target}if($.fn.sparkline.canvas===false){return false}else if($.fn.sparkline.canvas===undefined){var el=document.createElement("canvas");if(!!(el.getContext&&el.getContext("2d"))){$.fn.sparkline.canvas=function(width,height,target,interact){return new VCanvas_canvas(width,height,target,interact)}}else if(document.namespaces&&!document.namespaces.v){document.namespaces.add("v","urn:schemas-microsoft-com:vml","#default#VML");$.fn.sparkline.canvas=function(width,height,target,interact){return new VCanvas_vml(width,height,target)}}else{$.fn.sparkline.canvas=false;return false}}if(width===undefined){width=$(this).innerWidth()}if(height===undefined){height=$(this).innerHeight()}target=$.fn.sparkline.canvas(width,height,this,interact);mhandler=$(this).data("_jqs_mhandler");if(mhandler){mhandler.registerCanvas(target)}return target};$.fn.cleardraw=function(){var target=this.data("_jqs_vcanvas");if(target){target.reset()}};$.RangeMapClass=RangeMap=createClass({init:function(map){var key,range,rangelist=[];for(key in map){if(map.hasOwnProperty(key)&&typeof key==="string"&&key.indexOf(":")>-1){range=key.split(":");range[0]=range[0].length===0?-Infinity:parseFloat(range[0]);range[1]=range[1].length===0?Infinity:parseFloat(range[1]);range[2]=map[key];rangelist.push(range)}}this.map=map;this.rangelist=rangelist||false},get:function(value){var rangelist=this.rangelist,i,range,result;if((result=this.map[value])!==undefined){return result}if(rangelist){for(i=rangelist.length;i--;){range=rangelist[i];if(range[0]<=value&&range[1]>=value){return range[2]}}}return undefined}});$.range_map=function(map){return new RangeMap(map)};MouseHandler=createClass({init:function(el,options){var $el=$(el);this.$el=$el;this.options=options;this.currentPageX=0;this.currentPageY=0;this.el=el;this.splist=[];this.tooltip=null;this.over=false;this.displayTooltips=!options.get("disableTooltips");this.highlightEnabled=!options.get("disableHighlight")},registerSparkline:function(sp){this.splist.push(sp);if(this.over){this.updateDisplay()}},registerCanvas:function(canvas){var $canvas=$(canvas.canvas);this.canvas=canvas;this.$canvas=$canvas;$canvas.mouseenter($.proxy(this.mouseenter,this));$canvas.mouseleave($.proxy(this.mouseleave,this));$canvas.click($.proxy(this.mouseclick,this))},reset:function(removeTooltip){this.splist=[];if(this.tooltip&&removeTooltip){this.tooltip.remove();this.tooltip=undefined}},mouseclick:function(e){var clickEvent=$.Event("sparklineClick");clickEvent.originalEvent=e;clickEvent.sparklines=this.splist;this.$el.trigger(clickEvent)},mouseenter:function(e){$(document.body).unbind("mousemove.jqs");$(document.body).bind("mousemove.jqs",$.proxy(this.mousemove,this));this.over=true;this.currentPageX=e.pageX;this.currentPageY=e.pageY;this.currentEl=e.target;if(!this.tooltip&&this.displayTooltips){this.tooltip=new Tooltip(this.options);this.tooltip.updatePosition(e.pageX,e.pageY)}this.updateDisplay()},mouseleave:function(){$(document.body).unbind("mousemove.jqs");var splist=this.splist,spcount=splist.length,needsRefresh=false,sp,i;this.over=false;this.currentEl=null;if(this.tooltip){this.tooltip.remove();this.tooltip=null}for(i=0;i<spcount;i++){sp=splist[i];if(sp.clearRegionHighlight()){needsRefresh=true}}if(needsRefresh){this.canvas.render()}},mousemove:function(e){this.currentPageX=e.pageX;this.currentPageY=e.pageY;this.currentEl=e.target;if(this.tooltip){this.tooltip.updatePosition(e.pageX,e.pageY)}this.updateDisplay()},updateDisplay:function(){var splist=this.splist,spcount=splist.length,needsRefresh=false,offset=this.$canvas.offset(),localX=this.currentPageX-offset.left,localY=this.currentPageY-offset.top,tooltiphtml,sp,i,result,changeEvent;if(!this.over){return}for(i=0;i<spcount;i++){sp=splist[i];result=sp.setRegionHighlight(this.currentEl,localX,localY);if(result){needsRefresh=true}}if(needsRefresh){changeEvent=$.Event("sparklineRegionChange");changeEvent.sparklines=this.splist;this.$el.trigger(changeEvent);if(this.tooltip){tooltiphtml="";for(i=0;i<spcount;i++){sp=splist[i];tooltiphtml+=sp.getCurrentRegionTooltip()}this.tooltip.setContent(tooltiphtml)}if(!this.disableHighlight){this.canvas.render()}}if(result===null){this.mouseleave()}}});Tooltip=createClass({sizeStyle:"position: static !important;"+"display: block !important;"+"visibility: hidden !important;"+"float: left !important;",init:function(options){var tooltipClassname=options.get("tooltipClassname","jqstooltip"),sizetipStyle=this.sizeStyle,offset;this.container=options.get("tooltipContainer")||document.body;this.tooltipOffsetX=options.get("tooltipOffsetX",10);this.tooltipOffsetY=options.get("tooltipOffsetY",12);$("#jqssizetip").remove();$("#jqstooltip").remove();this.sizetip=$("<div/>",{id:"jqssizetip",style:sizetipStyle,"class":tooltipClassname});this.tooltip=$("<div/>",{id:"jqstooltip","class":tooltipClassname}).appendTo(this.container);offset=this.tooltip.offset();this.offsetLeft=offset.left;this.offsetTop=offset.top;this.hidden=true;$(window).unbind("resize.jqs scroll.jqs");$(window).bind("resize.jqs scroll.jqs",$.proxy(this.updateWindowDims,this));this.updateWindowDims()},updateWindowDims:function(){this.scrollTop=$(window).scrollTop();this.scrollLeft=$(window).scrollLeft();this.scrollRight=this.scrollLeft+$(window).width();this.updatePosition()},getSize:function(content){this.sizetip.html(content).appendTo(this.container);this.width=this.sizetip.width()+1;this.height=this.sizetip.height();this.sizetip.remove()},setContent:function(content){if(!content){this.tooltip.css("visibility","hidden");this.hidden=true;return}this.getSize(content);this.tooltip.html(content).css({width:this.width,height:this.height,visibility:"visible"});if(this.hidden){this.hidden=false;this.updatePosition()}},updatePosition:function(x,y){if(x===undefined){if(this.mousex===undefined){return}x=this.mousex-this.offsetLeft;y=this.mousey-this.offsetTop}else{this.mousex=x=x-this.offsetLeft;this.mousey=y=y-this.offsetTop}if(!this.height||!this.width||this.hidden){return}y-=this.height+this.tooltipOffsetY;x+=this.tooltipOffsetX;if(y<this.scrollTop){y=this.scrollTop}if(x<this.scrollLeft){x=this.scrollLeft}else if(x+this.width>this.scrollRight){x=this.scrollRight-this.width}this.tooltip.css({left:x,top:y})},remove:function(){this.tooltip.remove();this.sizetip.remove();this.sizetip=this.tooltip=undefined;$(window).unbind("resize.jqs scroll.jqs")}});initStyles=function(){addCSS(defaultStyles)};$(initStyles);pending=[];$.fn.sparkline=function(userValues,userOptions){return this.each(function(){var options=new $.fn.sparkline.options(this,userOptions),$this=$(this),render,i;render=function(){var values,width,height,tmp,mhandler,sp,vals;if(userValues==="html"||userValues===undefined){vals=this.getAttribute(options.get("tagValuesAttribute"));if(vals===undefined||vals===null){vals=$this.html()}values=vals.replace(/(^\s*<!--)|(-->\s*$)|\s+/g,"").split(",")}else{values=userValues}width=options.get("width")==="auto"?values.length*options.get("defaultPixelsPerValue"):options.get("width");if(options.get("height")==="auto"){if(!options.get("composite")||!$.data(this,"_jqs_vcanvas")){tmp=document.createElement("span");tmp.innerHTML="a";$this.html(tmp);height=$(tmp).innerHeight()||$(tmp).height();$(tmp).remove();tmp=null}}else{height=options.get("height")}if(!options.get("disableInteraction")){mhandler=$.data(this,"_jqs_mhandler");if(!mhandler){mhandler=new MouseHandler(this,options);$.data(this,"_jqs_mhandler",mhandler)}else if(!options.get("composite")){mhandler.reset()}}else{mhandler=false}if(options.get("composite")&&!$.data(this,"_jqs_vcanvas")){if(!$.data(this,"_jqs_errnotify")){alert("Attempted to attach a composite sparkline to an element with no existing sparkline");$.data(this,"_jqs_errnotify",true)}return}sp=new($.fn.sparkline[options.get("type")])(this,values,options,width,height);sp.render();if(mhandler){mhandler.registerSparkline(sp)}};if($(this).html()&&!options.get("disableHiddenCheck")&&$(this).is(":hidden")||!$(this).parents("body").length){if(!options.get("composite")&&$.data(this,"_jqs_pending")){for(i=pending.length;i;i--){if(pending[i-1][0]==this){pending.splice(i-1,1)}}}pending.push([this,render]);$.data(this,"_jqs_pending",true)}else{render.call(this)}})};$.fn.sparkline.defaults=getDefaults();$.sparkline_display_visible=function(){var el,i,pl;var done=[];for(i=0,pl=pending.length;i<pl;i++){el=pending[i][0];if($(el).is(":visible")&&!$(el).parents().is(":hidden")){pending[i][1].call(el);$.data(pending[i][0],"_jqs_pending",false);done.push(i)}else if(!$(el).closest("html").length&&!$.data(el,"_jqs_pending")){$.data(pending[i][0],"_jqs_pending",false);done.push(i)}}for(i=done.length;i;i--){pending.splice(done[i-1],1)}};$.fn.sparkline.options=createClass({init:function(tag,userOptions){var extendedOptions,defaults,base,tagOptionType;this.userOptions=userOptions=userOptions||{};this.tag=tag;this.tagValCache={};defaults=$.fn.sparkline.defaults;base=defaults.common;this.tagOptionsPrefix=userOptions.enableTagOptions&&(userOptions.tagOptionsPrefix||base.tagOptionsPrefix);tagOptionType=this.getTagSetting("type");if(tagOptionType===UNSET_OPTION){extendedOptions=defaults[userOptions.type||base.type]}else{extendedOptions=defaults[tagOptionType]}this.mergedOptions=$.extend({},base,extendedOptions,userOptions)},getTagSetting:function(key){var prefix=this.tagOptionsPrefix,val,i,pairs,keyval;if(prefix===false||prefix===undefined){return UNSET_OPTION}if(this.tagValCache.hasOwnProperty(key)){val=this.tagValCache.key}else{val=this.tag.getAttribute(prefix+key);if(val===undefined||val===null){val=UNSET_OPTION}else if(val.substr(0,1)==="["){val=val.substr(1,val.length-2).split(",");for(i=val.length;i--;){val[i]=normalizeValue(val[i].replace(/(^\s*)|(\s*$)/g,""))}}else if(val.substr(0,1)==="{"){pairs=val.substr(1,val.length-2).split(",");val={};for(i=pairs.length;i--;){keyval=pairs[i].split(":",2);val[keyval[0].replace(/(^\s*)|(\s*$)/g,"")]=normalizeValue(keyval[1].replace(/(^\s*)|(\s*$)/g,""))}}else{val=normalizeValue(val)}this.tagValCache.key=val}return val},get:function(key,defaultval){var tagOption=this.getTagSetting(key),result;if(tagOption!==UNSET_OPTION){return tagOption}return(result=this.mergedOptions[key])===undefined?defaultval:result}});$.fn.sparkline._base=createClass({disabled:false,init:function(el,values,options,width,height){this.el=el;this.$el=$(el);this.values=values;this.options=options;this.width=width;this.height=height;this.currentRegion=undefined},initTarget:function(){var interactive=!this.options.get("disableInteraction");if(!(this.target=this.$el.simpledraw(this.width,this.height,this.options.get("composite"),interactive))){this.disabled=true}else{this.canvasWidth=this.target.pixelWidth;this.canvasHeight=this.target.pixelHeight}},render:function(){if(this.disabled){this.el.innerHTML="";return false}return true},getRegion:function(x,y){},setRegionHighlight:function(el,x,y){var currentRegion=this.currentRegion,highlightEnabled=!this.options.get("disableHighlight"),newRegion;if(x>this.canvasWidth||y>this.canvasHeight||x<0||y<0){return null}newRegion=this.getRegion(el,x,y);if(currentRegion!==newRegion){if(currentRegion!==undefined&&highlightEnabled){this.removeHighlight()}this.currentRegion=newRegion;if(newRegion!==undefined&&highlightEnabled){this.renderHighlight()}return true}return false},clearRegionHighlight:function(){if(this.currentRegion!==undefined){this.removeHighlight();this.currentRegion=undefined;return true}return false},renderHighlight:function(){this.changeHighlight(true)},removeHighlight:function(){this.changeHighlight(false)},changeHighlight:function(highlight){},getCurrentRegionTooltip:function(){var options=this.options,header="",entries=[],fields,formats,formatlen,fclass,text,i,showFields,showFieldsKey,newFields,fv,formatter,format,fieldlen,j;if(this.currentRegion===undefined){return""}fields=this.getCurrentRegionFields();formatter=options.get("tooltipFormatter");if(formatter){return formatter(this,options,fields)}if(options.get("tooltipChartTitle")){header+='<div class="jqs jqstitle">'+options.get("tooltipChartTitle")+"</div>\n"}formats=this.options.get("tooltipFormat");if(!formats){return""}if(!$.isArray(formats)){formats=[formats]}if(!$.isArray(fields)){fields=[fields]}showFields=this.options.get("tooltipFormatFieldlist");showFieldsKey=this.options.get("tooltipFormatFieldlistKey");if(showFields&&showFieldsKey){newFields=[];for(i=fields.length;i--;){fv=fields[i][showFieldsKey];if((j=$.inArray(fv,showFields))!=-1){newFields[j]=fields[i]}}fields=newFields}formatlen=formats.length;fieldlen=fields.length;for(i=0;i<formatlen;i++){format=formats[i];if(typeof format==="string"){format=new SPFormat(format)}fclass=format.fclass||"jqsfield";for(j=0;j<fieldlen;j++){if(!fields[j].isNull||!options.get("tooltipSkipNull")){$.extend(fields[j],{prefix:options.get("tooltipPrefix"),suffix:options.get("tooltipSuffix")});text=format.render(fields[j],options.get("tooltipValueLookups"),options);entries.push('<div class="'+fclass+'">'+text+"</div>")}}}if(entries.length){return header+entries.join("\n")}return""},getCurrentRegionFields:function(){},calcHighlightColor:function(color,options){var highlightColor=options.get("highlightColor"),lighten=options.get("highlightLighten"),parse,mult,rgbnew,i;if(highlightColor){return highlightColor}if(lighten){parse=/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(color)||/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);if(parse){rgbnew=[];mult=color.length===4?16:1;for(i=0;i<3;i++){rgbnew[i]=clipval(Math.round(parseInt(parse[i+1],16)*mult*lighten),0,255)}return"rgb("+rgbnew.join(",")+")"}}return color}});barHighlightMixin={changeHighlight:function(highlight){var currentRegion=this.currentRegion,target=this.target,shapeids=this.regionShapes[currentRegion],newShapes;if(shapeids){newShapes=this.renderRegion(currentRegion,highlight);if($.isArray(newShapes)||$.isArray(shapeids)){target.replaceWithShapes(shapeids,newShapes);this.regionShapes[currentRegion]=$.map(newShapes,function(newShape){return newShape.id})}else{target.replaceWithShape(shapeids,newShapes);this.regionShapes[currentRegion]=newShapes.id}}},render:function(){var values=this.values,target=this.target,regionShapes=this.regionShapes,shapes,ids,i,j;if(!this.cls._super.render.call(this)){return}for(i=values.length;i--;){shapes=this.renderRegion(i);if(shapes){if($.isArray(shapes)){ids=[];for(j=shapes.length;j--;){shapes[j].append();ids.push(shapes[j].id)}regionShapes[i]=ids}else{shapes.append();regionShapes[i]=shapes.id}}else{regionShapes[i]=null}}target.render()}};$.fn.sparkline.line=line=createClass($.fn.sparkline._base,{type:"line",init:function(el,values,options,width,height){line._super.init.call(this,el,values,options,width,height);this.vertices=[];this.regionMap=[];this.xvalues=[];this.yvalues=[];this.yminmax=[];this.hightlightSpotId=null;this.lastShapeId=null;this.initTarget()},getRegion:function(el,x,y){var i,regionMap=this.regionMap;for(i=regionMap.length;i--;){if(regionMap[i]!==null&&x>=regionMap[i][0]&&x<=regionMap[i][1]){return regionMap[i][2]}}return undefined},getCurrentRegionFields:function(){var currentRegion=this.currentRegion;return{isNull:this.yvalues[currentRegion]===null,x:this.xvalues[currentRegion],y:this.yvalues[currentRegion],color:this.options.get("lineColor"),fillColor:this.options.get("fillColor"),offset:currentRegion}},renderHighlight:function(){var currentRegion=this.currentRegion,target=this.target,vertex=this.vertices[currentRegion],options=this.options,spotRadius=options.get("spotRadius"),highlightSpotColor=options.get("highlightSpotColor"),highlightLineColor=options.get("highlightLineColor"),highlightSpot,highlightLine;if(!vertex){return}if(spotRadius&&highlightSpotColor){highlightSpot=target.drawCircle(vertex[0],vertex[1],spotRadius,undefined,highlightSpotColor);this.highlightSpotId=highlightSpot.id;target.insertAfterShape(this.lastShapeId,highlightSpot)}if(highlightLineColor){highlightLine=target.drawLine(vertex[0],this.canvasTop,vertex[0],this.canvasTop+this.canvasHeight,highlightLineColor);this.highlightLineId=highlightLine.id;target.insertAfterShape(this.lastShapeId,highlightLine)}},removeHighlight:function(){var target=this.target;if(this.highlightSpotId){target.removeShapeId(this.highlightSpotId);this.highlightSpotId=null}if(this.highlightLineId){target.removeShapeId(this.highlightLineId);this.highlightLineId=null}},scanValues:function(){var values=this.values,valcount=values.length,xvalues=this.xvalues,yvalues=this.yvalues,yminmax=this.yminmax,i,val,isStr,isArray,sp;for(i=0;i<valcount;i++){val=values[i];isStr=typeof values[i]==="string";isArray=typeof values[i]==="object"&&values[i]instanceof Array;sp=isStr&&values[i].split(":");if(isStr&&sp.length===2){xvalues.push(Number(sp[0]));yvalues.push(Number(sp[1]));yminmax.push(Number(sp[1]))}else if(isArray){xvalues.push(val[0]);yvalues.push(val[1]);yminmax.push(val[1])}else{xvalues.push(i);if(values[i]===null||values[i]==="null"){yvalues.push(null)}else{yvalues.push(Number(val));yminmax.push(Number(val))}}}if(this.options.get("xvalues")){xvalues=this.options.get("xvalues")}this.maxy=this.maxyorg=Math.max.apply(Math,yminmax);this.miny=this.minyorg=Math.min.apply(Math,yminmax);this.maxx=Math.max.apply(Math,xvalues);this.minx=Math.min.apply(Math,xvalues);this.xvalues=xvalues;this.yvalues=yvalues;this.yminmax=yminmax},processRangeOptions:function(){var options=this.options,normalRangeMin=options.get("normalRangeMin"),normalRangeMax=options.get("normalRangeMax");if(normalRangeMin!==undefined){if(normalRangeMin<this.miny){this.miny=normalRangeMin}if(normalRangeMax>this.maxy){this.maxy=normalRangeMax}}if(options.get("chartRangeMin")!==undefined&&(options.get("chartRangeClip")||options.get("chartRangeMin")<this.miny)){this.miny=options.get("chartRangeMin")}if(options.get("chartRangeMax")!==undefined&&(options.get("chartRangeClip")||options.get("chartRangeMax")>this.maxy)){this.maxy=options.get("chartRangeMax")}if(options.get("chartRangeMinX")!==undefined&&(options.get("chartRangeClipX")||options.get("chartRangeMinX")<this.minx)){this.minx=options.get("chartRangeMinX")}if(options.get("chartRangeMaxX")!==undefined&&(options.get("chartRangeClipX")||options.get("chartRangeMaxX")>this.maxx)){this.maxx=options.get("chartRangeMaxX")}},drawNormalRange:function(canvasLeft,canvasTop,canvasHeight,canvasWidth,rangey){var normalRangeMin=this.options.get("normalRangeMin"),normalRangeMax=this.options.get("normalRangeMax"),ytop=canvasTop+Math.round(canvasHeight-canvasHeight*((normalRangeMax-this.miny)/rangey)),height=Math.round(canvasHeight*(normalRangeMax-normalRangeMin)/rangey);this.target.drawRect(canvasLeft,ytop,canvasWidth,height,undefined,this.options.get("normalRangeColor")).append()},render:function(){var options=this.options,target=this.target,canvasWidth=this.canvasWidth,canvasHeight=this.canvasHeight,vertices=this.vertices,spotRadius=options.get("spotRadius"),regionMap=this.regionMap,rangex,rangey,yvallast,canvasTop,canvasLeft,vertex,path,paths,x,y,xnext,xpos,xposnext,last,next,yvalcount,lineShapes,fillShapes,plen,valueSpots,hlSpotsEnabled,color,xvalues,yvalues,i;if(!line._super.render.call(this)){return}this.scanValues();this.processRangeOptions();xvalues=this.xvalues;yvalues=this.yvalues;if(!this.yminmax.length||this.yvalues.length<2){return}canvasTop=canvasLeft=0;rangex=this.maxx-this.minx===0?1:this.maxx-this.minx;rangey=this.maxy-this.miny===0?1:this.maxy-this.miny;yvallast=this.yvalues.length-1;if(spotRadius&&(canvasWidth<spotRadius*4||canvasHeight<spotRadius*4)){spotRadius=0}if(spotRadius){hlSpotsEnabled=options.get("highlightSpotColor")&&!options.get("disableInteraction");if(hlSpotsEnabled||options.get("minSpotColor")||options.get("spotColor")&&yvalues[yvallast]===this.miny){canvasHeight-=Math.ceil(spotRadius)}if(hlSpotsEnabled||options.get("maxSpotColor")||options.get("spotColor")&&yvalues[yvallast]===this.maxy){canvasHeight-=Math.ceil(spotRadius);canvasTop+=Math.ceil(spotRadius)}if(hlSpotsEnabled||(options.get("minSpotColor")||options.get("maxSpotColor"))&&(yvalues[0]===this.miny||yvalues[0]===this.maxy)){canvasLeft+=Math.ceil(spotRadius);canvasWidth-=Math.ceil(spotRadius)}if(hlSpotsEnabled||options.get("spotColor")||(options.get("minSpotColor")||options.get("maxSpotColor")&&(yvalues[yvallast]===this.miny||yvalues[yvallast]===this.maxy))){canvasWidth-=Math.ceil(spotRadius)}}canvasHeight--;if(options.get("normalRangeMin")!==undefined&&!options.get("drawNormalOnTop")){this.drawNormalRange(canvasLeft,canvasTop,canvasHeight,canvasWidth,rangey)}path=[];paths=[path];last=next=null;yvalcount=yvalues.length;for(i=0;i<yvalcount;i++){x=xvalues[i];xnext=xvalues[i+1];y=yvalues[i];xpos=canvasLeft+Math.round((x-this.minx)*(canvasWidth/rangex));xposnext=i<yvalcount-1?canvasLeft+Math.round((xnext-this.minx)*(canvasWidth/rangex)):canvasWidth;next=xpos+(xposnext-xpos)/2;regionMap[i]=[last||0,next,i];last=next;if(y===null){if(i){if(yvalues[i-1]!==null){path=[];paths.push(path)}vertices.push(null)}}else{if(y<this.miny){y=this.miny}if(y>this.maxy){y=this.maxy}if(!path.length){path.push([xpos,canvasTop+canvasHeight])}vertex=[xpos,canvasTop+Math.round(canvasHeight-canvasHeight*((y-this.miny)/rangey))];path.push(vertex);vertices.push(vertex)}}lineShapes=[];fillShapes=[];plen=paths.length;for(i=0;i<plen;i++){path=paths[i];if(path.length){if(options.get("fillColor")){path.push([path[path.length-1][0],canvasTop+canvasHeight]);fillShapes.push(path.slice(0));path.pop()}if(path.length>2){path[0]=[path[0][0],path[1][1]]}lineShapes.push(path)}}plen=fillShapes.length;for(i=0;i<plen;i++){target.drawShape(fillShapes[i],options.get("fillColor"),options.get("fillColor")).append()}if(options.get("normalRangeMin")!==undefined&&options.get("drawNormalOnTop")){this.drawNormalRange(canvasLeft,canvasTop,canvasHeight,canvasWidth,rangey)}plen=lineShapes.length;for(i=0;i<plen;i++){target.drawShape(lineShapes[i],options.get("lineColor"),undefined,options.get("lineWidth")).append()}if(spotRadius&&options.get("valueSpots")){valueSpots=options.get("valueSpots");if(valueSpots.get===undefined){valueSpots=new RangeMap(valueSpots)}for(i=0;i<yvalcount;i++){color=valueSpots.get(yvalues[i]);if(color){target.drawCircle(canvasLeft+Math.round((xvalues[i]-this.minx)*(canvasWidth/rangex)),canvasTop+Math.round(canvasHeight-canvasHeight*((yvalues[i]-this.miny)/rangey)),spotRadius,undefined,color).append()}}}if(spotRadius&&options.get("spotColor")&&yvalues[yvallast]!==null){target.drawCircle(canvasLeft+Math.round((xvalues[xvalues.length-1]-this.minx)*(canvasWidth/rangex)),canvasTop+Math.round(canvasHeight-canvasHeight*((yvalues[yvallast]-this.miny)/rangey)),spotRadius,undefined,options.get("spotColor")).append()}if(this.maxy!==this.minyorg){if(spotRadius&&options.get("minSpotColor")){x=xvalues[$.inArray(this.minyorg,yvalues)];target.drawCircle(canvasLeft+Math.round((x-this.minx)*(canvasWidth/rangex)),canvasTop+Math.round(canvasHeight-canvasHeight*((this.minyorg-this.miny)/rangey)),spotRadius,undefined,options.get("minSpotColor")).append()}if(spotRadius&&options.get("maxSpotColor")){x=xvalues[$.inArray(this.maxyorg,yvalues)];target.drawCircle(canvasLeft+Math.round((x-this.minx)*(canvasWidth/rangex)),canvasTop+Math.round(canvasHeight-canvasHeight*((this.maxyorg-this.miny)/rangey)),spotRadius,undefined,options.get("maxSpotColor")).append()}}this.lastShapeId=target.getLastShapeId();this.canvasTop=canvasTop;target.render()}});$.fn.sparkline.bar=bar=createClass($.fn.sparkline._base,barHighlightMixin,{type:"bar",init:function(el,values,options,width,height){var barWidth=parseInt(options.get("barWidth"),10),barSpacing=parseInt(options.get("barSpacing"),10),chartRangeMin=options.get("chartRangeMin"),chartRangeMax=options.get("chartRangeMax"),chartRangeClip=options.get("chartRangeClip"),stackMin=Infinity,stackMax=-Infinity,isStackString,groupMin,groupMax,stackRanges,numValues,i,vlen,range,zeroAxis,xaxisOffset,min,max,clipMin,clipMax,stacked,vlist,j,slen,svals,val,yoffset,yMaxCalc,canvasHeightEf;bar._super.init.call(this,el,values,options,width,height);for(i=0,vlen=values.length;i<vlen;i++){val=values[i];isStackString=typeof val==="string"&&val.indexOf(":")>-1;if(isStackString||$.isArray(val)){stacked=true;if(isStackString){val=values[i]=normalizeValues(val.split(":"));
}val=remove(val,null);groupMin=Math.min.apply(Math,val);groupMax=Math.max.apply(Math,val);if(groupMin<stackMin){stackMin=groupMin}if(groupMax>stackMax){stackMax=groupMax}}}this.stacked=stacked;this.regionShapes={};this.barWidth=barWidth;this.barSpacing=barSpacing;this.totalBarWidth=barWidth+barSpacing;this.width=width=values.length*barWidth+(values.length-1)*barSpacing;this.initTarget();if(chartRangeClip){clipMin=chartRangeMin===undefined?-Infinity:chartRangeMin;clipMax=chartRangeMax===undefined?Infinity:chartRangeMax}numValues=[];stackRanges=stacked?[]:numValues;var stackTotals=[];var stackRangesNeg=[];for(i=0,vlen=values.length;i<vlen;i++){if(stacked){vlist=values[i];values[i]=svals=[];stackTotals[i]=0;stackRanges[i]=stackRangesNeg[i]=0;for(j=0,slen=vlist.length;j<slen;j++){val=svals[j]=chartRangeClip?clipval(vlist[j],clipMin,clipMax):vlist[j];if(val!==null){if(val>0){stackTotals[i]+=val}if(stackMin<0&&stackMax>0){if(val<0){stackRangesNeg[i]+=Math.abs(val)}else{stackRanges[i]+=val}}else{stackRanges[i]+=Math.abs(val-(val<0?stackMax:stackMin))}numValues.push(val)}}}else{val=chartRangeClip?clipval(values[i],clipMin,clipMax):values[i];val=values[i]=normalizeValue(val);if(val!==null){numValues.push(val)}}}this.max=max=Math.max.apply(Math,numValues);this.min=min=Math.min.apply(Math,numValues);this.stackMax=stackMax=stacked?Math.max.apply(Math,stackTotals):max;this.stackMin=stackMin=stacked?Math.min.apply(Math,numValues):min;if(options.get("chartRangeMin")!==undefined&&(options.get("chartRangeClip")||options.get("chartRangeMin")<min)){min=options.get("chartRangeMin")}if(options.get("chartRangeMax")!==undefined&&(options.get("chartRangeClip")||options.get("chartRangeMax")>max)){max=options.get("chartRangeMax")}this.zeroAxis=zeroAxis=options.get("zeroAxis",true);if(min<=0&&max>=0&&zeroAxis){xaxisOffset=0}else if(zeroAxis==false){xaxisOffset=min}else if(min>0){xaxisOffset=min}else{xaxisOffset=max}this.xaxisOffset=xaxisOffset;range=stacked?Math.max.apply(Math,stackRanges)+Math.max.apply(Math,stackRangesNeg):max-min;this.canvasHeightEf=zeroAxis&&min<0?this.canvasHeight-2:this.canvasHeight-1;if(min<xaxisOffset){yMaxCalc=stacked&&max>=0?stackMax:max;yoffset=(yMaxCalc-xaxisOffset)/range*this.canvasHeight;if(yoffset!==Math.ceil(yoffset)){this.canvasHeightEf-=2;yoffset=Math.ceil(yoffset)}}else{yoffset=this.canvasHeight}this.yoffset=yoffset;if($.isArray(options.get("colorMap"))){this.colorMapByIndex=options.get("colorMap");this.colorMapByValue=null}else{this.colorMapByIndex=null;this.colorMapByValue=options.get("colorMap");if(this.colorMapByValue&&this.colorMapByValue.get===undefined){this.colorMapByValue=new RangeMap(this.colorMapByValue)}}this.range=range},getRegion:function(el,x,y){var result=Math.floor(x/this.totalBarWidth);return result<0||result>=this.values.length?undefined:result},getCurrentRegionFields:function(){var currentRegion=this.currentRegion,values=ensureArray(this.values[currentRegion]),result=[],value,i;for(i=values.length;i--;){value=values[i];result.push({isNull:value===null,value:value,color:this.calcColor(i,value,currentRegion),offset:currentRegion})}return result},calcColor:function(stacknum,value,valuenum){var colorMapByIndex=this.colorMapByIndex,colorMapByValue=this.colorMapByValue,options=this.options,color,newColor;if(this.stacked){color=options.get("stackedBarColor")}else{color=value<0?options.get("negBarColor"):options.get("barColor")}if(value===0&&options.get("zeroColor")!==undefined){color=options.get("zeroColor")}if(colorMapByValue&&(newColor=colorMapByValue.get(value))){color=newColor}else if(colorMapByIndex&&colorMapByIndex.length>valuenum){color=colorMapByIndex[valuenum]}return $.isArray(color)?color[stacknum%color.length]:color},renderRegion:function(valuenum,highlight){var vals=this.values[valuenum],options=this.options,xaxisOffset=this.xaxisOffset,result=[],range=this.range,stacked=this.stacked,target=this.target,x=valuenum*this.totalBarWidth,canvasHeightEf=this.canvasHeightEf,yoffset=this.yoffset,y,height,color,isNull,yoffsetNeg,i,valcount,val,minPlotted,allMin;vals=$.isArray(vals)?vals:[vals];valcount=vals.length;val=vals[0];isNull=all(null,vals);allMin=all(xaxisOffset,vals,true);if(isNull){if(options.get("nullColor")){color=highlight?options.get("nullColor"):this.calcHighlightColor(options.get("nullColor"),options);y=yoffset>0?yoffset-1:yoffset;return target.drawRect(x,y,this.barWidth-1,0,color,color)}else{return undefined}}yoffsetNeg=yoffset;for(i=0;i<valcount;i++){val=vals[i];if(stacked&&val===xaxisOffset){if(!allMin||minPlotted){continue}minPlotted=true}if(range>0){height=Math.floor(canvasHeightEf*(Math.abs(val-xaxisOffset)/range))+1}else{height=1}if(val<xaxisOffset||val===xaxisOffset&&yoffset===0){y=yoffsetNeg;yoffsetNeg+=height}else{y=yoffset-height;yoffset-=height}color=this.calcColor(i,val,valuenum);if(highlight){color=this.calcHighlightColor(color,options)}result.push(target.drawRect(x,y,this.barWidth-1,height-1,color,color))}if(result.length===1){return result[0]}return result}});$.fn.sparkline.tristate=tristate=createClass($.fn.sparkline._base,barHighlightMixin,{type:"tristate",init:function(el,values,options,width,height){var barWidth=parseInt(options.get("barWidth"),10),barSpacing=parseInt(options.get("barSpacing"),10);tristate._super.init.call(this,el,values,options,width,height);this.regionShapes={};this.barWidth=barWidth;this.barSpacing=barSpacing;this.totalBarWidth=barWidth+barSpacing;this.values=$.map(values,Number);this.width=width=values.length*barWidth+(values.length-1)*barSpacing;if($.isArray(options.get("colorMap"))){this.colorMapByIndex=options.get("colorMap");this.colorMapByValue=null}else{this.colorMapByIndex=null;this.colorMapByValue=options.get("colorMap");if(this.colorMapByValue&&this.colorMapByValue.get===undefined){this.colorMapByValue=new RangeMap(this.colorMapByValue)}}this.initTarget()},getRegion:function(el,x,y){return Math.floor(x/this.totalBarWidth)},getCurrentRegionFields:function(){var currentRegion=this.currentRegion;return{isNull:this.values[currentRegion]===undefined,value:this.values[currentRegion],color:this.calcColor(this.values[currentRegion],currentRegion),offset:currentRegion}},calcColor:function(value,valuenum){var values=this.values,options=this.options,colorMapByIndex=this.colorMapByIndex,colorMapByValue=this.colorMapByValue,color,newColor;if(colorMapByValue&&(newColor=colorMapByValue.get(value))){color=newColor}else if(colorMapByIndex&&colorMapByIndex.length>valuenum){color=colorMapByIndex[valuenum]}else if(values[valuenum]<0){color=options.get("negBarColor")}else if(values[valuenum]>0){color=options.get("posBarColor")}else{color=options.get("zeroBarColor")}return color},renderRegion:function(valuenum,highlight){var values=this.values,options=this.options,target=this.target,canvasHeight,height,halfHeight,x,y,color;canvasHeight=target.pixelHeight;halfHeight=Math.round(canvasHeight/2);x=valuenum*this.totalBarWidth;if(values[valuenum]<0){y=halfHeight;height=halfHeight-1}else if(values[valuenum]>0){y=0;height=halfHeight-1}else{y=halfHeight-1;height=2}color=this.calcColor(values[valuenum],valuenum);if(color===null){return}if(highlight){color=this.calcHighlightColor(color,options)}return target.drawRect(x,y,this.barWidth-1,height-1,color,color)}});$.fn.sparkline.discrete=discrete=createClass($.fn.sparkline._base,barHighlightMixin,{type:"discrete",init:function(el,values,options,width,height){discrete._super.init.call(this,el,values,options,width,height);this.regionShapes={};this.values=values=$.map(values,Number);this.min=Math.min.apply(Math,values);this.max=Math.max.apply(Math,values);this.range=this.max-this.min;this.width=width=options.get("width")==="auto"?values.length*2:this.width;this.interval=Math.floor(width/values.length);this.itemWidth=width/values.length;if(options.get("chartRangeMin")!==undefined&&(options.get("chartRangeClip")||options.get("chartRangeMin")<this.min)){this.min=options.get("chartRangeMin")}if(options.get("chartRangeMax")!==undefined&&(options.get("chartRangeClip")||options.get("chartRangeMax")>this.max)){this.max=options.get("chartRangeMax")}this.initTarget();if(this.target){this.lineHeight=options.get("lineHeight")==="auto"?Math.round(this.canvasHeight*.3):options.get("lineHeight")}},getRegion:function(el,x,y){return Math.floor(x/this.itemWidth)},getCurrentRegionFields:function(){var currentRegion=this.currentRegion;return{isNull:this.values[currentRegion]===undefined,value:this.values[currentRegion],offset:currentRegion}},renderRegion:function(valuenum,highlight){var values=this.values,options=this.options,min=this.min,max=this.max,range=this.range,interval=this.interval,target=this.target,canvasHeight=this.canvasHeight,lineHeight=this.lineHeight,pheight=canvasHeight-lineHeight,ytop,val,color,x;val=clipval(values[valuenum],min,max);x=valuenum*interval;ytop=Math.round(pheight-pheight*((val-min)/range));color=options.get("thresholdColor")&&val<options.get("thresholdValue")?options.get("thresholdColor"):options.get("lineColor");if(highlight){color=this.calcHighlightColor(color,options)}return target.drawLine(x,ytop,x,ytop+lineHeight,color)}});$.fn.sparkline.bullet=bullet=createClass($.fn.sparkline._base,{type:"bullet",init:function(el,values,options,width,height){var min,max,vals;bullet._super.init.call(this,el,values,options,width,height);this.values=values=normalizeValues(values);vals=values.slice();vals[0]=vals[0]===null?vals[2]:vals[0];vals[1]=values[1]===null?vals[2]:vals[1];min=Math.min.apply(Math,values);max=Math.max.apply(Math,values);if(options.get("base")===undefined){min=min<0?min:0}else{min=options.get("base")}this.min=min;this.max=max;this.range=max-min;this.shapes={};this.valueShapes={};this.regiondata={};this.width=width=options.get("width")==="auto"?"4.0em":width;this.target=this.$el.simpledraw(width,height,options.get("composite"));if(!values.length){this.disabled=true}this.initTarget()},getRegion:function(el,x,y){var shapeid=this.target.getShapeAt(el,x,y);return shapeid!==undefined&&this.shapes[shapeid]!==undefined?this.shapes[shapeid]:undefined},getCurrentRegionFields:function(){var currentRegion=this.currentRegion;return{fieldkey:currentRegion.substr(0,1),value:this.values[currentRegion.substr(1)],region:currentRegion}},changeHighlight:function(highlight){var currentRegion=this.currentRegion,shapeid=this.valueShapes[currentRegion],shape;delete this.shapes[shapeid];switch(currentRegion.substr(0,1)){case"r":shape=this.renderRange(currentRegion.substr(1),highlight);break;case"p":shape=this.renderPerformance(highlight);break;case"t":shape=this.renderTarget(highlight);break}this.valueShapes[currentRegion]=shape.id;this.shapes[shape.id]=currentRegion;this.target.replaceWithShape(shapeid,shape)},renderRange:function(rn,highlight){var rangeval=this.values[rn],rangewidth=Math.round(this.canvasWidth*((rangeval-this.min)/this.range)),color=this.options.get("rangeColors")[rn-2];if(highlight){color=this.calcHighlightColor(color,this.options)}return this.target.drawRect(0,0,rangewidth-1,this.canvasHeight-1,color,color)},renderPerformance:function(highlight){var perfval=this.values[1],perfwidth=Math.round(this.canvasWidth*((perfval-this.min)/this.range)),color=this.options.get("performanceColor");if(highlight){color=this.calcHighlightColor(color,this.options)}return this.target.drawRect(0,Math.round(this.canvasHeight*.3),perfwidth-1,Math.round(this.canvasHeight*.4)-1,color,color)},renderTarget:function(highlight){var targetval=this.values[0],x=Math.round(this.canvasWidth*((targetval-this.min)/this.range)-this.options.get("targetWidth")/2),targettop=Math.round(this.canvasHeight*.1),targetheight=this.canvasHeight-targettop*2,color=this.options.get("targetColor");if(highlight){color=this.calcHighlightColor(color,this.options)}return this.target.drawRect(x,targettop,this.options.get("targetWidth")-1,targetheight-1,color,color)},render:function(){var vlen=this.values.length,target=this.target,i,shape;if(!bullet._super.render.call(this)){return}for(i=2;i<vlen;i++){shape=this.renderRange(i).append();this.shapes[shape.id]="r"+i;this.valueShapes["r"+i]=shape.id}if(this.values[1]!==null){shape=this.renderPerformance().append();this.shapes[shape.id]="p1";this.valueShapes.p1=shape.id}if(this.values[0]!==null){shape=this.renderTarget().append();this.shapes[shape.id]="t0";this.valueShapes.t0=shape.id}target.render()}});$.fn.sparkline.pie=pie=createClass($.fn.sparkline._base,{type:"pie",init:function(el,values,options,width,height){var total=0,i;pie._super.init.call(this,el,values,options,width,height);this.shapes={};this.valueShapes={};this.values=values=$.map(values,Number);if(options.get("width")==="auto"){this.width=this.height}if(values.length>0){for(i=values.length;i--;){total+=values[i]}}this.total=total;this.initTarget();this.radius=Math.floor(Math.min(this.canvasWidth,this.canvasHeight)/2)},getRegion:function(el,x,y){var shapeid=this.target.getShapeAt(el,x,y);return shapeid!==undefined&&this.shapes[shapeid]!==undefined?this.shapes[shapeid]:undefined},getCurrentRegionFields:function(){var currentRegion=this.currentRegion;return{isNull:this.values[currentRegion]===undefined,value:this.values[currentRegion],percent:this.values[currentRegion]/this.total*100,color:this.options.get("sliceColors")[currentRegion%this.options.get("sliceColors").length],offset:currentRegion}},changeHighlight:function(highlight){var currentRegion=this.currentRegion,newslice=this.renderSlice(currentRegion,highlight),shapeid=this.valueShapes[currentRegion];delete this.shapes[shapeid];this.target.replaceWithShape(shapeid,newslice);this.valueShapes[currentRegion]=newslice.id;this.shapes[newslice.id]=currentRegion},renderSlice:function(valuenum,highlight){var target=this.target,options=this.options,radius=this.radius,borderWidth=options.get("borderWidth"),offset=options.get("offset"),circle=2*Math.PI,values=this.values,total=this.total,next=offset?2*Math.PI*(offset/360):0,start,end,i,vlen,color;vlen=values.length;for(i=0;i<vlen;i++){start=next;end=next;if(total>0){end=next+circle*(values[i]/total)}if(valuenum===i){color=options.get("sliceColors")[i%options.get("sliceColors").length];if(highlight){color=this.calcHighlightColor(color,options)}return target.drawPieSlice(radius,radius,radius-borderWidth,start,end,undefined,color)}next=end}},render:function(){var target=this.target,values=this.values,options=this.options,radius=this.radius,borderWidth=options.get("borderWidth"),donutWidth=options.get("donutWidth"),shape,i;if(!pie._super.render.call(this)){return}if(borderWidth){target.drawCircle(radius,radius,Math.floor(radius-borderWidth/2),options.get("borderColor"),undefined,borderWidth).append()}for(i=values.length;i--;){if(values[i]){shape=this.renderSlice(i).append();this.valueShapes[i]=shape.id;this.shapes[shape.id]=i}}if(donutWidth){target.drawCircle(radius,radius,radius-donutWidth,options.get("donutColor"),options.get("donutColor"),0).append()}target.render()}});$.fn.sparkline.box=box=createClass($.fn.sparkline._base,{type:"box",init:function(el,values,options,width,height){box._super.init.call(this,el,values,options,width,height);this.values=$.map(values,Number);this.width=options.get("width")==="auto"?"4.0em":width;this.initTarget();if(!this.values.length){this.disabled=1}},getRegion:function(){return 1},getCurrentRegionFields:function(){var result=[{field:"lq",value:this.quartiles[0]},{field:"med",value:this.quartiles[1]},{field:"uq",value:this.quartiles[2]}];if(this.loutlier!==undefined){result.push({field:"lo",value:this.loutlier})}if(this.routlier!==undefined){result.push({field:"ro",value:this.routlier})}if(this.lwhisker!==undefined){result.push({field:"lw",value:this.lwhisker})}if(this.rwhisker!==undefined){result.push({field:"rw",value:this.rwhisker})}return result},render:function(){var target=this.target,values=this.values,vlen=values.length,options=this.options,canvasWidth=this.canvasWidth,canvasHeight=this.canvasHeight,minValue=options.get("chartRangeMin")===undefined?Math.min.apply(Math,values):options.get("chartRangeMin"),maxValue=options.get("chartRangeMax")===undefined?Math.max.apply(Math,values):options.get("chartRangeMax"),canvasLeft=0,lwhisker,loutlier,iqr,q1,q2,q3,rwhisker,routlier,i,size,unitSize;if(!box._super.render.call(this)){return}if(options.get("raw")){if(options.get("showOutliers")&&values.length>5){loutlier=values[0];lwhisker=values[1];q1=values[2];q2=values[3];q3=values[4];rwhisker=values[5];routlier=values[6]}else{lwhisker=values[0];q1=values[1];q2=values[2];q3=values[3];rwhisker=values[4]}}else{values.sort(function(a,b){return a-b});q1=quartile(values,1);q2=quartile(values,2);q3=quartile(values,3);iqr=q3-q1;if(options.get("showOutliers")){lwhisker=rwhisker=undefined;for(i=0;i<vlen;i++){if(lwhisker===undefined&&values[i]>q1-iqr*options.get("outlierIQR")){lwhisker=values[i]}if(values[i]<q3+iqr*options.get("outlierIQR")){rwhisker=values[i]}}loutlier=values[0];routlier=values[vlen-1]}else{lwhisker=values[0];rwhisker=values[vlen-1]}}this.quartiles=[q1,q2,q3];this.lwhisker=lwhisker;this.rwhisker=rwhisker;this.loutlier=loutlier;this.routlier=routlier;unitSize=canvasWidth/(maxValue-minValue+1);if(options.get("showOutliers")){canvasLeft=Math.ceil(options.get("spotRadius"));canvasWidth-=2*Math.ceil(options.get("spotRadius"));unitSize=canvasWidth/(maxValue-minValue+1);if(loutlier<lwhisker){target.drawCircle((loutlier-minValue)*unitSize+canvasLeft,canvasHeight/2,options.get("spotRadius"),options.get("outlierLineColor"),options.get("outlierFillColor")).append()}if(routlier>rwhisker){target.drawCircle((routlier-minValue)*unitSize+canvasLeft,canvasHeight/2,options.get("spotRadius"),options.get("outlierLineColor"),options.get("outlierFillColor")).append()}}target.drawRect(Math.round((q1-minValue)*unitSize+canvasLeft),Math.round(canvasHeight*.1),Math.round((q3-q1)*unitSize),Math.round(canvasHeight*.8),options.get("boxLineColor"),options.get("boxFillColor")).append();target.drawLine(Math.round((lwhisker-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/2),Math.round((q1-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/2),options.get("lineColor")).append();target.drawLine(Math.round((lwhisker-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/4),Math.round((lwhisker-minValue)*unitSize+canvasLeft),Math.round(canvasHeight-canvasHeight/4),options.get("whiskerColor")).append();target.drawLine(Math.round((rwhisker-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/2),Math.round((q3-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/2),options.get("lineColor")).append();target.drawLine(Math.round((rwhisker-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/4),Math.round((rwhisker-minValue)*unitSize+canvasLeft),Math.round(canvasHeight-canvasHeight/4),options.get("whiskerColor")).append();target.drawLine(Math.round((q2-minValue)*unitSize+canvasLeft),Math.round(canvasHeight*.1),Math.round((q2-minValue)*unitSize+canvasLeft),Math.round(canvasHeight*.9),options.get("medianColor")).append();if(options.get("target")){size=Math.ceil(options.get("spotRadius"));target.drawLine(Math.round((options.get("target")-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/2-size),Math.round((options.get("target")-minValue)*unitSize+canvasLeft),Math.round(canvasHeight/2+size),options.get("targetColor")).append();target.drawLine(Math.round((options.get("target")-minValue)*unitSize+canvasLeft-size),Math.round(canvasHeight/2),Math.round((options.get("target")-minValue)*unitSize+canvasLeft+size),Math.round(canvasHeight/2),options.get("targetColor")).append()}target.render()}});VShape=createClass({init:function(target,id,type,args){this.target=target;this.id=id;this.type=type;this.args=args},append:function(){this.target.appendShape(this);return this}});VCanvas_base=createClass({_pxregex:/(\d+)(px)?\s*$/i,init:function(width,height,target){if(!width){return}this.width=width;this.height=height;this.target=target;this.lastShapeId=null;if(target[0]){target=target[0]}$.data(target,"_jqs_vcanvas",this)},drawLine:function(x1,y1,x2,y2,lineColor,lineWidth){return this.drawShape([[x1,y1],[x2,y2]],lineColor,lineWidth)},drawShape:function(path,lineColor,fillColor,lineWidth){return this._genShape("Shape",[path,lineColor,fillColor,lineWidth])},drawCircle:function(x,y,radius,lineColor,fillColor,lineWidth){return this._genShape("Circle",[x,y,radius,lineColor,fillColor,lineWidth])},drawPieSlice:function(x,y,radius,startAngle,endAngle,lineColor,fillColor){return this._genShape("PieSlice",[x,y,radius,startAngle,endAngle,lineColor,fillColor])},drawRect:function(x,y,width,height,lineColor,fillColor){return this._genShape("Rect",[x,y,width,height,lineColor,fillColor])},getElement:function(){return this.canvas},getLastShapeId:function(){return this.lastShapeId},reset:function(){alert("reset not implemented")},_insert:function(el,target){$(target).html(el)},_calculatePixelDims:function(width,height,canvas){var match;match=this._pxregex.exec(height);if(match){this.pixelHeight=match[1]}else{this.pixelHeight=$(canvas).height()}match=this._pxregex.exec(width);if(match){this.pixelWidth=match[1]}else{this.pixelWidth=$(canvas).width()}},_genShape:function(shapetype,shapeargs){var id=shapeCount++;shapeargs.unshift(id);return new VShape(this,id,shapetype,shapeargs)},appendShape:function(shape){alert("appendShape not implemented")},replaceWithShape:function(shapeid,shape){alert("replaceWithShape not implemented")},insertAfterShape:function(shapeid,shape){alert("insertAfterShape not implemented")},removeShapeId:function(shapeid){alert("removeShapeId not implemented")},getShapeAt:function(el,x,y){alert("getShapeAt not implemented")},render:function(){alert("render not implemented")}});VCanvas_canvas=createClass(VCanvas_base,{init:function(width,height,target,interact){VCanvas_canvas._super.init.call(this,width,height,target);this.canvas=document.createElement("canvas");if(target[0]){target=target[0]}$.data(target,"_jqs_vcanvas",this);$(this.canvas).css({display:"inline-block",width:width,height:height,verticalAlign:"top"});this._insert(this.canvas,target);this._calculatePixelDims(width,height,this.canvas);this.canvas.width=this.pixelWidth;this.canvas.height=this.pixelHeight;this.interact=interact;this.shapes={};this.shapeseq=[];this.currentTargetShapeId=undefined;$(this.canvas).css({width:this.pixelWidth,height:this.pixelHeight})},_getContext:function(lineColor,fillColor,lineWidth){var context=this.canvas.getContext("2d");if(lineColor!==undefined){context.strokeStyle=lineColor}context.lineWidth=lineWidth===undefined?1:lineWidth;if(fillColor!==undefined){context.fillStyle=fillColor}return context},reset:function(){var context=this._getContext();context.clearRect(0,0,this.pixelWidth,this.pixelHeight);this.shapes={};this.shapeseq=[];this.currentTargetShapeId=undefined},_drawShape:function(shapeid,path,lineColor,fillColor,lineWidth){var context=this._getContext(lineColor,fillColor,lineWidth),i,plen;context.beginPath();context.moveTo(path[0][0]+.5,path[0][1]+.5);for(i=1,plen=path.length;i<plen;i++){context.lineTo(path[i][0]+.5,path[i][1]+.5)}if(lineColor!==undefined){context.stroke()}if(fillColor!==undefined){context.fill()}if(this.targetX!==undefined&&this.targetY!==undefined&&context.isPointInPath(this.targetX,this.targetY)){this.currentTargetShapeId=shapeid}},_drawCircle:function(shapeid,x,y,radius,lineColor,fillColor,lineWidth){var context=this._getContext(lineColor,fillColor,lineWidth);context.beginPath();context.arc(x,y,radius,0,2*Math.PI,false);if(this.targetX!==undefined&&this.targetY!==undefined&&context.isPointInPath(this.targetX,this.targetY)){this.currentTargetShapeId=shapeid}if(lineColor!==undefined){context.stroke()}if(fillColor!==undefined){context.fill()}},_drawPieSlice:function(shapeid,x,y,radius,startAngle,endAngle,lineColor,fillColor){var context=this._getContext(lineColor,fillColor);context.beginPath();context.moveTo(x,y);context.arc(x,y,radius,startAngle,endAngle,false);context.lineTo(x,y);context.closePath();if(lineColor!==undefined){context.stroke()}if(fillColor){context.fill()}if(this.targetX!==undefined&&this.targetY!==undefined&&context.isPointInPath(this.targetX,this.targetY)){this.currentTargetShapeId=shapeid}},_drawRect:function(shapeid,x,y,width,height,lineColor,fillColor){return this._drawShape(shapeid,[[x,y],[x+width,y],[x+width,y+height],[x,y+height],[x,y]],lineColor,fillColor)},appendShape:function(shape){this.shapes[shape.id]=shape;this.shapeseq.push(shape.id);this.lastShapeId=shape.id;return shape.id},replaceWithShape:function(shapeid,shape){var shapeseq=this.shapeseq,i;this.shapes[shape.id]=shape;for(i=shapeseq.length;i--;){if(shapeseq[i]==shapeid){shapeseq[i]=shape.id}}delete this.shapes[shapeid]},replaceWithShapes:function(shapeids,shapes){var shapeseq=this.shapeseq,shapemap={},sid,i,first;for(i=shapeids.length;i--;){shapemap[shapeids[i]]=true}for(i=shapeseq.length;i--;){sid=shapeseq[i];if(shapemap[sid]){shapeseq.splice(i,1);delete this.shapes[sid];first=i}}for(i=shapes.length;i--;){shapeseq.splice(first,0,shapes[i].id);this.shapes[shapes[i].id]=shapes[i]}},insertAfterShape:function(shapeid,shape){var shapeseq=this.shapeseq,i;for(i=shapeseq.length;i--;){if(shapeseq[i]===shapeid){shapeseq.splice(i+1,0,shape.id);this.shapes[shape.id]=shape;return}}},removeShapeId:function(shapeid){var shapeseq=this.shapeseq,i;for(i=shapeseq.length;i--;){if(shapeseq[i]===shapeid){shapeseq.splice(i,1);break}}delete this.shapes[shapeid]},getShapeAt:function(el,x,y){this.targetX=x;this.targetY=y;this.render();return this.currentTargetShapeId},render:function(){var shapeseq=this.shapeseq,shapes=this.shapes,shapeCount=shapeseq.length,context=this._getContext(),shapeid,shape,i;context.clearRect(0,0,this.pixelWidth,this.pixelHeight);for(i=0;i<shapeCount;i++){shapeid=shapeseq[i];shape=shapes[shapeid];this["_draw"+shape.type].apply(this,shape.args)}if(!this.interact){this.shapes={};this.shapeseq=[]}}});VCanvas_vml=createClass(VCanvas_base,{init:function(width,height,target){var groupel;VCanvas_vml._super.init.call(this,width,height,target);if(target[0]){target=target[0]}$.data(target,"_jqs_vcanvas",this);this.canvas=document.createElement("span");$(this.canvas).css({display:"inline-block",position:"relative",overflow:"hidden",width:width,height:height,margin:"0px",padding:"0px",verticalAlign:"top"});this._insert(this.canvas,target);this._calculatePixelDims(width,height,this.canvas);this.canvas.width=this.pixelWidth;this.canvas.height=this.pixelHeight;groupel='<v:group coordorigin="0 0" coordsize="'+this.pixelWidth+" "+this.pixelHeight+'"'+' style="position:absolute;top:0;left:0;width:'+this.pixelWidth+"px;height="+this.pixelHeight+'px;"></v:group>';this.canvas.insertAdjacentHTML("beforeEnd",groupel);this.group=$(this.canvas).children()[0];this.rendered=false;this.prerender=""},_drawShape:function(shapeid,path,lineColor,fillColor,lineWidth){var vpath=[],initial,stroke,fill,closed,vel,plen,i;for(i=0,plen=path.length;i<plen;i++){vpath[i]=""+path[i][0]+","+path[i][1]}initial=vpath.splice(0,1);lineWidth=lineWidth===undefined?1:lineWidth;stroke=lineColor===undefined?' stroked="false" ':' strokeWeight="'+lineWidth+'px" strokeColor="'+lineColor+'" ';fill=fillColor===undefined?' filled="false"':' fillColor="'+fillColor+'" filled="true" ';closed=vpath[0]===vpath[vpath.length-1]?"x ":"";vel='<v:shape coordorigin="0 0" coordsize="'+this.pixelWidth+" "+this.pixelHeight+'" '+' id="jqsshape'+shapeid+'" '+stroke+fill+' style="position:absolute;left:0px;top:0px;height:'+this.pixelHeight+"px;width:"+this.pixelWidth+'px;padding:0px;margin:0px;" '+' path="m '+initial+" l "+vpath.join(", ")+" "+closed+'e">'+" </v:shape>";return vel},_drawCircle:function(shapeid,x,y,radius,lineColor,fillColor,lineWidth){var stroke,fill,vel;x-=radius;y-=radius;stroke=lineColor===undefined?' stroked="false" ':' strokeWeight="'+lineWidth+'px" strokeColor="'+lineColor+'" ';fill=fillColor===undefined?' filled="false"':' fillColor="'+fillColor+'" filled="true" ';vel="<v:oval "+' id="jqsshape'+shapeid+'" '+stroke+fill+' style="position:absolute;top:'+y+"px; left:"+x+"px; width:"+radius*2+"px; height:"+radius*2+'px"></v:oval>';return vel},_drawPieSlice:function(shapeid,x,y,radius,startAngle,endAngle,lineColor,fillColor){var vpath,startx,starty,endx,endy,stroke,fill,vel;if(startAngle===endAngle){return""}if(endAngle-startAngle===2*Math.PI){startAngle=0;endAngle=2*Math.PI}startx=x+Math.round(Math.cos(startAngle)*radius);starty=y+Math.round(Math.sin(startAngle)*radius);endx=x+Math.round(Math.cos(endAngle)*radius);endy=y+Math.round(Math.sin(endAngle)*radius);if(startx===endx&&starty===endy){if(endAngle-startAngle<Math.PI){return""}startx=endx=x+radius;starty=endy=y}if(startx===endx&&starty===endy&&endAngle-startAngle<Math.PI){return""}vpath=[x-radius,y-radius,x+radius,y+radius,startx,starty,endx,endy];stroke=lineColor===undefined?' stroked="false" ':' strokeWeight="1px" strokeColor="'+lineColor+'" ';fill=fillColor===undefined?' filled="false"':' fillColor="'+fillColor+'" filled="true" ';vel='<v:shape coordorigin="0 0" coordsize="'+this.pixelWidth+" "+this.pixelHeight+'" '+' id="jqsshape'+shapeid+'" '+stroke+fill+' style="position:absolute;left:0px;top:0px;height:'+this.pixelHeight+"px;width:"+this.pixelWidth+'px;padding:0px;margin:0px;" '+' path="m '+x+","+y+" wa "+vpath.join(", ")+' x e">'+" </v:shape>";return vel},_drawRect:function(shapeid,x,y,width,height,lineColor,fillColor){return this._drawShape(shapeid,[[x,y],[x,y+height],[x+width,y+height],[x+width,y],[x,y]],lineColor,fillColor)},reset:function(){this.group.innerHTML=""},appendShape:function(shape){var vel=this["_draw"+shape.type].apply(this,shape.args);if(this.rendered){this.group.insertAdjacentHTML("beforeEnd",vel)}else{this.prerender+=vel}this.lastShapeId=shape.id;return shape.id},replaceWithShape:function(shapeid,shape){var existing=$("#jqsshape"+shapeid),vel=this["_draw"+shape.type].apply(this,shape.args);existing[0].outerHTML=vel},replaceWithShapes:function(shapeids,shapes){var existing=$("#jqsshape"+shapeids[0]),replace="",slen=shapes.length,i;for(i=0;i<slen;i++){replace+=this["_draw"+shapes[i].type].apply(this,shapes[i].args)}existing[0].outerHTML=replace;for(i=1;i<shapeids.length;i++){$("#jqsshape"+shapeids[i]).remove()}},insertAfterShape:function(shapeid,shape){var existing=$("#jqsshape"+shapeid),vel=this["_draw"+shape.type].apply(this,shape.args);existing[0].insertAdjacentHTML("afterEnd",vel)},removeShapeId:function(shapeid){var existing=$("#jqsshape"+shapeid);this.group.removeChild(existing[0])},getShapeAt:function(el,x,y){var shapeid=el.id.substr(8);return shapeid},render:function(){if(!this.rendered){this.group.innerHTML=this.prerender;this.rendered=true}}})})})(document,Math);
/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/

// first an inline dependency, jquery.colorhelpers.js, we inline it here
// for convenience

/* Plugin for jQuery for working with colors.
 *
 * Version 1.1.
 *
 * Inspiration from jQuery color animation plugin by John Resig.
 *
 * Released under the MIT license by Ole Laursen, October 2009.
 *
 * Examples:
 *
 *   $.color.parse("#fff").scale('rgb', 0.25).add('a', -0.5).toString()
 *   var c = $.color.extract($("#mydiv"), 'background-color');
 *   console.log(c.r, c.g, c.b, c.a);
 *   $.color.make(100, 50, 25, 0.4).toString() // returns "rgba(100,50,25,0.4)"
 *
 * Note that .scale() and .add() return the same modified object
 * instead of making a new one.
 *
 * V. 1.1: Fix error handling so e.g. parsing an empty string does
 * produce a color rather than just crashing.
 */

(function($){$.color={};$.color.make=function(r,g,b,a){var o={};o.r=r||0;o.g=g||0;o.b=b||0;o.a=a!=null?a:1;o.add=function(c,d){for(var i=0;i<c.length;++i)o[c.charAt(i)]+=d;return o.normalize()};o.scale=function(c,f){for(var i=0;i<c.length;++i)o[c.charAt(i)]*=f;return o.normalize()};o.toString=function(){if(o.a>=1){return"rgb("+[o.r,o.g,o.b].join(",")+")"}else{return"rgba("+[o.r,o.g,o.b,o.a].join(",")+")"}};o.normalize=function(){function clamp(min,value,max){return value<min?min:value>max?max:value}o.r=clamp(0,parseInt(o.r),255);o.g=clamp(0,parseInt(o.g),255);o.b=clamp(0,parseInt(o.b),255);o.a=clamp(0,o.a,1);return o};o.clone=function(){return $.color.make(o.r,o.b,o.g,o.a)};return o.normalize()};$.color.extract=function(elem,css){var c;do{c=elem.css(css).toLowerCase();if(c!=""&&c!="transparent")break;elem=elem.parent()}while(elem.length&&!$.nodeName(elem.get(0),"body"));if(c=="rgba(0, 0, 0, 0)")c="transparent";return $.color.parse(c)};$.color.parse=function(str){var res,m=$.color.make;if(res=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10));if(res=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10),parseFloat(res[4]));if(res=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55);if(res=/rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55,parseFloat(res[4]));if(res=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(str))return m(parseInt(res[1],16),parseInt(res[2],16),parseInt(res[3],16));if(res=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(str))return m(parseInt(res[1]+res[1],16),parseInt(res[2]+res[2],16),parseInt(res[3]+res[3],16));var name=$.trim(str).toLowerCase();if(name=="transparent")return m(255,255,255,0);else{res=lookupColors[name]||[0,0,0];return m(res[0],res[1],res[2])}};var lookupColors={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);

// the actual Flot code
(function($) {

	// Cache the prototype hasOwnProperty for faster access

	var hasOwnProperty = Object.prototype.hasOwnProperty;

    // A shim to provide 'detach' to jQuery versions prior to 1.4.  Using a DOM
    // operation produces the same effect as detach, i.e. removing the element
    // without touching its jQuery data.

    // Do not merge this into Flot 0.9, since it requires jQuery 1.4.4+.

    if (!$.fn.detach) {
        $.fn.detach = function() {
            return this.each(function() {
                if (this.parentNode) {
                    this.parentNode.removeChild( this );
                }
            });
        };
    }

	///////////////////////////////////////////////////////////////////////////
	// The Canvas object is a wrapper around an HTML5 <canvas> tag.
	//
	// @constructor
	// @param {string} cls List of classes to apply to the canvas.
	// @param {element} container Element onto which to append the canvas.
	//
	// Requiring a container is a little iffy, but unfortunately canvas
	// operations don't work unless the canvas is attached to the DOM.

	function Canvas(cls, container) {

		var element = container.children("." + cls)[0];

		if (element == null) {

			element = document.createElement("canvas");
			element.className = cls;

			$(element).css({ direction: "ltr", position: "absolute", left: 0, top: 0 })
				.appendTo(container);

			// If HTML5 Canvas isn't available, fall back to [Ex|Flash]canvas

			if (!element.getContext) {
				if (window.G_vmlCanvasManager) {
					element = window.G_vmlCanvasManager.initElement(element);
				} else {
					throw new Error("Canvas is not available. If you're using IE with a fall-back such as Excanvas, then there's either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.");
				}
			}
		}

		this.element = element;

		var context = this.context = element.getContext("2d");

		// Determine the screen's ratio of physical to device-independent
		// pixels.  This is the ratio between the canvas width that the browser
		// advertises and the number of pixels actually present in that space.

		// The iPhone 4, for example, has a device-independent width of 320px,
		// but its screen is actually 640px wide.  It therefore has a pixel
		// ratio of 2, while most normal devices have a ratio of 1.

		var devicePixelRatio = window.devicePixelRatio || 1,
			backingStoreRatio =
				context.webkitBackingStorePixelRatio ||
				context.mozBackingStorePixelRatio ||
				context.msBackingStorePixelRatio ||
				context.oBackingStorePixelRatio ||
				context.backingStorePixelRatio || 1;

		this.pixelRatio = devicePixelRatio / backingStoreRatio;

		// Size the canvas to match the internal dimensions of its container

		this.resize(container.width(), container.height());

		// Collection of HTML div layers for text overlaid onto the canvas

		this.textContainer = null;
		this.text = {};

		// Cache of text fragments and metrics, so we can avoid expensively
		// re-calculating them when the plot is re-rendered in a loop.

		this._textCache = {};
	}

	// Resizes the canvas to the given dimensions.
	//
	// @param {number} width New width of the canvas, in pixels.
	// @param {number} width New height of the canvas, in pixels.

	Canvas.prototype.resize = function(width, height) {

		if (width <= 0 || height <= 0) {
			throw new Error("Invalid dimensions for plot, width = " + width + ", height = " + height);
		}

		var element = this.element,
			context = this.context,
			pixelRatio = this.pixelRatio;

		// Resize the canvas, increasing its density based on the display's
		// pixel ratio; basically giving it more pixels without increasing the
		// size of its element, to take advantage of the fact that retina
		// displays have that many more pixels in the same advertised space.

		// Resizing should reset the state (excanvas seems to be buggy though)

		if (this.width != width) {
			element.width = width * pixelRatio;
			element.style.width = width + "px";
			this.width = width;
		}

		if (this.height != height) {
			element.height = height * pixelRatio;
			element.style.height = height + "px";
			this.height = height;
		}

		// Save the context, so we can reset in case we get replotted.  The
		// restore ensure that we're really back at the initial state, and
		// should be safe even if we haven't saved the initial state yet.

		context.restore();
		context.save();

		// Scale the coordinate space to match the display density; so even though we
		// may have twice as many pixels, we still want lines and other drawing to
		// appear at the same size; the extra pixels will just make them crisper.

		context.scale(pixelRatio, pixelRatio);
	};

	// Clears the entire canvas area, not including any overlaid HTML text

	Canvas.prototype.clear = function() {
		this.context.clearRect(0, 0, this.width, this.height);
	};

	// Finishes rendering the canvas, including managing the text overlay.

	Canvas.prototype.render = function() {

		var cache = this._textCache;

		// For each text layer, add elements marked as active that haven't
		// already been rendered, and remove those that are no longer active.

		for (var layerKey in cache) {
			if (hasOwnProperty.call(cache, layerKey)) {

				var layer = this.getTextLayer(layerKey),
					layerCache = cache[layerKey];

				layer.hide();

				for (var styleKey in layerCache) {
					if (hasOwnProperty.call(layerCache, styleKey)) {
						var styleCache = layerCache[styleKey];
						for (var key in styleCache) {
							if (hasOwnProperty.call(styleCache, key)) {

								var positions = styleCache[key].positions;

								for (var i = 0, position; position = positions[i]; i++) {
									if (position.active) {
										if (!position.rendered) {
											layer.append(position.element);
											position.rendered = true;
										}
									} else {
										positions.splice(i--, 1);
										if (position.rendered) {
											position.element.detach();
										}
									}
								}

								if (positions.length == 0) {
									delete styleCache[key];
								}
							}
						}
					}
				}

				layer.show();
			}
		}
	};

	// Creates (if necessary) and returns the text overlay container.
	//
	// @param {string} classes String of space-separated CSS classes used to
	//     uniquely identify the text layer.
	// @return {object} The jQuery-wrapped text-layer div.

	Canvas.prototype.getTextLayer = function(classes) {

		var layer = this.text[classes];

		// Create the text layer if it doesn't exist

		if (layer == null) {

			// Create the text layer container, if it doesn't exist

			if (this.textContainer == null) {
				this.textContainer = $("<div class='flot-text'></div>")
					.css({
						position: "absolute",
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
						'font-size': "smaller",
						color: "#545454"
					})
					.insertAfter(this.element);
			}

			layer = this.text[classes] = $("<div></div>")
				.addClass(classes)
				.css({
					position: "absolute",
					top: 0,
					left: 0,
					bottom: 0,
					right: 0
				})
				.appendTo(this.textContainer);
		}

		return layer;
	};

	// Creates (if necessary) and returns a text info object.
	//
	// The object looks like this:
	//
	// {
	//     width: Width of the text's wrapper div.
	//     height: Height of the text's wrapper div.
	//     element: The jQuery-wrapped HTML div containing the text.
	//     positions: Array of positions at which this text is drawn.
	// }
	//
	// The positions array contains objects that look like this:
	//
	// {
	//     active: Flag indicating whether the text should be visible.
	//     rendered: Flag indicating whether the text is currently visible.
	//     element: The jQuery-wrapped HTML div containing the text.
	//     x: X coordinate at which to draw the text.
	//     y: Y coordinate at which to draw the text.
	// }
	//
	// Each position after the first receives a clone of the original element.
	//
	// The idea is that that the width, height, and general 'identity' of the
	// text is constant no matter where it is placed; the placements are a
	// secondary property.
	//
	// Canvas maintains a cache of recently-used text info objects; getTextInfo
	// either returns the cached element or creates a new entry.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {string} text Text string to retrieve info for.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which to rotate the text, in degrees.
	//     Angle is currently unused, it will be implemented in the future.
	// @param {number=} width Maximum width of the text before it wraps.
	// @return {object} a text info object.

	Canvas.prototype.getTextInfo = function(layer, text, font, angle, width) {

		var textStyle, layerCache, styleCache, info;

		// Cast the value to a string, in case we were given a number or such

		text = "" + text;

		// If the font is a font-spec object, generate a CSS font definition

		if (typeof font === "object") {
			textStyle = font.style + " " + font.variant + " " + font.weight + " " + font.size + "px/" + font.lineHeight + "px " + font.family;
		} else {
			textStyle = font;
		}

		// Retrieve (or create) the cache for the text's layer and styles

		layerCache = this._textCache[layer];

		if (layerCache == null) {
			layerCache = this._textCache[layer] = {};
		}

		styleCache = layerCache[textStyle];

		if (styleCache == null) {
			styleCache = layerCache[textStyle] = {};
		}

		info = styleCache[text];

		// If we can't find a matching element in our cache, create a new one

		if (info == null) {

			var element = $("<div></div>").html(text)
				.css({
					position: "absolute",
					'max-width': width,
					top: -9999
				})
				.appendTo(this.getTextLayer(layer));

			if (typeof font === "object") {
				element.css({
					font: textStyle,
					color: font.color
				});
			} else if (typeof font === "string") {
				element.addClass(font);
			}

			info = styleCache[text] = {
				width: element.outerWidth(true),
				height: element.outerHeight(true),
				element: element,
				positions: []
			};

			element.detach();
		}

		return info;
	};

	// Adds a text string to the canvas text overlay.
	//
	// The text isn't drawn immediately; it is marked as rendering, which will
	// result in its addition to the canvas on the next render pass.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {number} x X coordinate at which to draw the text.
	// @param {number} y Y coordinate at which to draw the text.
	// @param {string} text Text string to draw.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which to rotate the text, in degrees.
	//     Angle is currently unused, it will be implemented in the future.
	// @param {number=} width Maximum width of the text before it wraps.
	// @param {string=} halign Horizontal alignment of the text; either "left",
	//     "center" or "right".
	// @param {string=} valign Vertical alignment of the text; either "top",
	//     "middle" or "bottom".

	Canvas.prototype.addText = function(layer, x, y, text, font, angle, width, halign, valign) {

		var info = this.getTextInfo(layer, text, font, angle, width),
			positions = info.positions;

		// Tweak the div's position to match the text's alignment

		if (halign == "center") {
			x -= info.width / 2;
		} else if (halign == "right") {
			x -= info.width;
		}

		if (valign == "middle") {
			y -= info.height / 2;
		} else if (valign == "bottom") {
			y -= info.height;
		}

		// Determine whether this text already exists at this position.
		// If so, mark it for inclusion in the next render pass.

		for (var i = 0, position; position = positions[i]; i++) {
			if (position.x == x && position.y == y) {
				position.active = true;
				return;
			}
		}

		// If the text doesn't exist at this position, create a new entry

		// For the very first position we'll re-use the original element,
		// while for subsequent ones we'll clone it.

		position = {
			active: true,
			rendered: false,
			element: positions.length ? info.element.clone() : info.element,
			x: x,
			y: y
		};

		positions.push(position);

		// Move the element to its final position within the container

		position.element.css({
			top: Math.round(y),
			left: Math.round(x),
			'text-align': halign	// In case the text wraps
		});
	};

	// Removes one or more text strings from the canvas text overlay.
	//
	// If no parameters are given, all text within the layer is removed.
	//
	// Note that the text is not immediately removed; it is simply marked as
	// inactive, which will result in its removal on the next render pass.
	// This avoids the performance penalty for 'clear and redraw' behavior,
	// where we potentially get rid of all text on a layer, but will likely
	// add back most or all of it later, as when redrawing axes, for example.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {number=} x X coordinate of the text.
	// @param {number=} y Y coordinate of the text.
	// @param {string=} text Text string to remove.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which the text is rotated, in degrees.
	//     Angle is currently unused, it will be implemented in the future.

	Canvas.prototype.removeText = function(layer, x, y, text, font, angle) {
		if (text == null) {
			var layerCache = this._textCache[layer];
			if (layerCache != null) {
				for (var styleKey in layerCache) {
					if (hasOwnProperty.call(layerCache, styleKey)) {
						var styleCache = layerCache[styleKey];
						for (var key in styleCache) {
							if (hasOwnProperty.call(styleCache, key)) {
								var positions = styleCache[key].positions;
								for (var i = 0, position; position = positions[i]; i++) {
									position.active = false;
								}
							}
						}
					}
				}
			}
		} else {
			var positions = this.getTextInfo(layer, text, font, angle).positions;
			for (var i = 0, position; position = positions[i]; i++) {
				if (position.x == x && position.y == y) {
					position.active = false;
				}
			}
		}
	};

	///////////////////////////////////////////////////////////////////////////
	// The top-level container for the entire plot.

    function Plot(placeholder, data_, options_, plugins) {
        // data is on the form:
        //   [ series1, series2 ... ]
        // where series is either just the data as [ [x1, y1], [x2, y2], ... ]
        // or { data: [ [x1, y1], [x2, y2], ... ], label: "some label", ... }

        var series = [],
            options = {
                // the color theme used for graphs
                colors: ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"],
                legend: {
                    show: true,
                    noColumns: 1, // number of colums in legend table
                    labelFormatter: null, // fn: string -> string
                    labelBoxBorderColor: "#ccc", // border color for the little label boxes
                    container: null, // container (as jQuery object) to put legend in, null means default on top of graph
                    position: "ne", // position of default legend container within plot
                    margin: 5, // distance from grid edge to default legend container within plot
                    backgroundColor: null, // null means auto-detect
                    backgroundOpacity: 0.85, // set to 0 to avoid background
                    sorted: null    // default to no legend sorting
                },
                xaxis: {
                    show: null, // null = auto-detect, true = always, false = never
                    position: "bottom", // or "top"
                    mode: null, // null or "time"
                    font: null, // null (derived from CSS in placeholder) or object like { size: 11, lineHeight: 13, style: "italic", weight: "bold", family: "sans-serif", variant: "small-caps" }
                    color: null, // base color, labels, ticks
                    tickColor: null, // possibly different color of ticks, e.g. "rgba(0,0,0,0.15)"
                    transform: null, // null or f: number -> number to transform axis
                    inverseTransform: null, // if transform is set, this should be the inverse function
                    min: null, // min. value to show, null means set automatically
                    max: null, // max. value to show, null means set automatically
                    autoscaleMargin: null, // margin in % to add if auto-setting min/max
                    ticks: null, // either [1, 3] or [[1, "a"], 3] or (fn: axis info -> ticks) or app. number of ticks for auto-ticks
                    tickFormatter: null, // fn: number -> string
                    labelWidth: null, // size of tick labels in pixels
                    labelHeight: null,
                    reserveSpace: null, // whether to reserve space even if axis isn't shown
                    tickLength: null, // size in pixels of ticks, or "full" for whole line
                    alignTicksWithAxis: null, // axis number or null for no sync
                    tickDecimals: null, // no. of decimals, null means auto
                    tickSize: null, // number or [number, "unit"]
                    minTickSize: null // number or [number, "unit"]
                },
                yaxis: {
                    autoscaleMargin: 0.02,
                    position: "left" // or "right"
                },
                xaxes: [],
                yaxes: [],
                series: {
                    points: {
                        show: false,
                        radius: 3,
                        lineWidth: 2, // in pixels
                        fill: true,
                        fillColor: "#ffffff",
                        symbol: "circle" // or callback
                    },
                    lines: {
                        // we don't put in show: false so we can see
                        // whether lines were actively disabled
                        lineWidth: 2, // in pixels
                        fill: false,
                        fillColor: null,
                        steps: false
                        // Omit 'zero', so we can later default its value to
                        // match that of the 'fill' option.
                    },
                    bars: {
                        show: false,
                        lineWidth: 2, // in pixels
                        barWidth: 1, // in units of the x axis
                        fill: true,
                        fillColor: null,
                        align: "left", // "left", "right", or "center"
                        horizontal: false,
                        zero: true
                    },
                    shadowSize: 3,
                    highlightColor: null
                },
                grid: {
                    show: true,
                    aboveData: false,
                    color: "#545454", // primary color used for outline and labels
                    backgroundColor: null, // null for transparent, else color
                    borderColor: null, // set if different from the grid color
                    tickColor: null, // color for the ticks, e.g. "rgba(0,0,0,0.15)"
                    margin: 0, // distance from the canvas edge to the grid
                    labelMargin: 5, // in pixels
                    axisMargin: 8, // in pixels
                    borderWidth: 2, // in pixels
                    minBorderMargin: null, // in pixels, null means taken from points radius
                    markings: null, // array of ranges or fn: axes -> array of ranges
                    markingsColor: "#f4f4f4",
                    markingsLineWidth: 2,
                    // interactive stuff
                    clickable: false,
                    hoverable: false,
                    autoHighlight: true, // highlight in case mouse is near
                    mouseActiveRadius: 10 // how far the mouse can be away to activate an item
                },
                interaction: {
                    redrawOverlayInterval: 1000/60 // time between updates, -1 means in same flow
                },
                hooks: {}
            },
        surface = null,     // the canvas for the plot itself
        overlay = null,     // canvas for interactive stuff on top of plot
        eventHolder = null, // jQuery object that events should be bound to
        ctx = null, octx = null,
        xaxes = [], yaxes = [],
        plotOffset = { left: 0, right: 0, top: 0, bottom: 0},
        plotWidth = 0, plotHeight = 0,
        hooks = {
            processOptions: [],
            processRawData: [],
            processDatapoints: [],
            processOffset: [],
            drawBackground: [],
            drawSeries: [],
            draw: [],
            bindEvents: [],
            drawOverlay: [],
            shutdown: []
        },
        plot = this;

        // public functions
        plot.setData = setData;
        plot.setupGrid = setupGrid;
        plot.draw = draw;
        plot.getPlaceholder = function() { return placeholder; };
        plot.getCanvas = function() { return surface.element; };
        plot.getPlotOffset = function() { return plotOffset; };
        plot.width = function () { return plotWidth; };
        plot.height = function () { return plotHeight; };
        plot.offset = function () {
            var o = eventHolder.offset();
            o.left += plotOffset.left;
            o.top += plotOffset.top;
            return o;
        };
        plot.getData = function () { return series; };
        plot.getAxes = function () {
            var res = {}, i;
            $.each(xaxes.concat(yaxes), function (_, axis) {
                if (axis)
                    res[axis.direction + (axis.n != 1 ? axis.n : "") + "axis"] = axis;
            });
            return res;
        };
        plot.getXAxes = function () { return xaxes; };
        plot.getYAxes = function () { return yaxes; };
        plot.c2p = canvasToAxisCoords;
        plot.p2c = axisToCanvasCoords;
        plot.getOptions = function () { return options; };
        plot.highlight = highlight;
        plot.unhighlight = unhighlight;
        plot.triggerRedrawOverlay = triggerRedrawOverlay;
        plot.pointOffset = function(point) {
            return {
                left: parseInt(xaxes[axisNumber(point, "x") - 1].p2c(+point.x) + plotOffset.left, 10),
                top: parseInt(yaxes[axisNumber(point, "y") - 1].p2c(+point.y) + plotOffset.top, 10)
            };
        };
        plot.shutdown = shutdown;
        plot.destroy = function () {
            shutdown();
            placeholder.removeData("plot").empty();

            series = [];
            options = null;
            surface = null;
            overlay = null;
            eventHolder = null;
            ctx = null;
            octx = null;
            xaxes = [];
            yaxes = [];
            hooks = null;
            highlights = [];
            plot = null;
        };
        plot.resize = function () {
        	var width = placeholder.width(),
        		height = placeholder.height();
            surface.resize(width, height);
            overlay.resize(width, height);
        };

        // public attributes
        plot.hooks = hooks;

        // initialize
        initPlugins(plot);
        parseOptions(options_);
        setupCanvases();
        setData(data_);
        setupGrid();
        draw();
        bindEvents();


        function executeHooks(hook, args) {
            args = [plot].concat(args);
            for (var i = 0; i < hook.length; ++i)
                hook[i].apply(this, args);
        }

        function initPlugins() {

            // References to key classes, allowing plugins to modify them

            var classes = {
                Canvas: Canvas
            };

            for (var i = 0; i < plugins.length; ++i) {
                var p = plugins[i];
                p.init(plot, classes);
                if (p.options)
                    $.extend(true, options, p.options);
            }
        }

        function parseOptions(opts) {

            $.extend(true, options, opts);

            // $.extend merges arrays, rather than replacing them.  When less
            // colors are provided than the size of the default palette, we
            // end up with those colors plus the remaining defaults, which is
            // not expected behavior; avoid it by replacing them here.

            if (opts && opts.colors) {
            	options.colors = opts.colors;
            }

            if (options.xaxis.color == null)
                options.xaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();
            if (options.yaxis.color == null)
                options.yaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();

            if (options.xaxis.tickColor == null) // grid.tickColor for back-compatibility
                options.xaxis.tickColor = options.grid.tickColor || options.xaxis.color;
            if (options.yaxis.tickColor == null) // grid.tickColor for back-compatibility
                options.yaxis.tickColor = options.grid.tickColor || options.yaxis.color;

            if (options.grid.borderColor == null)
                options.grid.borderColor = options.grid.color;
            if (options.grid.tickColor == null)
                options.grid.tickColor = $.color.parse(options.grid.color).scale('a', 0.22).toString();

            // Fill in defaults for axis options, including any unspecified
            // font-spec fields, if a font-spec was provided.

            // If no x/y axis options were provided, create one of each anyway,
            // since the rest of the code assumes that they exist.

            var i, axisOptions, axisCount,
                fontSize = placeholder.css("font-size"),
                fontSizeDefault = fontSize ? +fontSize.replace("px", "") : 13,
                fontDefaults = {
                    style: placeholder.css("font-style"),
                    size: Math.round(0.8 * fontSizeDefault),
                    variant: placeholder.css("font-variant"),
                    weight: placeholder.css("font-weight"),
                    family: placeholder.css("font-family")
                };

            axisCount = options.xaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {

                axisOptions = options.xaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.xaxis, axisOptions);
                options.xaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            axisCount = options.yaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {

                axisOptions = options.yaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.yaxis, axisOptions);
                options.yaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            // backwards compatibility, to be removed in future
            if (options.xaxis.noTicks && options.xaxis.ticks == null)
                options.xaxis.ticks = options.xaxis.noTicks;
            if (options.yaxis.noTicks && options.yaxis.ticks == null)
                options.yaxis.ticks = options.yaxis.noTicks;
            if (options.x2axis) {
                options.xaxes[1] = $.extend(true, {}, options.xaxis, options.x2axis);
                options.xaxes[1].position = "top";
                // Override the inherit to allow the axis to auto-scale
                if (options.x2axis.min == null) {
                    options.xaxes[1].min = null;
                }
                if (options.x2axis.max == null) {
                    options.xaxes[1].max = null;
                }
            }
            if (options.y2axis) {
                options.yaxes[1] = $.extend(true, {}, options.yaxis, options.y2axis);
                options.yaxes[1].position = "right";
                // Override the inherit to allow the axis to auto-scale
                if (options.y2axis.min == null) {
                    options.yaxes[1].min = null;
                }
                if (options.y2axis.max == null) {
                    options.yaxes[1].max = null;
                }
            }
            if (options.grid.coloredAreas)
                options.grid.markings = options.grid.coloredAreas;
            if (options.grid.coloredAreasColor)
                options.grid.markingsColor = options.grid.coloredAreasColor;
            if (options.lines)
                $.extend(true, options.series.lines, options.lines);
            if (options.points)
                $.extend(true, options.series.points, options.points);
            if (options.bars)
                $.extend(true, options.series.bars, options.bars);
            if (options.shadowSize != null)
                options.series.shadowSize = options.shadowSize;
            if (options.highlightColor != null)
                options.series.highlightColor = options.highlightColor;

            // save options on axes for future reference
            for (i = 0; i < options.xaxes.length; ++i)
                getOrCreateAxis(xaxes, i + 1).options = options.xaxes[i];
            for (i = 0; i < options.yaxes.length; ++i)
                getOrCreateAxis(yaxes, i + 1).options = options.yaxes[i];

            // add hooks from options
            for (var n in hooks)
                if (options.hooks[n] && options.hooks[n].length)
                    hooks[n] = hooks[n].concat(options.hooks[n]);

            executeHooks(hooks.processOptions, [options]);
        }

        function setData(d) {
            series = parseData(d);
            fillInSeriesOptions();
            processData();
        }

        function parseData(d) {
            var res = [];
            for (var i = 0; i < d.length; ++i) {
                var s = $.extend(true, {}, options.series);

                if (d[i].data != null) {
                    s.data = d[i].data; // move the data instead of deep-copy
                    delete d[i].data;

                    $.extend(true, s, d[i]);

                    d[i].data = s.data;
                }
                else
                    s.data = d[i];
                res.push(s);
            }

            return res;
        }

        function axisNumber(obj, coord) {
            var a = obj[coord + "axis"];
            if (typeof a == "object") // if we got a real axis, extract number
                a = a.n;
            if (typeof a != "number")
                a = 1; // default to first axis
            return a;
        }

        function allAxes() {
            // return flat array without annoying null entries
            return $.grep(xaxes.concat(yaxes), function (a) { return a; });
        }

        function canvasToAxisCoords(pos) {
            // return an object with x/y corresponding to all used axes
            var res = {}, i, axis;
            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used)
                    res["x" + axis.n] = axis.c2p(pos.left);
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used)
                    res["y" + axis.n] = axis.c2p(pos.top);
            }

            if (res.x1 !== undefined)
                res.x = res.x1;
            if (res.y1 !== undefined)
                res.y = res.y1;

            return res;
        }

        function axisToCanvasCoords(pos) {
            // get canvas coords from the first pair of x/y found in pos
            var res = {}, i, axis, key;

            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used) {
                    key = "x" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "x";

                    if (pos[key] != null) {
                        res.left = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used) {
                    key = "y" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "y";

                    if (pos[key] != null) {
                        res.top = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            return res;
        }

        function getOrCreateAxis(axes, number) {
            if (!axes[number - 1])
                axes[number - 1] = {
                    n: number, // save the number for future reference
                    direction: axes == xaxes ? "x" : "y",
                    options: $.extend(true, {}, axes == xaxes ? options.xaxis : options.yaxis)
                };

            return axes[number - 1];
        }

        function fillInSeriesOptions() {

            var neededColors = series.length, maxIndex = -1, i;

            // Subtract the number of series that already have fixed colors or
            // color indexes from the number that we still need to generate.

            for (i = 0; i < series.length; ++i) {
                var sc = series[i].color;
                if (sc != null) {
                    neededColors--;
                    if (typeof sc == "number" && sc > maxIndex) {
                        maxIndex = sc;
                    }
                }
            }

            // If any of the series have fixed color indexes, then we need to
            // generate at least as many colors as the highest index.

            if (neededColors <= maxIndex) {
                neededColors = maxIndex + 1;
            }

            // Generate all the colors, using first the option colors and then
            // variations on those colors once they're exhausted.

            var c, colors = [], colorPool = options.colors,
                colorPoolSize = colorPool.length, variation = 0;

            for (i = 0; i < neededColors; i++) {

                c = $.color.parse(colorPool[i % colorPoolSize] || "#666");

                // Each time we exhaust the colors in the pool we adjust
                // a scaling factor used to produce more variations on
                // those colors. The factor alternates negative/positive
                // to produce lighter/darker colors.

                // Reset the variation after every few cycles, or else
                // it will end up producing only white or black colors.

                if (i % colorPoolSize == 0 && i) {
                    if (variation >= 0) {
                        if (variation < 0.5) {
                            variation = -variation - 0.2;
                        } else variation = 0;
                    } else variation = -variation;
                }

                colors[i] = c.scale('rgb', 1 + variation);
            }

            // Finalize the series options, filling in their colors

            var colori = 0, s;
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                // assign colors
                if (s.color == null) {
                    s.color = colors[colori].toString();
                    ++colori;
                }
                else if (typeof s.color == "number")
                    s.color = colors[s.color].toString();

                // turn on lines automatically in case nothing is set
                if (s.lines.show == null) {
                    var v, show = true;
                    for (v in s)
                        if (s[v] && s[v].show) {
                            show = false;
                            break;
                        }
                    if (show)
                        s.lines.show = true;
                }

                // If nothing was provided for lines.zero, default it to match
                // lines.fill, since areas by default should extend to zero.

                if (s.lines.zero == null) {
                    s.lines.zero = !!s.lines.fill;
                }

                // setup axes
                s.xaxis = getOrCreateAxis(xaxes, axisNumber(s, "x"));
                s.yaxis = getOrCreateAxis(yaxes, axisNumber(s, "y"));
            }
        }

        function processData() {
            var topSentry = Number.POSITIVE_INFINITY,
                bottomSentry = Number.NEGATIVE_INFINITY,
                fakeInfinity = Number.MAX_VALUE,
                i, j, k, m, length,
                s, points, ps, x, y, axis, val, f, p,
                data, format;

            function updateAxis(axis, min, max) {
                if (min < axis.datamin && min != -fakeInfinity)
                    axis.datamin = min;
                if (max > axis.datamax && max != fakeInfinity)
                    axis.datamax = max;
            }

            $.each(allAxes(), function (_, axis) {
                // init axis
                axis.datamin = topSentry;
                axis.datamax = bottomSentry;
                axis.used = false;
            });

            for (i = 0; i < series.length; ++i) {
                s = series[i];
                s.datapoints = { points: [] };

                executeHooks(hooks.processRawData, [ s, s.data, s.datapoints ]);
            }

            // first pass: clean and copy data
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                data = s.data;
                format = s.datapoints.format;

                if (!format) {
                    format = [];
                    // find out how to copy
                    format.push({ x: true, number: true, required: true });
                    format.push({ y: true, number: true, required: true });

                    if (s.bars.show || (s.lines.show && s.lines.fill)) {
                        var autoscale = !!((s.bars.show && s.bars.zero) || (s.lines.show && s.lines.zero));
                        format.push({ y: true, number: true, required: false, defaultValue: 0, autoscale: autoscale });
                        if (s.bars.horizontal) {
                            delete format[format.length - 1].y;
                            format[format.length - 1].x = true;
                        }
                    }

                    s.datapoints.format = format;
                }

                if (s.datapoints.pointsize != null)
                    continue; // already filled in

                s.datapoints.pointsize = format.length;

                ps = s.datapoints.pointsize;
                points = s.datapoints.points;

                var insertSteps = s.lines.show && s.lines.steps;
                s.xaxis.used = s.yaxis.used = true;

                for (j = k = 0; j < data.length; ++j, k += ps) {
                    p = data[j];

                    var nullify = p == null;
                    if (!nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = p[m];
                            f = format[m];

                            if (f) {
                                if (f.number && val != null) {
                                    val = +val; // convert to number
                                    if (isNaN(val))
                                        val = null;
                                    else if (val == Infinity)
                                        val = fakeInfinity;
                                    else if (val == -Infinity)
                                        val = -fakeInfinity;
                                }

                                if (val == null) {
                                    if (f.required)
                                        nullify = true;

                                    if (f.defaultValue != null)
                                        val = f.defaultValue;
                                }
                            }

                            points[k + m] = val;
                        }
                    }

                    if (nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = points[k + m];
                            if (val != null) {
                                f = format[m];
                                // extract min/max info
                                if (f.autoscale !== false) {
                                    if (f.x) {
                                        updateAxis(s.xaxis, val, val);
                                    }
                                    if (f.y) {
                                        updateAxis(s.yaxis, val, val);
                                    }
                                }
                            }
                            points[k + m] = null;
                        }
                    }
                    else {
                        // a little bit of line specific stuff that
                        // perhaps shouldn't be here, but lacking
                        // better means...
                        if (insertSteps && k > 0
                            && points[k - ps] != null
                            && points[k - ps] != points[k]
                            && points[k - ps + 1] != points[k + 1]) {
                            // copy the point to make room for a middle point
                            for (m = 0; m < ps; ++m)
                                points[k + ps + m] = points[k + m];

                            // middle point has same y
                            points[k + 1] = points[k - ps + 1];

                            // we've added a point, better reflect that
                            k += ps;
                        }
                    }
                }
            }

            // give the hooks a chance to run
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                executeHooks(hooks.processDatapoints, [ s, s.datapoints]);
            }

            // second pass: find datamax/datamin for auto-scaling
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                points = s.datapoints.points;
                ps = s.datapoints.pointsize;
                format = s.datapoints.format;

                var xmin = topSentry, ymin = topSentry,
                    xmax = bottomSentry, ymax = bottomSentry;

                for (j = 0; j < points.length; j += ps) {
                    if (points[j] == null)
                        continue;

                    for (m = 0; m < ps; ++m) {
                        val = points[j + m];
                        f = format[m];
                        if (!f || f.autoscale === false || val == fakeInfinity || val == -fakeInfinity)
                            continue;

                        if (f.x) {
                            if (val < xmin)
                                xmin = val;
                            if (val > xmax)
                                xmax = val;
                        }
                        if (f.y) {
                            if (val < ymin)
                                ymin = val;
                            if (val > ymax)
                                ymax = val;
                        }
                    }
                }

                if (s.bars.show) {
                    // make sure we got room for the bar on the dancing floor
                    var delta;

                    switch (s.bars.align) {
                        case "left":
                            delta = 0;
                            break;
                        case "right":
                            delta = -s.bars.barWidth;
                            break;
                        default:
                            delta = -s.bars.barWidth / 2;
                    }

                    if (s.bars.horizontal) {
                        ymin += delta;
                        ymax += delta + s.bars.barWidth;
                    }
                    else {
                        xmin += delta;
                        xmax += delta + s.bars.barWidth;
                    }
                }

                updateAxis(s.xaxis, xmin, xmax);
                updateAxis(s.yaxis, ymin, ymax);
            }

            $.each(allAxes(), function (_, axis) {
                if (axis.datamin == topSentry)
                    axis.datamin = null;
                if (axis.datamax == bottomSentry)
                    axis.datamax = null;
            });
        }

        function setupCanvases() {

            // Make sure the placeholder is clear of everything except canvases
            // from a previous plot in this container that we'll try to re-use.

            placeholder.css("padding", 0) // padding messes up the positioning
                .children().filter(function(){
                    return !$(this).hasClass("flot-overlay") && !$(this).hasClass('flot-base');
                }).remove();

            if (placeholder.css("position") == 'static')
                placeholder.css("position", "relative"); // for positioning labels and overlay

            surface = new Canvas("flot-base", placeholder);
            overlay = new Canvas("flot-overlay", placeholder); // overlay canvas for interactive features

            ctx = surface.context;
            octx = overlay.context;

            // define which element we're listening for events on
            eventHolder = $(overlay.element).unbind();

            // If we're re-using a plot object, shut down the old one

            var existing = placeholder.data("plot");

            if (existing) {
                existing.shutdown();
                overlay.clear();
            }

            // save in case we get replotted
            placeholder.data("plot", plot);
        }

        function bindEvents() {
            // bind events
            if (options.grid.hoverable) {
                eventHolder.mousemove(onMouseMove);

                // Use bind, rather than .mouseleave, because we officially
                // still support jQuery 1.2.6, which doesn't define a shortcut
                // for mouseenter or mouseleave.  This was a bug/oversight that
                // was fixed somewhere around 1.3.x.  We can return to using
                // .mouseleave when we drop support for 1.2.6.

                eventHolder.bind("mouseleave", onMouseLeave);
            }

            if (options.grid.clickable)
                eventHolder.click(onClick);

            executeHooks(hooks.bindEvents, [eventHolder]);
        }

        function shutdown() {
            if (redrawTimeout)
                clearTimeout(redrawTimeout);

            eventHolder.unbind("mousemove", onMouseMove);
            eventHolder.unbind("mouseleave", onMouseLeave);
            eventHolder.unbind("click", onClick);

            executeHooks(hooks.shutdown, [eventHolder]);
        }

        function setTransformationHelpers(axis) {
            // set helper functions on the axis, assumes plot area
            // has been computed already

            function identity(x) { return x; }

            var s, m, t = axis.options.transform || identity,
                it = axis.options.inverseTransform;

            // precompute how much the axis is scaling a point
            // in canvas space
            if (axis.direction == "x") {
                s = axis.scale = plotWidth / Math.abs(t(axis.max) - t(axis.min));
                m = Math.min(t(axis.max), t(axis.min));
            }
            else {
                s = axis.scale = plotHeight / Math.abs(t(axis.max) - t(axis.min));
                s = -s;
                m = Math.max(t(axis.max), t(axis.min));
            }

            // data point to canvas coordinate
            if (t == identity) // slight optimization
                axis.p2c = function (p) { return (p - m) * s; };
            else
                axis.p2c = function (p) { return (t(p) - m) * s; };
            // canvas coordinate to data point
            if (!it)
                axis.c2p = function (c) { return m + c / s; };
            else
                axis.c2p = function (c) { return it(m + c / s); };
        }

        function measureTickLabels(axis) {

            var opts = axis.options,
                ticks = axis.ticks || [],
                labelWidth = opts.labelWidth || 0,
                labelHeight = opts.labelHeight || 0,
                maxWidth = labelWidth || (axis.direction == "x" ? Math.floor(surface.width / (ticks.length || 1)) : null),
                legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                font = opts.font || "flot-tick-label tickLabel";

            for (var i = 0; i < ticks.length; ++i) {

                var t = ticks[i];

                if (!t.label)
                    continue;

                var info = surface.getTextInfo(layer, t.label, font, null, maxWidth);

                labelWidth = Math.max(labelWidth, info.width);
                labelHeight = Math.max(labelHeight, info.height);
            }

            axis.labelWidth = opts.labelWidth || labelWidth;
            axis.labelHeight = opts.labelHeight || labelHeight;
        }

        function allocateAxisBoxFirstPhase(axis) {
            // find the bounding box of the axis by looking at label
            // widths/heights and ticks, make room by diminishing the
            // plotOffset; this first phase only looks at one
            // dimension per axis, the other dimension depends on the
            // other axes so will have to wait

            var lw = axis.labelWidth,
                lh = axis.labelHeight,
                pos = axis.options.position,
                isXAxis = axis.direction === "x",
                tickLength = axis.options.tickLength,
                axisMargin = options.grid.axisMargin,
                padding = options.grid.labelMargin,
                innermost = true,
                outermost = true,
                first = true,
                found = false;

            // Determine the axis's position in its direction and on its side

            $.each(isXAxis ? xaxes : yaxes, function(i, a) {
                if (a && (a.show || a.reserveSpace)) {
                    if (a === axis) {
                        found = true;
                    } else if (a.options.position === pos) {
                        if (found) {
                            outermost = false;
                        } else {
                            innermost = false;
                        }
                    }
                    if (!found) {
                        first = false;
                    }
                }
            });

            // The outermost axis on each side has no margin

            if (outermost) {
                axisMargin = 0;
            }

            // The ticks for the first axis in each direction stretch across

            if (tickLength == null) {
                tickLength = first ? "full" : 5;
            }

            if (!isNaN(+tickLength))
                padding += +tickLength;

            if (isXAxis) {
                lh += padding;

                if (pos == "bottom") {
                    plotOffset.bottom += lh + axisMargin;
                    axis.box = { top: surface.height - plotOffset.bottom, height: lh };
                }
                else {
                    axis.box = { top: plotOffset.top + axisMargin, height: lh };
                    plotOffset.top += lh + axisMargin;
                }
            }
            else {
                lw += padding;

                if (pos == "left") {
                    axis.box = { left: plotOffset.left + axisMargin, width: lw };
                    plotOffset.left += lw + axisMargin;
                }
                else {
                    plotOffset.right += lw + axisMargin;
                    axis.box = { left: surface.width - plotOffset.right, width: lw };
                }
            }

             // save for future reference
            axis.position = pos;
            axis.tickLength = tickLength;
            axis.box.padding = padding;
            axis.innermost = innermost;
        }

        function allocateAxisBoxSecondPhase(axis) {
            // now that all axis boxes have been placed in one
            // dimension, we can set the remaining dimension coordinates
            if (axis.direction == "x") {
                axis.box.left = plotOffset.left - axis.labelWidth / 2;
                axis.box.width = surface.width - plotOffset.left - plotOffset.right + axis.labelWidth;
            }
            else {
                axis.box.top = plotOffset.top - axis.labelHeight / 2;
                axis.box.height = surface.height - plotOffset.bottom - plotOffset.top + axis.labelHeight;
            }
        }

        function adjustLayoutForThingsStickingOut() {
            // possibly adjust plot offset to ensure everything stays
            // inside the canvas and isn't clipped off

            var minMargin = options.grid.minBorderMargin,
                axis, i;

            // check stuff from the plot (FIXME: this should just read
            // a value from the series, otherwise it's impossible to
            // customize)
            if (minMargin == null) {
                minMargin = 0;
                for (i = 0; i < series.length; ++i)
                    minMargin = Math.max(minMargin, 2 * (series[i].points.radius + series[i].points.lineWidth/2));
            }

            var margins = {
                left: minMargin,
                right: minMargin,
                top: minMargin,
                bottom: minMargin
            };

            // check axis labels, note we don't check the actual
            // labels but instead use the overall width/height to not
            // jump as much around with replots
            $.each(allAxes(), function (_, axis) {
                if (axis.reserveSpace && axis.ticks && axis.ticks.length) {
                    if (axis.direction === "x") {
                        margins.left = Math.max(margins.left, axis.labelWidth / 2);
                        margins.right = Math.max(margins.right, axis.labelWidth / 2);
                    } else {
                        margins.bottom = Math.max(margins.bottom, axis.labelHeight / 2);
                        margins.top = Math.max(margins.top, axis.labelHeight / 2);
                    }
                }
            });

            plotOffset.left = Math.ceil(Math.max(margins.left, plotOffset.left));
            plotOffset.right = Math.ceil(Math.max(margins.right, plotOffset.right));
            plotOffset.top = Math.ceil(Math.max(margins.top, plotOffset.top));
            plotOffset.bottom = Math.ceil(Math.max(margins.bottom, plotOffset.bottom));
        }

        function setupGrid() {
            var i, axes = allAxes(), showGrid = options.grid.show;

            // Initialize the plot's offset from the edge of the canvas

            for (var a in plotOffset) {
                var margin = options.grid.margin || 0;
                plotOffset[a] = typeof margin == "number" ? margin : margin[a] || 0;
            }

            executeHooks(hooks.processOffset, [plotOffset]);

            // If the grid is visible, add its border width to the offset

            for (var a in plotOffset) {
                if(typeof(options.grid.borderWidth) == "object") {
                    plotOffset[a] += showGrid ? options.grid.borderWidth[a] : 0;
                }
                else {
                    plotOffset[a] += showGrid ? options.grid.borderWidth : 0;
                }
            }

            $.each(axes, function (_, axis) {
                var axisOpts = axis.options;
                axis.show = axisOpts.show == null ? axis.used : axisOpts.show;
                axis.reserveSpace = axisOpts.reserveSpace == null ? axis.show : axisOpts.reserveSpace;
                setRange(axis);
            });

            if (showGrid) {

                var allocatedAxes = $.grep(axes, function (axis) {
                    return axis.show || axis.reserveSpace;
                });

                $.each(allocatedAxes, function (_, axis) {
                    // make the ticks
                    setupTickGeneration(axis);
                    setTicks(axis);
                    snapRangeToTicks(axis, axis.ticks);
                    // find labelWidth/Height for axis
                    measureTickLabels(axis);
                });

                // with all dimensions calculated, we can compute the
                // axis bounding boxes, start from the outside
                // (reverse order)
                for (i = allocatedAxes.length - 1; i >= 0; --i)
                    allocateAxisBoxFirstPhase(allocatedAxes[i]);

                // make sure we've got enough space for things that
                // might stick out
                adjustLayoutForThingsStickingOut();

                $.each(allocatedAxes, function (_, axis) {
                    allocateAxisBoxSecondPhase(axis);
                });
            }

            plotWidth = surface.width - plotOffset.left - plotOffset.right;
            plotHeight = surface.height - plotOffset.bottom - plotOffset.top;

            // now we got the proper plot dimensions, we can compute the scaling
            $.each(axes, function (_, axis) {
                setTransformationHelpers(axis);
            });

            if (showGrid) {
                drawAxisLabels();
            }

            insertLegend();
        }

        function setRange(axis) {
            var opts = axis.options,
                min = +(opts.min != null ? opts.min : axis.datamin),
                max = +(opts.max != null ? opts.max : axis.datamax),
                delta = max - min;

            if (delta == 0.0) {
                // degenerate case
                var widen = max == 0 ? 1 : 0.01;

                if (opts.min == null)
                    min -= widen;
                // always widen max if we couldn't widen min to ensure we
                // don't fall into min == max which doesn't work
                if (opts.max == null || opts.min != null)
                    max += widen;
            }
            else {
                // consider autoscaling
                var margin = opts.autoscaleMargin;
                if (margin != null) {
                    if (opts.min == null) {
                        min -= delta * margin;
                        // make sure we don't go below zero if all values
                        // are positive
                        if (min < 0 && axis.datamin != null && axis.datamin >= 0)
                            min = 0;
                    }
                    if (opts.max == null) {
                        max += delta * margin;
                        if (max > 0 && axis.datamax != null && axis.datamax <= 0)
                            max = 0;
                    }
                }
            }
            axis.min = min;
            axis.max = max;
        }

        function setupTickGeneration(axis) {
            var opts = axis.options;

            // estimate number of ticks
            var noTicks;
            if (typeof opts.ticks == "number" && opts.ticks > 0)
                noTicks = opts.ticks;
            else
                // heuristic based on the model a*sqrt(x) fitted to
                // some data points that seemed reasonable
                noTicks = 0.3 * Math.sqrt(axis.direction == "x" ? surface.width : surface.height);

            var delta = (axis.max - axis.min) / noTicks,
                dec = -Math.floor(Math.log(delta) / Math.LN10),
                maxDec = opts.tickDecimals;

            if (maxDec != null && dec > maxDec) {
                dec = maxDec;
            }

            var magn = Math.pow(10, -dec),
                norm = delta / magn, // norm is between 1.0 and 10.0
                size;

            if (norm < 1.5) {
                size = 1;
            } else if (norm < 3) {
                size = 2;
                // special case for 2.5, requires an extra decimal
                if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
                    size = 2.5;
                    ++dec;
                }
            } else if (norm < 7.5) {
                size = 5;
            } else {
                size = 10;
            }

            size *= magn;

            if (opts.minTickSize != null && size < opts.minTickSize) {
                size = opts.minTickSize;
            }

            axis.delta = delta;
            axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
            axis.tickSize = opts.tickSize || size;

            // Time mode was moved to a plug-in in 0.8, and since so many people use it
            // we'll add an especially friendly reminder to make sure they included it.

            if (opts.mode == "time" && !axis.tickGenerator) {
                throw new Error("Time mode requires the flot.time plugin.");
            }

            // Flot supports base-10 axes; any other mode else is handled by a plug-in,
            // like flot.time.js.

            if (!axis.tickGenerator) {

                axis.tickGenerator = function (axis) {

                    var ticks = [],
                        start = floorInBase(axis.min, axis.tickSize),
                        i = 0,
                        v = Number.NaN,
                        prev;

                    do {
                        prev = v;
                        v = start + i * axis.tickSize;
                        ticks.push(v);
                        ++i;
                    } while (v < axis.max && v != prev);
                    return ticks;
                };

				axis.tickFormatter = function (value, axis) {

					var factor = axis.tickDecimals ? Math.pow(10, axis.tickDecimals) : 1;
					var formatted = "" + Math.round(value * factor) / factor;

					// If tickDecimals was specified, ensure that we have exactly that
					// much precision; otherwise default to the value's own precision.

					if (axis.tickDecimals != null) {
						var decimal = formatted.indexOf(".");
						var precision = decimal == -1 ? 0 : formatted.length - decimal - 1;
						if (precision < axis.tickDecimals) {
							return (precision ? formatted : formatted + ".") + ("" + factor).substr(1, axis.tickDecimals - precision);
						}
					}

                    return formatted;
                };
            }

            if ($.isFunction(opts.tickFormatter))
                axis.tickFormatter = function (v, axis) { return "" + opts.tickFormatter(v, axis); };

            if (opts.alignTicksWithAxis != null) {
                var otherAxis = (axis.direction == "x" ? xaxes : yaxes)[opts.alignTicksWithAxis - 1];
                if (otherAxis && otherAxis.used && otherAxis != axis) {
                    // consider snapping min/max to outermost nice ticks
                    var niceTicks = axis.tickGenerator(axis);
                    if (niceTicks.length > 0) {
                        if (opts.min == null)
                            axis.min = Math.min(axis.min, niceTicks[0]);
                        if (opts.max == null && niceTicks.length > 1)
                            axis.max = Math.max(axis.max, niceTicks[niceTicks.length - 1]);
                    }

                    axis.tickGenerator = function (axis) {
                        // copy ticks, scaled to this axis
                        var ticks = [], v, i;
                        for (i = 0; i < otherAxis.ticks.length; ++i) {
                            v = (otherAxis.ticks[i].v - otherAxis.min) / (otherAxis.max - otherAxis.min);
                            v = axis.min + v * (axis.max - axis.min);
                            ticks.push(v);
                        }
                        return ticks;
                    };

                    // we might need an extra decimal since forced
                    // ticks don't necessarily fit naturally
                    if (!axis.mode && opts.tickDecimals == null) {
                        var extraDec = Math.max(0, -Math.floor(Math.log(axis.delta) / Math.LN10) + 1),
                            ts = axis.tickGenerator(axis);

                        // only proceed if the tick interval rounded
                        // with an extra decimal doesn't give us a
                        // zero at end
                        if (!(ts.length > 1 && /\..*0$/.test((ts[1] - ts[0]).toFixed(extraDec))))
                            axis.tickDecimals = extraDec;
                    }
                }
            }
        }

        function setTicks(axis) {
            var oticks = axis.options.ticks, ticks = [];
            if (oticks == null || (typeof oticks == "number" && oticks > 0))
                ticks = axis.tickGenerator(axis);
            else if (oticks) {
                if ($.isFunction(oticks))
                    // generate the ticks
                    ticks = oticks(axis);
                else
                    ticks = oticks;
            }

            // clean up/labelify the supplied ticks, copy them over
            var i, v;
            axis.ticks = [];
            for (i = 0; i < ticks.length; ++i) {
                var label = null;
                var t = ticks[i];
                if (typeof t == "object") {
                    v = +t[0];
                    if (t.length > 1)
                        label = t[1];
                }
                else
                    v = +t;
                if (label == null)
                    label = axis.tickFormatter(v, axis);
                if (!isNaN(v))
                    axis.ticks.push({ v: v, label: label });
            }
        }

        function snapRangeToTicks(axis, ticks) {
            if (axis.options.autoscaleMargin && ticks.length > 0) {
                // snap to ticks
                if (axis.options.min == null)
                    axis.min = Math.min(axis.min, ticks[0].v);
                if (axis.options.max == null && ticks.length > 1)
                    axis.max = Math.max(axis.max, ticks[ticks.length - 1].v);
            }
        }

        function draw() {

            surface.clear();

            executeHooks(hooks.drawBackground, [ctx]);

            var grid = options.grid;

            // draw background, if any
            if (grid.show && grid.backgroundColor)
                drawBackground();

            if (grid.show && !grid.aboveData) {
                drawGrid();
            }

            for (var i = 0; i < series.length; ++i) {
                executeHooks(hooks.drawSeries, [ctx, series[i]]);
                drawSeries(series[i]);
            }

            executeHooks(hooks.draw, [ctx]);

            if (grid.show && grid.aboveData) {
                drawGrid();
            }

            surface.render();

            // A draw implies that either the axes or data have changed, so we
            // should probably update the overlay highlights as well.

            triggerRedrawOverlay();
        }

        function extractRange(ranges, coord) {
            var axis, from, to, key, axes = allAxes();

            for (var i = 0; i < axes.length; ++i) {
                axis = axes[i];
                if (axis.direction == coord) {
                    key = coord + axis.n + "axis";
                    if (!ranges[key] && axis.n == 1)
                        key = coord + "axis"; // support x1axis as xaxis
                    if (ranges[key]) {
                        from = ranges[key].from;
                        to = ranges[key].to;
                        break;
                    }
                }
            }

            // backwards-compat stuff - to be removed in future
            if (!ranges[key]) {
                axis = coord == "x" ? xaxes[0] : yaxes[0];
                from = ranges[coord + "1"];
                to = ranges[coord + "2"];
            }

            // auto-reverse as an added bonus
            if (from != null && to != null && from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }

            return { from: from, to: to, axis: axis };
        }

        function drawBackground() {
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            ctx.fillStyle = getColorOrGradient(options.grid.backgroundColor, plotHeight, 0, "rgba(255, 255, 255, 0)");
            ctx.fillRect(0, 0, plotWidth, plotHeight);
            ctx.restore();
        }

        function drawGrid() {
            var i, axes, bw, bc;

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // draw markings
            var markings = options.grid.markings;
            if (markings) {
                if ($.isFunction(markings)) {
                    axes = plot.getAxes();
                    // xmin etc. is backwards compatibility, to be
                    // removed in the future
                    axes.xmin = axes.xaxis.min;
                    axes.xmax = axes.xaxis.max;
                    axes.ymin = axes.yaxis.min;
                    axes.ymax = axes.yaxis.max;

                    markings = markings(axes);
                }

                for (i = 0; i < markings.length; ++i) {
                    var m = markings[i],
                        xrange = extractRange(m, "x"),
                        yrange = extractRange(m, "y");

                    // fill in missing
                    if (xrange.from == null)
                        xrange.from = xrange.axis.min;
                    if (xrange.to == null)
                        xrange.to = xrange.axis.max;
                    if (yrange.from == null)
                        yrange.from = yrange.axis.min;
                    if (yrange.to == null)
                        yrange.to = yrange.axis.max;

                    // clip
                    if (xrange.to < xrange.axis.min || xrange.from > xrange.axis.max ||
                        yrange.to < yrange.axis.min || yrange.from > yrange.axis.max)
                        continue;

                    xrange.from = Math.max(xrange.from, xrange.axis.min);
                    xrange.to = Math.min(xrange.to, xrange.axis.max);
                    yrange.from = Math.max(yrange.from, yrange.axis.min);
                    yrange.to = Math.min(yrange.to, yrange.axis.max);

                    var xequal = xrange.from === xrange.to,
                        yequal = yrange.from === yrange.to;

                    if (xequal && yequal) {
                        continue;
                    }

                    // then draw
                    xrange.from = Math.floor(xrange.axis.p2c(xrange.from));
                    xrange.to = Math.floor(xrange.axis.p2c(xrange.to));
                    yrange.from = Math.floor(yrange.axis.p2c(yrange.from));
                    yrange.to = Math.floor(yrange.axis.p2c(yrange.to));

                    if (xequal || yequal) {
                        var lineWidth = m.lineWidth || options.grid.markingsLineWidth,
                            subPixel = lineWidth % 2 ? 0.5 : 0;
                        ctx.beginPath();
                        ctx.strokeStyle = m.color || options.grid.markingsColor;
                        ctx.lineWidth = lineWidth;
                        if (xequal) {
                            ctx.moveTo(xrange.to + subPixel, yrange.from);
                            ctx.lineTo(xrange.to + subPixel, yrange.to);
                        } else {
                            ctx.moveTo(xrange.from, yrange.to + subPixel);
                            ctx.lineTo(xrange.to, yrange.to + subPixel);                            
                        }
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = m.color || options.grid.markingsColor;
                        ctx.fillRect(xrange.from, yrange.to,
                                     xrange.to - xrange.from,
                                     yrange.from - yrange.to);
                    }
                }
            }

            // draw the ticks
            axes = allAxes();
            bw = options.grid.borderWidth;

            for (var j = 0; j < axes.length; ++j) {
                var axis = axes[j], box = axis.box,
                    t = axis.tickLength, x, y, xoff, yoff;
                if (!axis.show || axis.ticks.length == 0)
                    continue;

                ctx.lineWidth = 1;

                // find the edges
                if (axis.direction == "x") {
                    x = 0;
                    if (t == "full")
                        y = (axis.position == "top" ? 0 : plotHeight);
                    else
                        y = box.top - plotOffset.top + (axis.position == "top" ? box.height : 0);
                }
                else {
                    y = 0;
                    if (t == "full")
                        x = (axis.position == "left" ? 0 : plotWidth);
                    else
                        x = box.left - plotOffset.left + (axis.position == "left" ? box.width : 0);
                }

                // draw tick bar
                if (!axis.innermost) {
                    ctx.strokeStyle = axis.options.color;
                    ctx.beginPath();
                    xoff = yoff = 0;
                    if (axis.direction == "x")
                        xoff = plotWidth + 1;
                    else
                        yoff = plotHeight + 1;

                    if (ctx.lineWidth == 1) {
                        if (axis.direction == "x") {
                            y = Math.floor(y) + 0.5;
                        } else {
                            x = Math.floor(x) + 0.5;
                        }
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                    ctx.stroke();
                }

                // draw ticks

                ctx.strokeStyle = axis.options.tickColor;

                ctx.beginPath();
                for (i = 0; i < axis.ticks.length; ++i) {
                    var v = axis.ticks[i].v;

                    xoff = yoff = 0;

                    if (isNaN(v) || v < axis.min || v > axis.max
                        // skip those lying on the axes if we got a border
                        || (t == "full"
                            && ((typeof bw == "object" && bw[axis.position] > 0) || bw > 0)
                            && (v == axis.min || v == axis.max)))
                        continue;

                    if (axis.direction == "x") {
                        x = axis.p2c(v);
                        yoff = t == "full" ? -plotHeight : t;

                        if (axis.position == "top")
                            yoff = -yoff;
                    }
                    else {
                        y = axis.p2c(v);
                        xoff = t == "full" ? -plotWidth : t;

                        if (axis.position == "left")
                            xoff = -xoff;
                    }

                    if (ctx.lineWidth == 1) {
                        if (axis.direction == "x")
                            x = Math.floor(x) + 0.5;
                        else
                            y = Math.floor(y) + 0.5;
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                }

                ctx.stroke();
            }


            // draw border
            if (bw) {
                // If either borderWidth or borderColor is an object, then draw the border
                // line by line instead of as one rectangle
                bc = options.grid.borderColor;
                if(typeof bw == "object" || typeof bc == "object") {
                    if (typeof bw !== "object") {
                        bw = {top: bw, right: bw, bottom: bw, left: bw};
                    }
                    if (typeof bc !== "object") {
                        bc = {top: bc, right: bc, bottom: bc, left: bc};
                    }

                    if (bw.top > 0) {
                        ctx.strokeStyle = bc.top;
                        ctx.lineWidth = bw.top;
                        ctx.beginPath();
                        ctx.moveTo(0 - bw.left, 0 - bw.top/2);
                        ctx.lineTo(plotWidth, 0 - bw.top/2);
                        ctx.stroke();
                    }

                    if (bw.right > 0) {
                        ctx.strokeStyle = bc.right;
                        ctx.lineWidth = bw.right;
                        ctx.beginPath();
                        ctx.moveTo(plotWidth + bw.right / 2, 0 - bw.top);
                        ctx.lineTo(plotWidth + bw.right / 2, plotHeight);
                        ctx.stroke();
                    }

                    if (bw.bottom > 0) {
                        ctx.strokeStyle = bc.bottom;
                        ctx.lineWidth = bw.bottom;
                        ctx.beginPath();
                        ctx.moveTo(plotWidth + bw.right, plotHeight + bw.bottom / 2);
                        ctx.lineTo(0, plotHeight + bw.bottom / 2);
                        ctx.stroke();
                    }

                    if (bw.left > 0) {
                        ctx.strokeStyle = bc.left;
                        ctx.lineWidth = bw.left;
                        ctx.beginPath();
                        ctx.moveTo(0 - bw.left/2, plotHeight + bw.bottom);
                        ctx.lineTo(0- bw.left/2, 0);
                        ctx.stroke();
                    }
                }
                else {
                    ctx.lineWidth = bw;
                    ctx.strokeStyle = options.grid.borderColor;
                    ctx.strokeRect(-bw/2, -bw/2, plotWidth + bw, plotHeight + bw);
                }
            }

            ctx.restore();
        }

        function drawAxisLabels() {

            $.each(allAxes(), function (_, axis) {
                var box = axis.box,
                    legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                    layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                    font = axis.options.font || "flot-tick-label tickLabel",
                    tick, x, y, halign, valign;

                // Remove text before checking for axis.show and ticks.length;
                // otherwise plugins, like flot-tickrotor, that draw their own
                // tick labels will end up with both theirs and the defaults.

                surface.removeText(layer);

                if (!axis.show || axis.ticks.length == 0)
                    return;

                for (var i = 0; i < axis.ticks.length; ++i) {

                    tick = axis.ticks[i];
                    if (!tick.label || tick.v < axis.min || tick.v > axis.max)
                        continue;

                    if (axis.direction == "x") {
                        halign = "center";
                        x = plotOffset.left + axis.p2c(tick.v);
                        if (axis.position == "bottom") {
                            y = box.top + box.padding;
                        } else {
                            y = box.top + box.height - box.padding;
                            valign = "bottom";
                        }
                    } else {
                        valign = "middle";
                        y = plotOffset.top + axis.p2c(tick.v);
                        if (axis.position == "left") {
                            x = box.left + box.width - box.padding;
                            halign = "right";
                        } else {
                            x = box.left + box.padding;
                        }
                    }

                    surface.addText(layer, x, y, tick.label, font, null, null, halign, valign);
                }
            });
        }

        function drawSeries(series) {
            if (series.lines.show)
                drawSeriesLines(series);
            if (series.bars.show)
                drawSeriesBars(series);
            if (series.points.show)
                drawSeriesPoints(series);
        }

        function drawSeriesLines(series) {
            function plotLine(datapoints, xoffset, yoffset, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    prevx = null, prevy = null;

                ctx.beginPath();
                for (var i = ps; i < points.length; i += ps) {
                    var x1 = points[i - ps], y1 = points[i - ps + 1],
                        x2 = points[i], y2 = points[i + 1];

                    if (x1 == null || x2 == null)
                        continue;

                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min) {
                        if (y2 < axisy.min)
                            continue;   // line segment is outside
                        // compute new intersection point
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min) {
                        if (y1 < axisy.min)
                            continue;
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max) {
                        if (y2 > axisy.max)
                            continue;
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max) {
                        if (y1 > axisy.max)
                            continue;
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (x1 != prevx || y1 != prevy)
                        ctx.moveTo(axisx.p2c(x1) + xoffset, axisy.p2c(y1) + yoffset);

                    prevx = x2;
                    prevy = y2;
                    ctx.lineTo(axisx.p2c(x2) + xoffset, axisy.p2c(y2) + yoffset);
                }
                ctx.stroke();
            }

            function plotLineArea(datapoints, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    bottom = Math.min(Math.max(0, axisy.min), axisy.max),
                    i = 0, top, areaOpen = false,
                    ypos = 1, segmentStart = 0, segmentEnd = 0;

                // we process each segment in two turns, first forward
                // direction to sketch out top, then once we hit the
                // end we go backwards to sketch the bottom
                while (true) {
                    if (ps > 0 && i > points.length + ps)
                        break;

                    i += ps; // ps is negative if going backwards

                    var x1 = points[i - ps],
                        y1 = points[i - ps + ypos],
                        x2 = points[i], y2 = points[i + ypos];

                    if (areaOpen) {
                        if (ps > 0 && x1 != null && x2 == null) {
                            // at turning point
                            segmentEnd = i;
                            ps = -ps;
                            ypos = 2;
                            continue;
                        }

                        if (ps < 0 && i == segmentStart + ps) {
                            // done with the reverse sweep
                            ctx.fill();
                            areaOpen = false;
                            ps = -ps;
                            ypos = 1;
                            i = segmentStart = segmentEnd + ps;
                            continue;
                        }
                    }

                    if (x1 == null || x2 == null)
                        continue;

                    // clip x values

                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (!areaOpen) {
                        // open area
                        ctx.beginPath();
                        ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
                        areaOpen = true;
                    }

                    // now first check the case where both is outside
                    if (y1 >= axisy.max && y2 >= axisy.max) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
                        continue;
                    }
                    else if (y1 <= axisy.min && y2 <= axisy.min) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
                        continue;
                    }

                    // else it's a bit more complicated, there might
                    // be a flat maxed out rectangle first, then a
                    // triangular cutout or reverse; to find these
                    // keep track of the current x values
                    var x1old = x1, x2old = x2;

                    // clip the y values, without shortcutting, we
                    // go through all cases in turn

                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // if the x value was changed we got a rectangle
                    // to fill
                    if (x1 != x1old) {
                        ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));
                        // it goes to (x1, y1), but we fill that below
                    }

                    // fill triangular section, this sometimes result
                    // in redundant points if (x1, y1) hasn't changed
                    // from previous line to, but we just ignore that
                    ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));

                    // fill the other rectangle if it's there
                    if (x2 != x2old) {
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
                        ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
                    }
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);
            ctx.lineJoin = "round";

            var lw = series.lines.lineWidth,
                sw = series.shadowSize;
            // FIXME: consider another form of shadow when filling is turned on
            if (lw > 0 && sw > 0) {
                // draw shadow as a thick and thin line with transparency
                ctx.lineWidth = sw;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                // position shadow at angle from the mid of line
                var angle = Math.PI/18;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/2), Math.cos(angle) * (lw/2 + sw/2), series.xaxis, series.yaxis);
                ctx.lineWidth = sw/2;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/4), Math.cos(angle) * (lw/2 + sw/4), series.xaxis, series.yaxis);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            var fillStyle = getFillStyle(series.lines, series.color, 0, plotHeight);
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
                plotLineArea(series.datapoints, series.xaxis, series.yaxis);
            }

            if (lw > 0)
                plotLine(series.datapoints, 0, 0, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function drawSeriesPoints(series) {
            function plotPoints(datapoints, radius, fillStyle, offset, shadow, axisx, axisy, symbol) {
                var points = datapoints.points, ps = datapoints.pointsize;

                for (var i = 0; i < points.length; i += ps) {
                    var x = points[i], y = points[i + 1];
                    if (x == null || x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                        continue;

                    ctx.beginPath();
                    x = axisx.p2c(x);
                    y = axisy.p2c(y) + offset;
                    if (symbol == "circle")
                        ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
                    else
                        symbol(ctx, x, y, radius, shadow);
                    ctx.closePath();

                    if (fillStyle) {
                        ctx.fillStyle = fillStyle;
                        ctx.fill();
                    }
                    ctx.stroke();
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            var lw = series.points.lineWidth,
                sw = series.shadowSize,
                radius = series.points.radius,
                symbol = series.points.symbol;

            // If the user sets the line width to 0, we change it to a very 
            // small value. A line width of 0 seems to force the default of 1.
            // Doing the conditional here allows the shadow setting to still be 
            // optional even with a lineWidth of 0.

            if( lw == 0 )
                lw = 0.0001;

            if (lw > 0 && sw > 0) {
                // draw shadow in two steps
                var w = sw / 2;
                ctx.lineWidth = w;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                plotPoints(series.datapoints, radius, null, w + w/2, true,
                           series.xaxis, series.yaxis, symbol);

                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                plotPoints(series.datapoints, radius, null, w/2, true,
                           series.xaxis, series.yaxis, symbol);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            plotPoints(series.datapoints, radius,
                       getFillStyle(series.points, series.color), 0, false,
                       series.xaxis, series.yaxis, symbol);
            ctx.restore();
        }

        function drawBar(x, y, b, barLeft, barRight, fillStyleCallback, axisx, axisy, c, horizontal, lineWidth) {
            var left, right, bottom, top,
                drawLeft, drawRight, drawTop, drawBottom,
                tmp;

            // in horizontal mode, we start the bar from the left
            // instead of from the bottom so it appears to be
            // horizontal rather than vertical
            if (horizontal) {
                drawBottom = drawRight = drawTop = true;
                drawLeft = false;
                left = b;
                right = x;
                top = y + barLeft;
                bottom = y + barRight;

                // account for negative bars
                if (right < left) {
                    tmp = right;
                    right = left;
                    left = tmp;
                    drawLeft = true;
                    drawRight = false;
                }
            }
            else {
                drawLeft = drawRight = drawTop = true;
                drawBottom = false;
                left = x + barLeft;
                right = x + barRight;
                bottom = b;
                top = y;

                // account for negative bars
                if (top < bottom) {
                    tmp = top;
                    top = bottom;
                    bottom = tmp;
                    drawBottom = true;
                    drawTop = false;
                }
            }

            // clip
            if (right < axisx.min || left > axisx.max ||
                top < axisy.min || bottom > axisy.max)
                return;

            if (left < axisx.min) {
                left = axisx.min;
                drawLeft = false;
            }

            if (right > axisx.max) {
                right = axisx.max;
                drawRight = false;
            }

            if (bottom < axisy.min) {
                bottom = axisy.min;
                drawBottom = false;
            }

            if (top > axisy.max) {
                top = axisy.max;
                drawTop = false;
            }

            left = axisx.p2c(left);
            bottom = axisy.p2c(bottom);
            right = axisx.p2c(right);
            top = axisy.p2c(top);

            // fill the bar
            if (fillStyleCallback) {
                c.fillStyle = fillStyleCallback(bottom, top);
                c.fillRect(left, top, right - left, bottom - top)
            }

            // draw outline
            if (lineWidth > 0 && (drawLeft || drawRight || drawTop || drawBottom)) {
                c.beginPath();

                // FIXME: inline moveTo is buggy with excanvas
                c.moveTo(left, bottom);
                if (drawLeft)
                    c.lineTo(left, top);
                else
                    c.moveTo(left, top);
                if (drawTop)
                    c.lineTo(right, top);
                else
                    c.moveTo(right, top);
                if (drawRight)
                    c.lineTo(right, bottom);
                else
                    c.moveTo(right, bottom);
                if (drawBottom)
                    c.lineTo(left, bottom);
                else
                    c.moveTo(left, bottom);
                c.stroke();
            }
        }

        function drawSeriesBars(series) {
            function plotBars(datapoints, barLeft, barRight, fillStyleCallback, axisx, axisy) {
                var points = datapoints.points, ps = datapoints.pointsize;

                for (var i = 0; i < points.length; i += ps) {
                    if (points[i] == null)
                        continue;
                    drawBar(points[i], points[i + 1], points[i + 2], barLeft, barRight, fillStyleCallback, axisx, axisy, ctx, series.bars.horizontal, series.bars.lineWidth);
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // FIXME: figure out a way to add shadows (for instance along the right edge)
            ctx.lineWidth = series.bars.lineWidth;
            ctx.strokeStyle = series.color;

            var barLeft;

            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -series.bars.barWidth;
                    break;
                default:
                    barLeft = -series.bars.barWidth / 2;
            }

            var fillStyleCallback = series.bars.fill ? function (bottom, top) { return getFillStyle(series.bars, series.color, bottom, top); } : null;
            plotBars(series.datapoints, barLeft, barLeft + series.bars.barWidth, fillStyleCallback, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function getFillStyle(filloptions, seriesColor, bottom, top) {
            var fill = filloptions.fill;
            if (!fill)
                return null;

            if (filloptions.fillColor)
                return getColorOrGradient(filloptions.fillColor, bottom, top, seriesColor);

            var c = $.color.parse(seriesColor);
            c.a = typeof fill == "number" ? fill : 0.4;
            c.normalize();
            return c.toString();
        }

        function insertLegend() {

            if (options.legend.container != null) {
                $(options.legend.container).html("");
            } else {
                placeholder.find(".legend").remove();
            }

            if (!options.legend.show) {
                return;
            }

            var fragments = [], entries = [], rowStarted = false,
                lf = options.legend.labelFormatter, s, label;

            // Build a list of legend entries, with each having a label and a color

            for (var i = 0; i < series.length; ++i) {
                s = series[i];
                if (s.label) {
                    label = lf ? lf(s.label, s) : s.label;
                    if (label) {
                        entries.push({
                            label: label,
                            color: s.color
                        });
                    }
                }
            }

            // Sort the legend using either the default or a custom comparator

            if (options.legend.sorted) {
                if ($.isFunction(options.legend.sorted)) {
                    entries.sort(options.legend.sorted);
                } else if (options.legend.sorted == "reverse") {
                	entries.reverse();
                } else {
                    var ascending = options.legend.sorted != "descending";
                    entries.sort(function(a, b) {
                        return a.label == b.label ? 0 : (
                            (a.label < b.label) != ascending ? 1 : -1   // Logical XOR
                        );
                    });
                }
            }

            // Generate markup for the list of entries, in their final order

            for (var i = 0; i < entries.length; ++i) {

                var entry = entries[i];

                if (i % options.legend.noColumns == 0) {
                    if (rowStarted)
                        fragments.push('</tr>');
                    fragments.push('<tr>');
                    rowStarted = true;
                }

                fragments.push(
                    '<td class="legendColorBox"><div style="border:1px solid ' + options.legend.labelBoxBorderColor + ';padding:1px"><div style="width:4px;height:0;border:5px solid ' + entry.color + ';overflow:hidden"></div></div></td>' +
                    '<td class="legendLabel">' + entry.label + '</td>'
                );
            }

            if (rowStarted)
                fragments.push('</tr>');

            if (fragments.length == 0)
                return;

            var table = '<table style="font-size:smaller;color:' + options.grid.color + '">' + fragments.join("") + '</table>';
            if (options.legend.container != null)
                $(options.legend.container).html(table);
            else {
                var pos = "",
                    p = options.legend.position,
                    m = options.legend.margin;
                if (m[0] == null)
                    m = [m, m];
                if (p.charAt(0) == "n")
                    pos += 'top:' + (m[1] + plotOffset.top) + 'px;';
                else if (p.charAt(0) == "s")
                    pos += 'bottom:' + (m[1] + plotOffset.bottom) + 'px;';
                if (p.charAt(1) == "e")
                    pos += 'right:' + (m[0] + plotOffset.right) + 'px;';
                else if (p.charAt(1) == "w")
                    pos += 'left:' + (m[0] + plotOffset.left) + 'px;';
                var legend = $('<div class="legend">' + table.replace('style="', 'style="position:absolute;' + pos +';') + '</div>').appendTo(placeholder);
                if (options.legend.backgroundOpacity != 0.0) {
                    // put in the transparent background
                    // separately to avoid blended labels and
                    // label boxes
                    var c = options.legend.backgroundColor;
                    if (c == null) {
                        c = options.grid.backgroundColor;
                        if (c && typeof c == "string")
                            c = $.color.parse(c);
                        else
                            c = $.color.extract(legend, 'background-color');
                        c.a = 1;
                        c = c.toString();
                    }
                    var div = legend.children();
                    $('<div style="position:absolute;width:' + div.width() + 'px;height:' + div.height() + 'px;' + pos +'background-color:' + c + ';"> </div>').prependTo(legend).css('opacity', options.legend.backgroundOpacity);
                }
            }
        }


        // interactive features

        var highlights = [],
            redrawTimeout = null;

        // returns the data item the mouse is over, or null if none is found
        function findNearbyItem(mouseX, mouseY, seriesFilter) {
            var maxDistance = options.grid.mouseActiveRadius,
                smallestDistance = maxDistance * maxDistance + 1,
                item = null, foundPoint = false, i, j, ps;

            for (i = series.length - 1; i >= 0; --i) {
                if (!seriesFilter(series[i]))
                    continue;

                var s = series[i],
                    axisx = s.xaxis,
                    axisy = s.yaxis,
                    points = s.datapoints.points,
                    mx = axisx.c2p(mouseX), // precompute some stuff to make the loop faster
                    my = axisy.c2p(mouseY),
                    maxx = maxDistance / axisx.scale,
                    maxy = maxDistance / axisy.scale;

                ps = s.datapoints.pointsize;
                // with inverse transforms, we can't use the maxx/maxy
                // optimization, sadly
                if (axisx.options.inverseTransform)
                    maxx = Number.MAX_VALUE;
                if (axisy.options.inverseTransform)
                    maxy = Number.MAX_VALUE;

                if (s.lines.show || s.points.show) {
                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1];
                        if (x == null)
                            continue;

                        // For points and lines, the cursor must be within a
                        // certain distance to the data point
                        if (x - mx > maxx || x - mx < -maxx ||
                            y - my > maxy || y - my < -maxy)
                            continue;

                        // We have to calculate distances in pixels, not in
                        // data units, because the scales of the axes may be different
                        var dx = Math.abs(axisx.p2c(x) - mouseX),
                            dy = Math.abs(axisy.p2c(y) - mouseY),
                            dist = dx * dx + dy * dy; // we save the sqrt

                        // use <= to ensure last point takes precedence
                        // (last generally means on top of)
                        if (dist < smallestDistance) {
                            smallestDistance = dist;
                            item = [i, j / ps];
                        }
                    }
                }

                if (s.bars.show && !item) { // no other point can be nearby

                    var barLeft, barRight;

                    switch (s.bars.align) {
                        case "left":
                            barLeft = 0;
                            break;
                        case "right":
                            barLeft = -s.bars.barWidth;
                            break;
                        default:
                            barLeft = -s.bars.barWidth / 2;
                    }

                    barRight = barLeft + s.bars.barWidth;

                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1], b = points[j + 2];
                        if (x == null)
                            continue;

                        // for a bar graph, the cursor must be inside the bar
                        if (series[i].bars.horizontal ?
                            (mx <= Math.max(b, x) && mx >= Math.min(b, x) &&
                             my >= y + barLeft && my <= y + barRight) :
                            (mx >= x + barLeft && mx <= x + barRight &&
                             my >= Math.min(b, y) && my <= Math.max(b, y)))
                                item = [i, j / ps];
                    }
                }
            }

            if (item) {
                i = item[0];
                j = item[1];
                ps = series[i].datapoints.pointsize;

                return { datapoint: series[i].datapoints.points.slice(j * ps, (j + 1) * ps),
                         dataIndex: j,
                         series: series[i],
                         seriesIndex: i };
            }

            return null;
        }

        function onMouseMove(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return s["hoverable"] != false; });
        }

        function onMouseLeave(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return false; });
        }

        function onClick(e) {
            triggerClickHoverEvent("plotclick", e,
                                   function (s) { return s["clickable"] != false; });
        }

        // trigger click or hover event (they send the same parameters
        // so we share their code)
        function triggerClickHoverEvent(eventname, event, seriesFilter) {
            var offset = eventHolder.offset(),
                canvasX = event.pageX - offset.left - plotOffset.left,
                canvasY = event.pageY - offset.top - plotOffset.top,
            pos = canvasToAxisCoords({ left: canvasX, top: canvasY });

            pos.pageX = event.pageX;
            pos.pageY = event.pageY;

            var item = findNearbyItem(canvasX, canvasY, seriesFilter);

            if (item) {
                // fill in mouse pos for any listeners out there
                item.pageX = parseInt(item.series.xaxis.p2c(item.datapoint[0]) + offset.left + plotOffset.left, 10);
                item.pageY = parseInt(item.series.yaxis.p2c(item.datapoint[1]) + offset.top + plotOffset.top, 10);
            }

            if (options.grid.autoHighlight) {
                // clear auto-highlights
                for (var i = 0; i < highlights.length; ++i) {
                    var h = highlights[i];
                    if (h.auto == eventname &&
                        !(item && h.series == item.series &&
                          h.point[0] == item.datapoint[0] &&
                          h.point[1] == item.datapoint[1]))
                        unhighlight(h.series, h.point);
                }

                if (item)
                    highlight(item.series, item.datapoint, eventname);
            }

            placeholder.trigger(eventname, [ pos, item ]);
        }

        function triggerRedrawOverlay() {
            var t = options.interaction.redrawOverlayInterval;
            if (t == -1) {      // skip event queue
                drawOverlay();
                return;
            }

            if (!redrawTimeout)
                redrawTimeout = setTimeout(drawOverlay, t);
        }

        function drawOverlay() {
            redrawTimeout = null;

            // draw highlights
            octx.save();
            overlay.clear();
            octx.translate(plotOffset.left, plotOffset.top);

            var i, hi;
            for (i = 0; i < highlights.length; ++i) {
                hi = highlights[i];

                if (hi.series.bars.show)
                    drawBarHighlight(hi.series, hi.point);
                else
                    drawPointHighlight(hi.series, hi.point);
            }
            octx.restore();

            executeHooks(hooks.drawOverlay, [octx]);
        }

        function highlight(s, point, auto) {
            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i == -1) {
                highlights.push({ series: s, point: point, auto: auto });

                triggerRedrawOverlay();
            }
            else if (!auto)
                highlights[i].auto = false;
        }

        function unhighlight(s, point) {
            if (s == null && point == null) {
                highlights = [];
                triggerRedrawOverlay();
                return;
            }

            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i != -1) {
                highlights.splice(i, 1);

                triggerRedrawOverlay();
            }
        }

        function indexOfHighlight(s, p) {
            for (var i = 0; i < highlights.length; ++i) {
                var h = highlights[i];
                if (h.series == s && h.point[0] == p[0]
                    && h.point[1] == p[1])
                    return i;
            }
            return -1;
        }

        function drawPointHighlight(series, point) {
            var x = point[0], y = point[1],
                axisx = series.xaxis, axisy = series.yaxis,
                highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString();

            if (x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                return;

            var pointRadius = series.points.radius + series.points.lineWidth / 2;
            octx.lineWidth = pointRadius;
            octx.strokeStyle = highlightColor;
            var radius = 1.5 * pointRadius;
            x = axisx.p2c(x);
            y = axisy.p2c(y);

            octx.beginPath();
            if (series.points.symbol == "circle")
                octx.arc(x, y, radius, 0, 2 * Math.PI, false);
            else
                series.points.symbol(octx, x, y, radius, false);
            octx.closePath();
            octx.stroke();
        }

        function drawBarHighlight(series, point) {
            var highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString(),
                fillStyle = highlightColor,
                barLeft;

            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -series.bars.barWidth;
                    break;
                default:
                    barLeft = -series.bars.barWidth / 2;
            }

            octx.lineWidth = series.bars.lineWidth;
            octx.strokeStyle = highlightColor;

            drawBar(point[0], point[1], point[2] || 0, barLeft, barLeft + series.bars.barWidth,
                    function () { return fillStyle; }, series.xaxis, series.yaxis, octx, series.bars.horizontal, series.bars.lineWidth);
        }

        function getColorOrGradient(spec, bottom, top, defaultColor) {
            if (typeof spec == "string")
                return spec;
            else {
                // assume this is a gradient spec; IE currently only
                // supports a simple vertical gradient properly, so that's
                // what we support too
                var gradient = ctx.createLinearGradient(0, top, 0, bottom);

                for (var i = 0, l = spec.colors.length; i < l; ++i) {
                    var c = spec.colors[i];
                    if (typeof c != "string") {
                        var co = $.color.parse(defaultColor);
                        if (c.brightness != null)
                            co = co.scale('rgb', c.brightness);
                        if (c.opacity != null)
                            co.a *= c.opacity;
                        c = co.toString();
                    }
                    gradient.addColorStop(i / (l - 1), c);
                }

                return gradient;
            }
        }
    }

    // Add the plot function to the top level of the jQuery object

    $.plot = function(placeholder, data, options) {
        //var t0 = new Date();
        var plot = new Plot($(placeholder), data, options, $.plot.plugins);
        //(window.console ? console.log : alert)("time used (msecs): " + ((new Date()).getTime() - t0.getTime()));
        return plot;
    };

    $.plot.version = "0.8.3";

    $.plot.plugins = [];

    // Also add the plot function as a chainable property

    $.fn.plot = function(data, options) {
        return this.each(function() {
            $.plot(this, data, options);
        });
    };

    // round to nearby lower multiple of base
    function floorInBase(n, base) {
        return base * Math.floor(n / base);
    }

})(jQuery);
/* Flot plugin for plotting textual data or categories.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

Consider a dataset like [["February", 34], ["March", 20], ...]. This plugin
allows you to plot such a dataset directly.

To enable it, you must specify mode: "categories" on the axis with the textual
labels, e.g.

	$.plot("#placeholder", data, { xaxis: { mode: "categories" } });

By default, the labels are ordered as they are met in the data series. If you
need a different ordering, you can specify "categories" on the axis options
and list the categories there:

	xaxis: {
		mode: "categories",
		categories: ["February", "March", "April"]
	}

If you need to customize the distances between the categories, you can specify
"categories" as an object mapping labels to values

	xaxis: {
		mode: "categories",
		categories: { "February": 1, "March": 3, "April": 4 }
	}

If you don't specify all categories, the remaining categories will be numbered
from the max value plus 1 (with a spacing of 1 between each).

Internally, the plugin works by transforming the input data through an auto-
generated mapping where the first category becomes 0, the second 1, etc.
Hence, a point like ["February", 34] becomes [0, 34] internally in Flot (this
is visible in hover and click events that return numbers rather than the
category labels). The plugin also overrides the tick generator to spit out the
categories as ticks instead of the values.

If you need to map a value back to its label, the mapping is always accessible
as "categories" on the axis object, e.g. plot.getAxes().xaxis.categories.

*/


(function ($) {
    var options = {
        xaxis: {
            categories: null
        },
        yaxis: {
            categories: null
        }
    };
    
    function processRawData(plot, series, data, datapoints) {
        // if categories are enabled, we need to disable
        // auto-transformation to numbers so the strings are intact
        // for later processing

        var xCategories = series.xaxis.options.mode == "categories",
            yCategories = series.yaxis.options.mode == "categories";
        
        if (!(xCategories || yCategories))
            return;

        var format = datapoints.format;

        if (!format) {
            // FIXME: auto-detection should really not be defined here
            var s = series;
            format = [];
            format.push({ x: true, number: true, required: true });
            format.push({ y: true, number: true, required: true });

            if (s.bars.show || (s.lines.show && s.lines.fill)) {
                var autoscale = !!((s.bars.show && s.bars.zero) || (s.lines.show && s.lines.zero));
                format.push({ y: true, number: true, required: false, defaultValue: 0, autoscale: autoscale });
                if (s.bars.horizontal) {
                    delete format[format.length - 1].y;
                    format[format.length - 1].x = true;
                }
            }
            
            datapoints.format = format;
        }

        for (var m = 0; m < format.length; ++m) {
            if (format[m].x && xCategories)
                format[m].number = false;
            
            if (format[m].y && yCategories)
                format[m].number = false;
        }
    }

    function getNextIndex(categories) {
        var index = -1;
        
        for (var v in categories)
            if (categories[v] > index)
                index = categories[v];

        return index + 1;
    }

    function categoriesTickGenerator(axis) {
        var res = [];
        for (var label in axis.categories) {
            var v = axis.categories[label];
            if (v >= axis.min && v <= axis.max)
                res.push([v, label]);
        }

        res.sort(function (a, b) { return a[0] - b[0]; });

        return res;
    }
    
    function setupCategoriesForAxis(series, axis, datapoints) {
        if (series[axis].options.mode != "categories")
            return;
        
        if (!series[axis].categories) {
            // parse options
            var c = {}, o = series[axis].options.categories || {};
            if ($.isArray(o)) {
                for (var i = 0; i < o.length; ++i)
                    c[o[i]] = i;
            }
            else {
                for (var v in o)
                    c[v] = o[v];
            }
            
            series[axis].categories = c;
        }

        // fix ticks
        if (!series[axis].options.ticks)
            series[axis].options.ticks = categoriesTickGenerator;

        transformPointsOnAxis(datapoints, axis, series[axis].categories);
    }
    
    function transformPointsOnAxis(datapoints, axis, categories) {
        // go through the points, transforming them
        var points = datapoints.points,
            ps = datapoints.pointsize,
            format = datapoints.format,
            formatColumn = axis.charAt(0),
            index = getNextIndex(categories);

        for (var i = 0; i < points.length; i += ps) {
            if (points[i] == null)
                continue;
            
            for (var m = 0; m < ps; ++m) {
                var val = points[i + m];

                if (val == null || !format[m][formatColumn])
                    continue;

                if (!(val in categories)) {
                    categories[val] = index;
                    ++index;
                }
                
                points[i + m] = categories[val];
            }
        }
    }

    function processDatapoints(plot, series, datapoints) {
        setupCategoriesForAxis(series, "xaxis", datapoints);
        setupCategoriesForAxis(series, "yaxis", datapoints);
    }

    function init(plot) {
        plot.hooks.processRawData.push(processRawData);
        plot.hooks.processDatapoints.push(processDatapoints);
    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'categories',
        version: '1.0'
    });
})(jQuery);
/* Flot plugin for rendering pie charts.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The plugin assumes that each series has a single data value, and that each
value is a positive integer or zero.  Negative numbers don't make sense for a
pie chart, and have unpredictable results.  The values do NOT need to be
passed in as percentages; the plugin will calculate the total and per-slice
percentages internally.

* Created by Brian Medendorp

* Updated with contributions from btburnett3, Anthony Aragues and Xavi Ivars

The plugin supports these options:

	series: {
		pie: {
			show: true/false
			radius: 0-1 for percentage of fullsize, or a specified pixel length, or 'auto'
			innerRadius: 0-1 for percentage of fullsize or a specified pixel length, for creating a donut effect
			startAngle: 0-2 factor of PI used for starting angle (in radians) i.e 3/2 starts at the top, 0 and 2 have the same result
			tilt: 0-1 for percentage to tilt the pie, where 1 is no tilt, and 0 is completely flat (nothing will show)
			offset: {
				top: integer value to move the pie up or down
				left: integer value to move the pie left or right, or 'auto'
			},
			stroke: {
				color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#FFF')
				width: integer pixel width of the stroke
			},
			label: {
				show: true/false, or 'auto'
				formatter:  a user-defined function that modifies the text/style of the label text
				radius: 0-1 for percentage of fullsize, or a specified pixel length
				background: {
					color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#000')
					opacity: 0-1
				},
				threshold: 0-1 for the percentage value at which to hide labels (if they're too small)
			},
			combine: {
				threshold: 0-1 for the percentage value at which to combine slices (if they're too small)
				color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#CCC'), if null, the plugin will automatically use the color of the first slice to be combined
				label: any text value of what the combined slice should be labeled
			}
			highlight: {
				opacity: 0-1
			}
		}
	}

More detail and specific examples can be found in the included HTML file.

*/


(function($) {

	// Maximum redraw attempts when fitting labels within the plot

	var REDRAW_ATTEMPTS = 10;

	// Factor by which to shrink the pie when fitting labels within the plot

	var REDRAW_SHRINK = 0.95;

	function init(plot) {

		var canvas = null,
			target = null,
			options = null,
			maxRadius = null,
			centerLeft = null,
			centerTop = null,
			processed = false,
			ctx = null;

		// interactive variables

		var highlights = [];

		// add hook to determine if pie plugin in enabled, and then perform necessary operations

		plot.hooks.processOptions.push(function(plot, options) {
			if (options.series.pie.show) {

				options.grid.show = false;

				// set labels.show

				if (options.series.pie.label.show == "auto") {
					if (options.legend.show) {
						options.series.pie.label.show = false;
					} else {
						options.series.pie.label.show = true;
					}
				}

				// set radius

				if (options.series.pie.radius == "auto") {
					if (options.series.pie.label.show) {
						options.series.pie.radius = 3/4;
					} else {
						options.series.pie.radius = 1;
					}
				}

				// ensure sane tilt

				if (options.series.pie.tilt > 1) {
					options.series.pie.tilt = 1;
				} else if (options.series.pie.tilt < 0) {
					options.series.pie.tilt = 0;
				}
			}
		});

		plot.hooks.bindEvents.push(function(plot, eventHolder) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				if (options.grid.hoverable) {
					eventHolder.unbind("mousemove").mousemove(onMouseMove);
				}
				if (options.grid.clickable) {
					eventHolder.unbind("click").click(onClick);
				}
			}
		});

		plot.hooks.processDatapoints.push(function(plot, series, data, datapoints) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				processDatapoints(plot, series, data, datapoints);
			}
		});

		plot.hooks.drawOverlay.push(function(plot, octx) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				drawOverlay(plot, octx);
			}
		});

		plot.hooks.draw.push(function(plot, newCtx) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				draw(plot, newCtx);
			}
		});

		function processDatapoints(plot, series, datapoints) {
			if (!processed)	{
				processed = true;
				canvas = plot.getCanvas();
				target = $(canvas).parent();
				options = plot.getOptions();
				plot.setData(combine(plot.getData()));
			}
		}

		function combine(data) {

			var total = 0,
				combined = 0,
				numCombined = 0,
				color = options.series.pie.combine.color,
				newdata = [];

			// Fix up the raw data from Flot, ensuring the data is numeric

			for (var i = 0; i < data.length; ++i) {

				var value = data[i].data;

				// If the data is an array, we'll assume that it's a standard
				// Flot x-y pair, and are concerned only with the second value.

				// Note how we use the original array, rather than creating a
				// new one; this is more efficient and preserves any extra data
				// that the user may have stored in higher indexes.

				if ($.isArray(value) && value.length == 1) {
    				value = value[0];
				}

				if ($.isArray(value)) {
					// Equivalent to $.isNumeric() but compatible with jQuery < 1.7
					if (!isNaN(parseFloat(value[1])) && isFinite(value[1])) {
						value[1] = +value[1];
					} else {
						value[1] = 0;
					}
				} else if (!isNaN(parseFloat(value)) && isFinite(value)) {
					value = [1, +value];
				} else {
					value = [1, 0];
				}

				data[i].data = [value];
			}

			// Sum up all the slices, so we can calculate percentages for each

			for (var i = 0; i < data.length; ++i) {
				total += data[i].data[0][1];
			}

			// Count the number of slices with percentages below the combine
			// threshold; if it turns out to be just one, we won't combine.

			for (var i = 0; i < data.length; ++i) {
				var value = data[i].data[0][1];
				if (value / total <= options.series.pie.combine.threshold) {
					combined += value;
					numCombined++;
					if (!color) {
						color = data[i].color;
					}
				}
			}

			for (var i = 0; i < data.length; ++i) {
				var value = data[i].data[0][1];
				if (numCombined < 2 || value / total > options.series.pie.combine.threshold) {
					newdata.push(
						$.extend(data[i], {     /* extend to allow keeping all other original data values
						                           and using them e.g. in labelFormatter. */
							data: [[1, value]],
							color: data[i].color,
							label: data[i].label,
							angle: value * Math.PI * 2 / total,
							percent: value / (total / 100)
						})
					);
				}
			}

			if (numCombined > 1) {
				newdata.push({
					data: [[1, combined]],
					color: color,
					label: options.series.pie.combine.label,
					angle: combined * Math.PI * 2 / total,
					percent: combined / (total / 100)
				});
			}

			return newdata;
		}

		function draw(plot, newCtx) {

			if (!target) {
				return; // if no series were passed
			}

			var canvasWidth = plot.getPlaceholder().width(),
				canvasHeight = plot.getPlaceholder().height(),
				legendWidth = target.children().filter(".legend").children().width() || 0;

			ctx = newCtx;

			// WARNING: HACK! REWRITE THIS CODE AS SOON AS POSSIBLE!

			// When combining smaller slices into an 'other' slice, we need to
			// add a new series.  Since Flot gives plugins no way to modify the
			// list of series, the pie plugin uses a hack where the first call
			// to processDatapoints results in a call to setData with the new
			// list of series, then subsequent processDatapoints do nothing.

			// The plugin-global 'processed' flag is used to control this hack;
			// it starts out false, and is set to true after the first call to
			// processDatapoints.

			// Unfortunately this turns future setData calls into no-ops; they
			// call processDatapoints, the flag is true, and nothing happens.

			// To fix this we'll set the flag back to false here in draw, when
			// all series have been processed, so the next sequence of calls to
			// processDatapoints once again starts out with a slice-combine.
			// This is really a hack; in 0.9 we need to give plugins a proper
			// way to modify series before any processing begins.

			processed = false;

			// calculate maximum radius and center point

			maxRadius =  Math.min(canvasWidth, canvasHeight / options.series.pie.tilt) / 2;
			centerTop = canvasHeight / 2 + options.series.pie.offset.top;
			centerLeft = canvasWidth / 2;

			if (options.series.pie.offset.left == "auto") {
				if (options.legend.position.match("w")) {
					centerLeft += legendWidth / 2;
				} else {
					centerLeft -= legendWidth / 2;
				}
				if (centerLeft < maxRadius) {
					centerLeft = maxRadius;
				} else if (centerLeft > canvasWidth - maxRadius) {
					centerLeft = canvasWidth - maxRadius;
				}
			} else {
				centerLeft += options.series.pie.offset.left;
			}

			var slices = plot.getData(),
				attempts = 0;

			// Keep shrinking the pie's radius until drawPie returns true,
			// indicating that all the labels fit, or we try too many times.

			do {
				if (attempts > 0) {
					maxRadius *= REDRAW_SHRINK;
				}
				attempts += 1;
				clear();
				if (options.series.pie.tilt <= 0.8) {
					drawShadow();
				}
			} while (!drawPie() && attempts < REDRAW_ATTEMPTS)

			if (attempts >= REDRAW_ATTEMPTS) {
				clear();
				target.prepend("<div class='error'>Could not draw pie with labels contained inside canvas</div>");
			}

			if (plot.setSeries && plot.insertLegend) {
				plot.setSeries(slices);
				plot.insertLegend();
			}

			// we're actually done at this point, just defining internal functions at this point

			function clear() {
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);
				target.children().filter(".pieLabel, .pieLabelBackground").remove();
			}

			function drawShadow() {

				var shadowLeft = options.series.pie.shadow.left;
				var shadowTop = options.series.pie.shadow.top;
				var edge = 10;
				var alpha = options.series.pie.shadow.alpha;
				var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;

				if (radius >= canvasWidth / 2 - shadowLeft || radius * options.series.pie.tilt >= canvasHeight / 2 - shadowTop || radius <= edge) {
					return;	// shadow would be outside canvas, so don't draw it
				}

				ctx.save();
				ctx.translate(shadowLeft,shadowTop);
				ctx.globalAlpha = alpha;
				ctx.fillStyle = "#000";

				// center and rotate to starting position

				ctx.translate(centerLeft,centerTop);
				ctx.scale(1, options.series.pie.tilt);

				//radius -= edge;

				for (var i = 1; i <= edge; i++) {
					ctx.beginPath();
					ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
					ctx.fill();
					radius -= i;
				}

				ctx.restore();
			}

			function drawPie() {

				var startAngle = Math.PI * options.series.pie.startAngle;
				var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;

				// center and rotate to starting position

				ctx.save();
				ctx.translate(centerLeft,centerTop);
				ctx.scale(1, options.series.pie.tilt);
				//ctx.rotate(startAngle); // start at top; -- This doesn't work properly in Opera

				// draw slices

				ctx.save();
				var currentAngle = startAngle;
				for (var i = 0; i < slices.length; ++i) {
					slices[i].startAngle = currentAngle;
					drawSlice(slices[i].angle, slices[i].color, true);
				}
				ctx.restore();

				// draw slice outlines

				if (options.series.pie.stroke.width > 0) {
					ctx.save();
					ctx.lineWidth = options.series.pie.stroke.width;
					currentAngle = startAngle;
					for (var i = 0; i < slices.length; ++i) {
						drawSlice(slices[i].angle, options.series.pie.stroke.color, false);
					}
					ctx.restore();
				}

				// draw donut hole

				drawDonutHole(ctx);

				ctx.restore();

				// Draw the labels, returning true if they fit within the plot

				if (options.series.pie.label.show) {
					return drawLabels();
				} else return true;

				function drawSlice(angle, color, fill) {

					if (angle <= 0 || isNaN(angle)) {
						return;
					}

					if (fill) {
						ctx.fillStyle = color;
					} else {
						ctx.strokeStyle = color;
						ctx.lineJoin = "round";
					}

					ctx.beginPath();
					if (Math.abs(angle - Math.PI * 2) > 0.000000001) {
						ctx.moveTo(0, 0); // Center of the pie
					}

					//ctx.arc(0, 0, radius, 0, angle, false); // This doesn't work properly in Opera
					ctx.arc(0, 0, radius,currentAngle, currentAngle + angle / 2, false);
					ctx.arc(0, 0, radius,currentAngle + angle / 2, currentAngle + angle, false);
					ctx.closePath();
					//ctx.rotate(angle); // This doesn't work properly in Opera
					currentAngle += angle;

					if (fill) {
						ctx.fill();
					} else {
						ctx.stroke();
					}
				}

				function drawLabels() {

					var currentAngle = startAngle;
					var radius = options.series.pie.label.radius > 1 ? options.series.pie.label.radius : maxRadius * options.series.pie.label.radius;

					for (var i = 0; i < slices.length; ++i) {
						if (slices[i].percent >= options.series.pie.label.threshold * 100) {
							if (!drawLabel(slices[i], currentAngle, i)) {
								return false;
							}
						}
						currentAngle += slices[i].angle;
					}

					return true;

					function drawLabel(slice, startAngle, index) {

						if (slice.data[0][1] == 0) {
							return true;
						}

						// format label text

						var lf = options.legend.labelFormatter, text, plf = options.series.pie.label.formatter;

						if (lf) {
							text = lf(slice.label, slice);
						} else {
							text = slice.label;
						}

						if (plf) {
							text = plf(text, slice);
						}

						var halfAngle = ((startAngle + slice.angle) + startAngle) / 2;
						var x = centerLeft + Math.round(Math.cos(halfAngle) * radius);
						var y = centerTop + Math.round(Math.sin(halfAngle) * radius) * options.series.pie.tilt;

						var html = "<span class='pieLabel' id='pieLabel" + index + "' style='position:absolute;top:" + y + "px;left:" + x + "px;'>" + text + "</span>";
						target.append(html);

						var label = target.children("#pieLabel" + index);
						var labelTop = (y - label.height() / 2);
						var labelLeft = (x - label.width() / 2);

						label.css("top", labelTop);
						label.css("left", labelLeft);

						// check to make sure that the label is not outside the canvas

						if (0 - labelTop > 0 || 0 - labelLeft > 0 || canvasHeight - (labelTop + label.height()) < 0 || canvasWidth - (labelLeft + label.width()) < 0) {
							return false;
						}

						if (options.series.pie.label.background.opacity != 0) {

							// put in the transparent background separately to avoid blended labels and label boxes

							var c = options.series.pie.label.background.color;

							if (c == null) {
								c = slice.color;
							}

							var pos = "top:" + labelTop + "px;left:" + labelLeft + "px;";
							$("<div class='pieLabelBackground' style='position:absolute;width:" + label.width() + "px;height:" + label.height() + "px;" + pos + "background-color:" + c + ";'></div>")
								.css("opacity", options.series.pie.label.background.opacity)
								.insertBefore(label);
						}

						return true;
					} // end individual label function
				} // end drawLabels function
			} // end drawPie function
		} // end draw function

		// Placed here because it needs to be accessed from multiple locations

		function drawDonutHole(layer) {
			if (options.series.pie.innerRadius > 0) {

				// subtract the center

				layer.save();
				var innerRadius = options.series.pie.innerRadius > 1 ? options.series.pie.innerRadius : maxRadius * options.series.pie.innerRadius;
				layer.globalCompositeOperation = "destination-out"; // this does not work with excanvas, but it will fall back to using the stroke color
				layer.beginPath();
				layer.fillStyle = options.series.pie.stroke.color;
				layer.arc(0, 0, innerRadius, 0, Math.PI * 2, false);
				layer.fill();
				layer.closePath();
				layer.restore();

				// add inner stroke

				layer.save();
				layer.beginPath();
				layer.strokeStyle = options.series.pie.stroke.color;
				layer.arc(0, 0, innerRadius, 0, Math.PI * 2, false);
				layer.stroke();
				layer.closePath();
				layer.restore();

				// TODO: add extra shadow inside hole (with a mask) if the pie is tilted.
			}
		}

		//-- Additional Interactive related functions --

		function isPointInPoly(poly, pt) {
			for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
				((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1]< poly[i][1]))
				&& (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
				&& (c = !c);
			return c;
		}

		function findNearbySlice(mouseX, mouseY) {

			var slices = plot.getData(),
				options = plot.getOptions(),
				radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius,
				x, y;

			for (var i = 0; i < slices.length; ++i) {

				var s = slices[i];

				if (s.pie.show) {

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(0, 0); // Center of the pie
					//ctx.scale(1, options.series.pie.tilt);	// this actually seems to break everything when here.
					ctx.arc(0, 0, radius, s.startAngle, s.startAngle + s.angle / 2, false);
					ctx.arc(0, 0, radius, s.startAngle + s.angle / 2, s.startAngle + s.angle, false);
					ctx.closePath();
					x = mouseX - centerLeft;
					y = mouseY - centerTop;

					if (ctx.isPointInPath) {
						if (ctx.isPointInPath(mouseX - centerLeft, mouseY - centerTop)) {
							ctx.restore();
							return {
								datapoint: [s.percent, s.data],
								dataIndex: 0,
								series: s,
								seriesIndex: i
							};
						}
					} else {

						// excanvas for IE doesn;t support isPointInPath, this is a workaround.

						var p1X = radius * Math.cos(s.startAngle),
							p1Y = radius * Math.sin(s.startAngle),
							p2X = radius * Math.cos(s.startAngle + s.angle / 4),
							p2Y = radius * Math.sin(s.startAngle + s.angle / 4),
							p3X = radius * Math.cos(s.startAngle + s.angle / 2),
							p3Y = radius * Math.sin(s.startAngle + s.angle / 2),
							p4X = radius * Math.cos(s.startAngle + s.angle / 1.5),
							p4Y = radius * Math.sin(s.startAngle + s.angle / 1.5),
							p5X = radius * Math.cos(s.startAngle + s.angle),
							p5Y = radius * Math.sin(s.startAngle + s.angle),
							arrPoly = [[0, 0], [p1X, p1Y], [p2X, p2Y], [p3X, p3Y], [p4X, p4Y], [p5X, p5Y]],
							arrPoint = [x, y];

						// TODO: perhaps do some mathmatical trickery here with the Y-coordinate to compensate for pie tilt?

						if (isPointInPoly(arrPoly, arrPoint)) {
							ctx.restore();
							return {
								datapoint: [s.percent, s.data],
								dataIndex: 0,
								series: s,
								seriesIndex: i
							};
						}
					}

					ctx.restore();
				}
			}

			return null;
		}

		function onMouseMove(e) {
			triggerClickHoverEvent("plothover", e);
		}

		function onClick(e) {
			triggerClickHoverEvent("plotclick", e);
		}

		// trigger click or hover event (they send the same parameters so we share their code)

		function triggerClickHoverEvent(eventname, e) {

			var offset = plot.offset();
			var canvasX = parseInt(e.pageX - offset.left);
			var canvasY =  parseInt(e.pageY - offset.top);
			var item = findNearbySlice(canvasX, canvasY);

			if (options.grid.autoHighlight) {

				// clear auto-highlights

				for (var i = 0; i < highlights.length; ++i) {
					var h = highlights[i];
					if (h.auto == eventname && !(item && h.series == item.series)) {
						unhighlight(h.series);
					}
				}
			}

			// highlight the slice

			if (item) {
				highlight(item.series, eventname);
			}

			// trigger any hover bind events

			var pos = { pageX: e.pageX, pageY: e.pageY };
			target.trigger(eventname, [pos, item]);
		}

		function highlight(s, auto) {
			//if (typeof s == "number") {
			//	s = series[s];
			//}

			var i = indexOfHighlight(s);

			if (i == -1) {
				highlights.push({ series: s, auto: auto });
				plot.triggerRedrawOverlay();
			} else if (!auto) {
				highlights[i].auto = false;
			}
		}

		function unhighlight(s) {
			if (s == null) {
				highlights = [];
				plot.triggerRedrawOverlay();
			}

			//if (typeof s == "number") {
			//	s = series[s];
			//}

			var i = indexOfHighlight(s);

			if (i != -1) {
				highlights.splice(i, 1);
				plot.triggerRedrawOverlay();
			}
		}

		function indexOfHighlight(s) {
			for (var i = 0; i < highlights.length; ++i) {
				var h = highlights[i];
				if (h.series == s)
					return i;
			}
			return -1;
		}

		function drawOverlay(plot, octx) {

			var options = plot.getOptions();

			var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;

			octx.save();
			octx.translate(centerLeft, centerTop);
			octx.scale(1, options.series.pie.tilt);

			for (var i = 0; i < highlights.length; ++i) {
				drawHighlight(highlights[i].series);
			}

			drawDonutHole(octx);

			octx.restore();

			function drawHighlight(series) {

				if (series.angle <= 0 || isNaN(series.angle)) {
					return;
				}

				//octx.fillStyle = parseColor(options.series.pie.highlight.color).scale(null, null, null, options.series.pie.highlight.opacity).toString();
				octx.fillStyle = "rgba(255, 255, 255, " + options.series.pie.highlight.opacity + ")"; // this is temporary until we have access to parseColor
				octx.beginPath();
				if (Math.abs(series.angle - Math.PI * 2) > 0.000000001) {
					octx.moveTo(0, 0); // Center of the pie
				}
				octx.arc(0, 0, radius, series.startAngle, series.startAngle + series.angle / 2, false);
				octx.arc(0, 0, radius, series.startAngle + series.angle / 2, series.startAngle + series.angle, false);
				octx.closePath();
				octx.fill();
			}
		}
	} // end init (plugin body)

	// define pie specific options and their default values

	var options = {
		series: {
			pie: {
				show: false,
				radius: "auto",	// actual radius of the visible pie (based on full calculated radius if <=1, or hard pixel value)
				innerRadius: 0, /* for donut */
				startAngle: 3/2,
				tilt: 1,
				shadow: {
					left: 5,	// shadow left offset
					top: 15,	// shadow top offset
					alpha: 0.02	// shadow alpha
				},
				offset: {
					top: 0,
					left: "auto"
				},
				stroke: {
					color: "#fff",
					width: 1
				},
				label: {
					show: "auto",
					formatter: function(label, slice) {
						return "<div style='font-size:x-small;text-align:center;padding:2px;color:" + slice.color + ";'>" + label + "<br/>" + Math.round(slice.percent) + "%</div>";
					},	// formatter function
					radius: 1,	// radius at which to place the labels (based on full calculated radius if <=1, or hard pixel value)
					background: {
						color: null,
						opacity: 0
					},
					threshold: 0	// percentage at which to hide the label (i.e. the slice is too narrow)
				},
				combine: {
					threshold: -1,	// percentage at which to combine little slices into one larger slice
					color: null,	// color to give the new slice (auto-generated if null)
					label: "Other"	// label to give the new slice
				},
				highlight: {
					//color: "#fff",		// will add this functionality once parseColor is available
					opacity: 0.5
				}
			}
		}
	};

	$.plot.plugins.push({
		init: init,
		options: options,
		name: "pie",
		version: "1.1"
	});

})(jQuery);
/* Flot plugin for automatically redrawing plots as the placeholder resizes.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

It works by listening for changes on the placeholder div (through the jQuery
resize event plugin) - if the size changes, it will redraw the plot.

There are no options. If you need to disable the plugin for some plots, you
can just fix the size of their placeholders.

*/

/* Inline dependency:
 * jQuery resize event - v1.1 - 3/14/2010
 * http://benalman.com/projects/jquery-resize-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

(function($,e,t){"$:nomunge";var i=[],n=$.resize=$.extend($.resize,{}),a,r=false,s="setTimeout",u="resize",m=u+"-special-event",o="pendingDelay",l="activeDelay",f="throttleWindow";n[o]=200;n[l]=20;n[f]=true;$.event.special[u]={setup:function(){if(!n[f]&&this[s]){return false}var e=$(this);i.push(this);e.data(m,{w:e.width(),h:e.height()});if(i.length===1){a=t;h()}},teardown:function(){if(!n[f]&&this[s]){return false}var e=$(this);for(var t=i.length-1;t>=0;t--){if(i[t]==this){i.splice(t,1);break}}e.removeData(m);if(!i.length){if(r){cancelAnimationFrame(a)}else{clearTimeout(a)}a=null}},add:function(e){if(!n[f]&&this[s]){return false}var i;function a(e,n,a){var r=$(this),s=r.data(m)||{};s.w=n!==t?n:r.width();s.h=a!==t?a:r.height();i.apply(this,arguments)}if($.isFunction(e)){i=e;return a}else{i=e.handler;e.handler=a}}};function h(t){if(r===true){r=t||1}for(var s=i.length-1;s>=0;s--){var l=$(i[s]);if(l[0]==e||l.is(":visible")){var f=l.width(),c=l.height(),d=l.data(m);if(d&&(f!==d.w||c!==d.h)){l.trigger(u,[d.w=f,d.h=c]);r=t||true}}else{d=l.data(m);d.w=0;d.h=0}}if(a!==null){if(r&&(t==null||t-r<1e3)){a=e.requestAnimationFrame(h)}else{a=setTimeout(h,n[o]);r=false}}}if(!e.requestAnimationFrame){e.requestAnimationFrame=function(){return e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame||function(t,i){return e.setTimeout(function(){t((new Date).getTime())},n[l])}}()}if(!e.cancelAnimationFrame){e.cancelAnimationFrame=function(){return e.webkitCancelRequestAnimationFrame||e.mozCancelRequestAnimationFrame||e.oCancelRequestAnimationFrame||e.msCancelRequestAnimationFrame||clearTimeout}()}})(jQuery,this);

(function ($) {
    var options = { }; // no options

    function init(plot) {
        function onResize() {
            var placeholder = plot.getPlaceholder();

            // somebody might have hidden us and we can't plot
            // when we don't have the dimensions
            if (placeholder.width() == 0 || placeholder.height() == 0)
                return;

            plot.resize();
            plot.setupGrid();
            plot.draw();
        }
        
        function bindEvents(plot, eventHolder) {
            plot.getPlaceholder().resize(onResize);
        }

        function shutdown(plot, eventHolder) {
            plot.getPlaceholder().unbind("resize", onResize);
        }
        
        plot.hooks.bindEvents.push(bindEvents);
        plot.hooks.shutdown.push(shutdown);
    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'resize',
        version: '1.0'
    });
})(jQuery);
/* Pretty handling of time axes.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

Set axis.mode to "time" to enable. See the section "Time series data" in
API.txt for details.

*/


(function($) {

	var options = {
		xaxis: {
			timezone: null,		// "browser" for local to the client or timezone for timezone-js
			timeformat: null,	// format string to use
			twelveHourClock: false,	// 12 or 24 time in time mode
			monthNames: null	// list of names of months
		}
	};

	// round to nearby lower multiple of base

	function floorInBase(n, base) {
		return base * Math.floor(n / base);
	}

	// Returns a string with the date d formatted according to fmt.
	// A subset of the Open Group's strftime format is supported.

	function formatDate(d, fmt, monthNames, dayNames) {

		if (typeof d.strftime == "function") {
			return d.strftime(fmt);
		}

		var leftPad = function(n, pad) {
			n = "" + n;
			pad = "" + (pad == null ? "0" : pad);
			return n.length == 1 ? pad + n : n;
		};

		var r = [];
		var escape = false;
		var hours = d.getHours();
		var isAM = hours < 12;

		if (monthNames == null) {
			monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		}

		if (dayNames == null) {
			dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		}

		var hours12;

		if (hours > 12) {
			hours12 = hours - 12;
		} else if (hours == 0) {
			hours12 = 12;
		} else {
			hours12 = hours;
		}

		for (var i = 0; i < fmt.length; ++i) {

			var c = fmt.charAt(i);

			if (escape) {
				switch (c) {
					case 'a': c = "" + dayNames[d.getDay()]; break;
					case 'b': c = "" + monthNames[d.getMonth()]; break;
					case 'd': c = leftPad(d.getDate()); break;
					case 'e': c = leftPad(d.getDate(), " "); break;
					case 'h':	// For back-compat with 0.7; remove in 1.0
					case 'H': c = leftPad(hours); break;
					case 'I': c = leftPad(hours12); break;
					case 'l': c = leftPad(hours12, " "); break;
					case 'm': c = leftPad(d.getMonth() + 1); break;
					case 'M': c = leftPad(d.getMinutes()); break;
					// quarters not in Open Group's strftime specification
					case 'q':
						c = "" + (Math.floor(d.getMonth() / 3) + 1); break;
					case 'S': c = leftPad(d.getSeconds()); break;
					case 'y': c = leftPad(d.getFullYear() % 100); break;
					case 'Y': c = "" + d.getFullYear(); break;
					case 'p': c = (isAM) ? ("" + "am") : ("" + "pm"); break;
					case 'P': c = (isAM) ? ("" + "AM") : ("" + "PM"); break;
					case 'w': c = "" + d.getDay(); break;
				}
				r.push(c);
				escape = false;
			} else {
				if (c == "%") {
					escape = true;
				} else {
					r.push(c);
				}
			}
		}

		return r.join("");
	}

	// To have a consistent view of time-based data independent of which time
	// zone the client happens to be in we need a date-like object independent
	// of time zones.  This is done through a wrapper that only calls the UTC
	// versions of the accessor methods.

	function makeUtcWrapper(d) {

		function addProxyMethod(sourceObj, sourceMethod, targetObj, targetMethod) {
			sourceObj[sourceMethod] = function() {
				return targetObj[targetMethod].apply(targetObj, arguments);
			};
		};

		var utc = {
			date: d
		};

		// support strftime, if found

		if (d.strftime != undefined) {
			addProxyMethod(utc, "strftime", d, "strftime");
		}

		addProxyMethod(utc, "getTime", d, "getTime");
		addProxyMethod(utc, "setTime", d, "setTime");

		var props = ["Date", "Day", "FullYear", "Hours", "Milliseconds", "Minutes", "Month", "Seconds"];

		for (var p = 0; p < props.length; p++) {
			addProxyMethod(utc, "get" + props[p], d, "getUTC" + props[p]);
			addProxyMethod(utc, "set" + props[p], d, "setUTC" + props[p]);
		}

		return utc;
	};

	// select time zone strategy.  This returns a date-like object tied to the
	// desired timezone

	function dateGenerator(ts, opts) {
		if (opts.timezone == "browser") {
			return new Date(ts);
		} else if (!opts.timezone || opts.timezone == "utc") {
			return makeUtcWrapper(new Date(ts));
		} else if (typeof timezoneJS != "undefined" && typeof timezoneJS.Date != "undefined") {
			var d = new timezoneJS.Date();
			// timezone-js is fickle, so be sure to set the time zone before
			// setting the time.
			d.setTimezone(opts.timezone);
			d.setTime(ts);
			return d;
		} else {
			return makeUtcWrapper(new Date(ts));
		}
	}
	
	// map of app. size of time units in milliseconds

	var timeUnitSize = {
		"second": 1000,
		"minute": 60 * 1000,
		"hour": 60 * 60 * 1000,
		"day": 24 * 60 * 60 * 1000,
		"month": 30 * 24 * 60 * 60 * 1000,
		"quarter": 3 * 30 * 24 * 60 * 60 * 1000,
		"year": 365.2425 * 24 * 60 * 60 * 1000
	};

	// the allowed tick sizes, after 1 year we use
	// an integer algorithm

	var baseSpec = [
		[1, "second"], [2, "second"], [5, "second"], [10, "second"],
		[30, "second"], 
		[1, "minute"], [2, "minute"], [5, "minute"], [10, "minute"],
		[30, "minute"], 
		[1, "hour"], [2, "hour"], [4, "hour"],
		[8, "hour"], [12, "hour"],
		[1, "day"], [2, "day"], [3, "day"],
		[0.25, "month"], [0.5, "month"], [1, "month"],
		[2, "month"]
	];

	// we don't know which variant(s) we'll need yet, but generating both is
	// cheap

	var specMonths = baseSpec.concat([[3, "month"], [6, "month"],
		[1, "year"]]);
	var specQuarters = baseSpec.concat([[1, "quarter"], [2, "quarter"],
		[1, "year"]]);

	function init(plot) {
		plot.hooks.processOptions.push(function (plot, options) {
			$.each(plot.getAxes(), function(axisName, axis) {

				var opts = axis.options;

				if (opts.mode == "time") {
					axis.tickGenerator = function(axis) {

						var ticks = [];
						var d = dateGenerator(axis.min, opts);
						var minSize = 0;

						// make quarter use a possibility if quarters are
						// mentioned in either of these options

						var spec = (opts.tickSize && opts.tickSize[1] ===
							"quarter") ||
							(opts.minTickSize && opts.minTickSize[1] ===
							"quarter") ? specQuarters : specMonths;

						if (opts.minTickSize != null) {
							if (typeof opts.tickSize == "number") {
								minSize = opts.tickSize;
							} else {
								minSize = opts.minTickSize[0] * timeUnitSize[opts.minTickSize[1]];
							}
						}

						for (var i = 0; i < spec.length - 1; ++i) {
							if (axis.delta < (spec[i][0] * timeUnitSize[spec[i][1]]
											  + spec[i + 1][0] * timeUnitSize[spec[i + 1][1]]) / 2
								&& spec[i][0] * timeUnitSize[spec[i][1]] >= minSize) {
								break;
							}
						}

						var size = spec[i][0];
						var unit = spec[i][1];

						// special-case the possibility of several years

						if (unit == "year") {

							// if given a minTickSize in years, just use it,
							// ensuring that it's an integer

							if (opts.minTickSize != null && opts.minTickSize[1] == "year") {
								size = Math.floor(opts.minTickSize[0]);
							} else {

								var magn = Math.pow(10, Math.floor(Math.log(axis.delta / timeUnitSize.year) / Math.LN10));
								var norm = (axis.delta / timeUnitSize.year) / magn;

								if (norm < 1.5) {
									size = 1;
								} else if (norm < 3) {
									size = 2;
								} else if (norm < 7.5) {
									size = 5;
								} else {
									size = 10;
								}

								size *= magn;
							}

							// minimum size for years is 1

							if (size < 1) {
								size = 1;
							}
						}

						axis.tickSize = opts.tickSize || [size, unit];
						var tickSize = axis.tickSize[0];
						unit = axis.tickSize[1];

						var step = tickSize * timeUnitSize[unit];

						if (unit == "second") {
							d.setSeconds(floorInBase(d.getSeconds(), tickSize));
						} else if (unit == "minute") {
							d.setMinutes(floorInBase(d.getMinutes(), tickSize));
						} else if (unit == "hour") {
							d.setHours(floorInBase(d.getHours(), tickSize));
						} else if (unit == "month") {
							d.setMonth(floorInBase(d.getMonth(), tickSize));
						} else if (unit == "quarter") {
							d.setMonth(3 * floorInBase(d.getMonth() / 3,
								tickSize));
						} else if (unit == "year") {
							d.setFullYear(floorInBase(d.getFullYear(), tickSize));
						}

						// reset smaller components

						d.setMilliseconds(0);

						if (step >= timeUnitSize.minute) {
							d.setSeconds(0);
						}
						if (step >= timeUnitSize.hour) {
							d.setMinutes(0);
						}
						if (step >= timeUnitSize.day) {
							d.setHours(0);
						}
						if (step >= timeUnitSize.day * 4) {
							d.setDate(1);
						}
						if (step >= timeUnitSize.month * 2) {
							d.setMonth(floorInBase(d.getMonth(), 3));
						}
						if (step >= timeUnitSize.quarter * 2) {
							d.setMonth(floorInBase(d.getMonth(), 6));
						}
						if (step >= timeUnitSize.year) {
							d.setMonth(0);
						}

						var carry = 0;
						var v = Number.NaN;
						var prev;

						do {

							prev = v;
							v = d.getTime();
							ticks.push(v);

							if (unit == "month" || unit == "quarter") {
								if (tickSize < 1) {

									// a bit complicated - we'll divide the
									// month/quarter up but we need to take
									// care of fractions so we don't end up in
									// the middle of a day

									d.setDate(1);
									var start = d.getTime();
									d.setMonth(d.getMonth() +
										(unit == "quarter" ? 3 : 1));
									var end = d.getTime();
									d.setTime(v + carry * timeUnitSize.hour + (end - start) * tickSize);
									carry = d.getHours();
									d.setHours(0);
								} else {
									d.setMonth(d.getMonth() +
										tickSize * (unit == "quarter" ? 3 : 1));
								}
							} else if (unit == "year") {
								d.setFullYear(d.getFullYear() + tickSize);
							} else {
								d.setTime(v + step);
							}
						} while (v < axis.max && v != prev);

						return ticks;
					};

					axis.tickFormatter = function (v, axis) {

						var d = dateGenerator(v, axis.options);

						// first check global format

						if (opts.timeformat != null) {
							return formatDate(d, opts.timeformat, opts.monthNames, opts.dayNames);
						}

						// possibly use quarters if quarters are mentioned in
						// any of these places

						var useQuarters = (axis.options.tickSize &&
								axis.options.tickSize[1] == "quarter") ||
							(axis.options.minTickSize &&
								axis.options.minTickSize[1] == "quarter");

						var t = axis.tickSize[0] * timeUnitSize[axis.tickSize[1]];
						var span = axis.max - axis.min;
						var suffix = (opts.twelveHourClock) ? " %p" : "";
						var hourCode = (opts.twelveHourClock) ? "%I" : "%H";
						var fmt;

						if (t < timeUnitSize.minute) {
							fmt = hourCode + ":%M:%S" + suffix;
						} else if (t < timeUnitSize.day) {
							if (span < 2 * timeUnitSize.day) {
								fmt = hourCode + ":%M" + suffix;
							} else {
								fmt = "%b %d " + hourCode + ":%M" + suffix;
							}
						} else if (t < timeUnitSize.month) {
							fmt = "%b %d";
						} else if ((useQuarters && t < timeUnitSize.quarter) ||
							(!useQuarters && t < timeUnitSize.year)) {
							if (span < timeUnitSize.year) {
								fmt = "%b";
							} else {
								fmt = "%b %Y";
							}
						} else if (useQuarters && t < timeUnitSize.year) {
							if (span < timeUnitSize.year) {
								fmt = "Q%q";
							} else {
								fmt = "Q%q %Y";
							}
						} else {
							fmt = "%Y";
						}

						var rt = formatDate(d, fmt, opts.monthNames, opts.dayNames);

						return rt;
					};
				}
			});
		});
	}

	$.plot.plugins.push({
		init: init,
		options: options,
		name: 'time',
		version: '1.0'
	});

	// Time-axis support used to be in Flot core, which exposed the
	// formatDate function on the plot object.  Various plugins depend
	// on the function, so we need to re-expose it here.

	$.plot.formatDate = formatDate;
	$.plot.dateGenerator = dateGenerator;

})(jQuery);
/**
 * Flot plugin that provides spline interpolation for line graphs
 * author: Alex Bardas < alex.bardas@gmail.com >
 * modified by: Avi Kohn https://github.com/AMKohn
 * based on the spline interpolation described at:
 *		 http://scaledinnovation.com/analytics/splines/aboutSplines.html
 *
 * Example usage: (add in plot options series object)
 *		for linespline:
 *			series: {
 *				...
 *				lines: {
 *					show: false
 *				},
 *				splines: {
 *					show: true,
 *					tension: x, (float between 0 and 1, defaults to 0.5),
 *					lineWidth: y (number, defaults to 2),
 *					fill: z (float between 0 .. 1 or false, as in flot documentation)
 *				},
 *				...
 *			}
 *		areaspline:
 *			series: {
 *				...
 *				lines: {
 *					show: true,
 *					lineWidth: 0, (line drawing will not execute)
 *					fill: x, (float between 0 .. 1, as in flot documentation)
 *					...
 *				},
 *				splines: {
 *					show: true,
 *					tension: 0.5 (float between 0 and 1)
 *				},
 *				...
 *			}
 *
 */


(function($) {
    'use strict'

    /**
     * @param {Number} x0, y0, x1, y1: coordinates of the end (knot) points of the segment
     * @param {Number} x2, y2: the next knot (not connected, but needed to calculate p2)
     * @param {Number} tension: control how far the control points spread
     * @return {Array}: p1 -> control point, from x1 back toward x0
     * 					p2 -> the next control point, returned to become the next segment's p1
     *
     * @api private
     */
    function getControlPoints(x0, y0, x1, y1, x2, y2, tension) {

        var pow = Math.pow,
            sqrt = Math.sqrt,
            d01, d12, fa, fb, p1x, p1y, p2x, p2y;

        //  Scaling factors: distances from this knot to the previous and following knots.
        d01 = sqrt(pow(x1 - x0, 2) + pow(y1 - y0, 2));
        d12 = sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));

        fa = tension * d01 / (d01 + d12);
        fb = tension - fa;

        p1x = x1 + fa * (x0 - x2);
        p1y = y1 + fa * (y0 - y2);

        p2x = x1 - fb * (x0 - x2);
        p2y = y1 - fb * (y0 - y2);

        return [p1x, p1y, p2x, p2y];
    }

    var line = [];

    function drawLine(points, ctx, height, fill, seriesColor) {
        var c = $.color.parse(seriesColor);

        c.a = typeof fill == "number" ? fill : .3;
        c.normalize();
        c = c.toString();

        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);

        var plength = points.length;

        for (var i = 0; i < plength; i++) {
            ctx[points[i][3]].apply(ctx, points[i][2]);
        }

        ctx.stroke();

        ctx.lineWidth = 0;
        ctx.lineTo(points[plength - 1][0], height);
        ctx.lineTo(points[0][0], height);

        ctx.closePath();

        if (fill !== false) {
            ctx.fillStyle = c;
            ctx.fill();
        }
    }

    /**
     * @param {Object} ctx: canvas context
     * @param {String} type: accepted strings: 'bezier' or 'quadratic' (defaults to quadratic)
     * @param {Array} points: 2 points for which to draw the interpolation
     * @param {Array} cpoints: control points for those segment points
     *
     * @api private
     */
    function queue(ctx, type, points, cpoints) {
        if (type === void 0 || (type !== 'bezier' && type !== 'quadratic')) {
            type = 'quadratic';
        }
        type = type + 'CurveTo';

        if (line.length == 0) line.push([points[0], points[1], cpoints.concat(points.slice(2)), type]);
        else if (type == "quadraticCurveTo" && points.length == 2) {
            cpoints = cpoints.slice(0, 2).concat(points);

            line.push([points[0], points[1], cpoints, type]);
        }
        else line.push([points[2], points[3], cpoints.concat(points.slice(2)), type]);
    }

    /**
     * @param {Object} plot
     * @param {Object} ctx: canvas context
     * @param {Object} series
     *
     * @api private
     */

    function drawSpline(plot, ctx, series) {
        // Not interested if spline is not requested
        if (series.splines.show !== true) {
            return;
        }

        var cp = [],
            // array of control points
            tension = series.splines.tension || 0.5,
            idx, x, y, points = series.datapoints.points,
            ps = series.datapoints.pointsize,
            plotOffset = plot.getPlotOffset(),
            len = points.length,
            pts = [];

        line = [];

        // Cannot display a linespline/areaspline if there are less than 3 points
        if (len / ps < 4) {
            $.extend(series.lines, series.splines);
            return;
        }

        for (idx = 0; idx < len; idx += ps) {
            x = points[idx];
            y = points[idx + 1];
            if (x == null || x < series.xaxis.min || x > series.xaxis.max || y < series.yaxis.min || y > series.yaxis.max) {
                continue;
            }

            pts.push(series.xaxis.p2c(x) + plotOffset.left, series.yaxis.p2c(y) + plotOffset.top);
        }

        len = pts.length;

        // Draw an open curve, not connected at the ends
        for (idx = 0; idx < len - 2; idx += 2) {
            cp = cp.concat(getControlPoints.apply(this, pts.slice(idx, idx + 6).concat([tension])));
        }

        ctx.save();
        ctx.strokeStyle = series.color;
        ctx.lineWidth = series.splines.lineWidth;

        queue(ctx, 'quadratic', pts.slice(0, 4), cp.slice(0, 2));

        for (idx = 2; idx < len - 3; idx += 2) {
            queue(ctx, 'bezier', pts.slice(idx, idx + 4), cp.slice(2 * idx - 2, 2 * idx + 2));
        }

        queue(ctx, 'quadratic', pts.slice(len - 2, len), [cp[2 * len - 10], cp[2 * len - 9], pts[len - 4], pts[len - 3]]);

        drawLine(line, ctx, plot.height() + 10, series.splines.fill, series.color);

        ctx.restore();
    }

    $.plot.plugins.push({
        init: function(plot) {
            plot.hooks.drawSeries.push(drawSpline);
        },
        options: {
            series: {
                splines: {
                    show: false,
                    lineWidth: 2,
                    tension: 0.5,
                    fill: false
                }
            }
        },
        name: 'spline',
        version: '0.8.2'
    });
})(jQuery);
/*
 * jquery.flot.tooltip
 * 
 * description: easy-to-use tooltips for Flot charts
 * version: 0.9.0
 * authors: Krzysztof Urbas @krzysu [myviews.pl],Evan Steinkerchner @Roundaround
 * website: https://github.com/krzysu/flot.tooltip
 * 
 * build on 2016-07-26
 * released under MIT License, 2012
*/
 
!function(a){var b={tooltip:{show:!1,cssClass:"flotTip",content:"%s | X: %x | Y: %y",xDateFormat:null,yDateFormat:null,monthNames:null,dayNames:null,shifts:{x:10,y:20},defaultTheme:!0,snap:!0,lines:!1,clickTips:!1,onHover:function(a,b){},$compat:!1}};b.tooltipOpts=b.tooltip;var c=function(a){this.tipPosition={x:0,y:0},this.init(a)};c.prototype.init=function(b){function c(a){var c={};c.x=a.pageX,c.y=a.pageY,b.setTooltipPosition(c)}function d(c,d,g){f.clickmode?(a(b.getPlaceholder()).bind("plothover",e),b.hideTooltip(),f.clickmode=!1):(e(c,d,g),f.getDomElement().is(":visible")&&(a(b.getPlaceholder()).unbind("plothover",e),f.clickmode=!0))}function e(c,d,e){var g=function(a,b,c,d){return Math.sqrt((c-a)*(c-a)+(d-b)*(d-b))},h=function(a,b,c,d,e,f,h){if(!h||(h=function(a,b,c,d,e,f){if("undefined"!=typeof c)return{x:c,y:b};if("undefined"!=typeof d)return{x:a,y:d};var g,h=-1/((f-d)/(e-c));return{x:g=(e*(a*h-b+d)+c*(a*-h+b-f))/(h*(e-c)+d-f),y:h*g-h*a+b}}(a,b,c,d,e,f),h.x>=Math.min(c,e)&&h.x<=Math.max(c,e)&&h.y>=Math.min(d,f)&&h.y<=Math.max(d,f))){var i=d-f,j=e-c,k=c*f-d*e;return Math.abs(i*a+j*b+k)/Math.sqrt(i*i+j*j)}var l=g(a,b,c,d),m=g(a,b,e,f);return l>m?m:l};if(e)b.showTooltip(e,f.tooltipOptions.snap?e:d);else if(f.plotOptions.series.lines.show&&f.tooltipOptions.lines===!0){var i=f.plotOptions.grid.mouseActiveRadius,j={distance:i+1},k=d;a.each(b.getData(),function(a,c){for(var e=0,i=-1,l=1;l<c.data.length;l++)c.data[l-1][0]<=d.x&&c.data[l][0]>=d.x&&(e=l-1,i=l);if(-1===i)return void b.hideTooltip();var m={x:c.data[e][0],y:c.data[e][1]},n={x:c.data[i][0],y:c.data[i][1]},o=h(c.xaxis.p2c(d.x),c.yaxis.p2c(d.y),c.xaxis.p2c(m.x),c.yaxis.p2c(m.y),c.xaxis.p2c(n.x),c.yaxis.p2c(n.y),!1);if(o<j.distance){var p=g(m.x,m.y,d.x,d.y)<g(d.x,d.y,n.x,n.y)?e:i,q=(c.datapoints.pointsize,[d.x,m.y+(n.y-m.y)*((d.x-m.x)/(n.x-m.x))]),r={datapoint:q,dataIndex:p,series:c,seriesIndex:a};j={distance:o,item:r},f.tooltipOptions.snap&&(k={pageX:c.xaxis.p2c(q[0]),pageY:c.yaxis.p2c(q[1])})}}),j.distance<i+1?b.showTooltip(j.item,k):b.hideTooltip()}else b.hideTooltip()}var f=this,g=a.plot.plugins.length;if(this.plotPlugins=[],g)for(var h=0;g>h;h++)this.plotPlugins.push(a.plot.plugins[h].name);b.hooks.bindEvents.push(function(b,g){if(f.plotOptions=b.getOptions(),"boolean"==typeof f.plotOptions.tooltip&&(f.plotOptions.tooltipOpts.show=f.plotOptions.tooltip,f.plotOptions.tooltip=f.plotOptions.tooltipOpts,delete f.plotOptions.tooltipOpts),f.plotOptions.tooltip.show!==!1&&"undefined"!=typeof f.plotOptions.tooltip.show){f.tooltipOptions=f.plotOptions.tooltip,f.tooltipOptions.$compat?(f.wfunc="width",f.hfunc="height"):(f.wfunc="innerWidth",f.hfunc="innerHeight");f.getDomElement();a(b.getPlaceholder()).bind("plothover",e),f.tooltipOptions.clickTips&&a(b.getPlaceholder()).bind("plotclick",d),f.clickmode=!1,a(g).bind("mousemove",c)}}),b.hooks.shutdown.push(function(b,f){a(b.getPlaceholder()).unbind("plothover",e),a(b.getPlaceholder()).unbind("plotclick",d),b.removeTooltip(),a(f).unbind("mousemove",c)}),b.setTooltipPosition=function(b){var c=f.getDomElement(),d=c.outerWidth()+f.tooltipOptions.shifts.x,e=c.outerHeight()+f.tooltipOptions.shifts.y;b.x-a(window).scrollLeft()>a(window)[f.wfunc]()-d&&(b.x-=d,b.x=Math.max(b.x,0)),b.y-a(window).scrollTop()>a(window)[f.hfunc]()-e&&(b.y-=e),isNaN(b.x)?f.tipPosition.x=f.tipPosition.xPrev:(f.tipPosition.x=b.x,f.tipPosition.xPrev=b.x),isNaN(b.y)?f.tipPosition.y=f.tipPosition.yPrev:(f.tipPosition.y=b.y,f.tipPosition.yPrev=b.y)},b.showTooltip=function(a,c,d){var e=f.getDomElement(),g=f.stringFormat(f.tooltipOptions.content,a);""!==g&&(e.html(g),b.setTooltipPosition({x:f.tipPosition.x,y:f.tipPosition.y}),e.css({left:f.tipPosition.x+f.tooltipOptions.shifts.x,top:f.tipPosition.y+f.tooltipOptions.shifts.y}).show(),"function"==typeof f.tooltipOptions.onHover&&f.tooltipOptions.onHover(a,e))},b.hideTooltip=function(){f.getDomElement().hide().html("")},b.removeTooltip=function(){f.getDomElement().remove()}},c.prototype.getDomElement=function(){var b=a("<div>");return this.tooltipOptions&&this.tooltipOptions.cssClass&&(b=a("."+this.tooltipOptions.cssClass),0===b.length&&(b=a("<div />").addClass(this.tooltipOptions.cssClass),b.appendTo("body").hide().css({position:"absolute"}),this.tooltipOptions.defaultTheme&&b.css({background:"#fff","z-index":"1040",padding:"0.4em 0.6em","border-radius":"0.5em","font-size":"0.8em",border:"1px solid #111",display:"none","white-space":"nowrap"}))),b},c.prototype.stringFormat=function(a,b){var c,d,e,f,g,h=/%p\.{0,1}(\d{0,})/,i=/%s/,j=/%c/,k=/%lx/,l=/%ly/,m=/%x\.{0,1}(\d{0,})/,n=/%y\.{0,1}(\d{0,})/,o="%x",p="%y",q="%ct",r="%n";if("undefined"!=typeof b.series.threshold?(c=b.datapoint[0],d=b.datapoint[1],e=b.datapoint[2]):"undefined"!=typeof b.series.curvedLines?(c=b.datapoint[0],d=b.datapoint[1]):"undefined"!=typeof b.series.lines&&b.series.lines.steps?(c=b.series.datapoints.points[2*b.dataIndex],d=b.series.datapoints.points[2*b.dataIndex+1],e=""):(c=b.series.data[b.dataIndex][0],d=b.series.data[b.dataIndex][1],e=b.series.data[b.dataIndex][2]),null===b.series.label&&b.series.originSeries&&(b.series.label=b.series.originSeries.label),"function"==typeof a&&(a=a(b.series.label,c,d,b)),"boolean"==typeof a&&!a)return"";if(e&&(a=a.replace(q,e)),"undefined"!=typeof b.series.percent?f=b.series.percent:"undefined"!=typeof b.series.percents&&(f=b.series.percents[b.dataIndex]),"number"==typeof f&&(a=this.adjustValPrecision(h,a,f)),b.series.hasOwnProperty("pie")&&"undefined"!=typeof b.series.data[0][1]&&(g=b.series.data[0][1]),"number"==typeof g&&(a=a.replace(r,g)),a="undefined"!=typeof b.series.label?a.replace(i,b.series.label):a.replace(i,""),a="undefined"!=typeof b.series.color?a.replace(j,b.series.color):a.replace(j,""),a=this.hasAxisLabel("xaxis",b)?a.replace(k,b.series.xaxis.options.axisLabel):a.replace(k,""),a=this.hasAxisLabel("yaxis",b)?a.replace(l,b.series.yaxis.options.axisLabel):a.replace(l,""),this.isTimeMode("xaxis",b)&&this.isXDateFormat(b)&&(a=a.replace(m,this.timestampToDate(c,this.tooltipOptions.xDateFormat,b.series.xaxis.options))),this.isTimeMode("yaxis",b)&&this.isYDateFormat(b)&&(a=a.replace(n,this.timestampToDate(d,this.tooltipOptions.yDateFormat,b.series.yaxis.options))),"number"==typeof c&&(a=this.adjustValPrecision(m,a,c)),"number"==typeof d&&(a=this.adjustValPrecision(n,a,d)),"undefined"!=typeof b.series.xaxis.ticks){var s;s=this.hasRotatedXAxisTicks(b)?"rotatedTicks":"ticks";var t=b.dataIndex+b.seriesIndex;for(var u in b.series.xaxis[s])if(b.series.xaxis[s].hasOwnProperty(t)&&!this.isTimeMode("xaxis",b)){var v=this.isCategoriesMode("xaxis",b)?b.series.xaxis[s][t].label:b.series.xaxis[s][t].v;v===c&&(a=a.replace(m,b.series.xaxis[s][t].label.replace(/\$/g,"$$$$")))}}if("undefined"!=typeof b.series.yaxis.ticks)for(var w in b.series.yaxis.ticks)if(b.series.yaxis.ticks.hasOwnProperty(w)){var x=this.isCategoriesMode("yaxis",b)?b.series.yaxis.ticks[w].label:b.series.yaxis.ticks[w].v;x===d&&(a=a.replace(n,b.series.yaxis.ticks[w].label.replace(/\$/g,"$$$$")))}return"undefined"!=typeof b.series.xaxis.tickFormatter&&(a=a.replace(o,b.series.xaxis.tickFormatter(c,b.series.xaxis).replace(/\$/g,"$$"))),"undefined"!=typeof b.series.yaxis.tickFormatter&&(a=a.replace(p,b.series.yaxis.tickFormatter(d,b.series.yaxis).replace(/\$/g,"$$"))),a},c.prototype.isTimeMode=function(a,b){return"undefined"!=typeof b.series[a].options.mode&&"time"===b.series[a].options.mode},c.prototype.isXDateFormat=function(a){return"undefined"!=typeof this.tooltipOptions.xDateFormat&&null!==this.tooltipOptions.xDateFormat},c.prototype.isYDateFormat=function(a){return"undefined"!=typeof this.tooltipOptions.yDateFormat&&null!==this.tooltipOptions.yDateFormat},c.prototype.isCategoriesMode=function(a,b){return"undefined"!=typeof b.series[a].options.mode&&"categories"===b.series[a].options.mode},c.prototype.timestampToDate=function(b,c,d){var e=a.plot.dateGenerator(b,d);return a.plot.formatDate(e,c,this.tooltipOptions.monthNames,this.tooltipOptions.dayNames)},c.prototype.adjustValPrecision=function(a,b,c){var d,e=b.match(a);return null!==e&&""!==RegExp.$1&&(d=RegExp.$1,c=c.toFixed(d),b=b.replace(a,c)),b},c.prototype.hasAxisLabel=function(b,c){return-1!==a.inArray("axisLabels",this.plotPlugins)&&"undefined"!=typeof c.series[b].options.axisLabel&&c.series[b].options.axisLabel.length>0},c.prototype.hasRotatedXAxisTicks=function(b){return-1!==a.inArray("tickRotor",this.plotPlugins)&&"undefined"!=typeof b.series.xaxis.rotatedTicks};var d=function(a){new c(a)};a.plot.plugins.push({init:d,options:b,name:"tooltip",version:"0.8.5"})}(jQuery);
/**!
 * easy-pie-chart
 * Lightweight plugin to render simple, animated and retina optimized pie charts
 *
 * @license 
 * @author Robert Fleischmann <rendro87@gmail.com> (http://robert-fleischmann.de)
 * @version 2.1.7
 **/

!function(a,b){"function"==typeof define&&define.amd?define(["jquery"],function(a){return b(a)}):"object"==typeof exports?module.exports=b(require("jquery")):b(jQuery)}(this,function(a){var b=function(a,b){var c,d=document.createElement("canvas");a.appendChild(d),"object"==typeof G_vmlCanvasManager&&G_vmlCanvasManager.initElement(d);var e=d.getContext("2d");d.width=d.height=b.size;var f=1;window.devicePixelRatio>1&&(f=window.devicePixelRatio,d.style.width=d.style.height=[b.size,"px"].join(""),d.width=d.height=b.size*f,e.scale(f,f)),e.translate(b.size/2,b.size/2),e.rotate((-0.5+b.rotate/180)*Math.PI);var g=(b.size-b.lineWidth)/2;b.scaleColor&&b.scaleLength&&(g-=b.scaleLength+2),Date.now=Date.now||function(){return+new Date};var h=function(a,b,c){c=Math.min(Math.max(-1,c||0),1);var d=0>=c?!0:!1;e.beginPath(),e.arc(0,0,g,0,2*Math.PI*c,d),e.strokeStyle=a,e.lineWidth=b,e.stroke()},i=function(){var a,c;e.lineWidth=1,e.fillStyle=b.scaleColor,e.save();for(var d=24;d>0;--d)d%6===0?(c=b.scaleLength,a=0):(c=.6*b.scaleLength,a=b.scaleLength-c),e.fillRect(-b.size/2+a,0,c,1),e.rotate(Math.PI/12);e.restore()},j=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||function(a){window.setTimeout(a,1e3/60)}}(),k=function(){b.scaleColor&&i(),b.trackColor&&h(b.trackColor,b.trackWidth||b.lineWidth,1)};this.getCanvas=function(){return d},this.getCtx=function(){return e},this.clear=function(){e.clearRect(b.size/-2,b.size/-2,b.size,b.size)},this.draw=function(a){b.scaleColor||b.trackColor?e.getImageData&&e.putImageData?c?e.putImageData(c,0,0):(k(),c=e.getImageData(0,0,b.size*f,b.size*f)):(this.clear(),k()):this.clear(),e.lineCap=b.lineCap;var d;d="function"==typeof b.barColor?b.barColor(a):b.barColor,h(d,b.lineWidth,a/100)}.bind(this),this.animate=function(a,c){var d=Date.now();b.onStart(a,c);var e=function(){var f=Math.min(Date.now()-d,b.animate.duration),g=b.easing(this,f,a,c-a,b.animate.duration);this.draw(g),b.onStep(a,c,g),f>=b.animate.duration?b.onStop(a,c):j(e)}.bind(this);j(e)}.bind(this)},c=function(a,c){var d={barColor:"#ef1e25",trackColor:"#f9f9f9",scaleColor:"#dfe0e0",scaleLength:5,lineCap:"round",lineWidth:3,trackWidth:void 0,size:110,rotate:0,animate:{duration:1e3,enabled:!0},easing:function(a,b,c,d,e){return b/=e/2,1>b?d/2*b*b+c:-d/2*(--b*(b-2)-1)+c},onStart:function(a,b){},onStep:function(a,b,c){},onStop:function(a,b){}};if("undefined"!=typeof b)d.renderer=b;else{if("undefined"==typeof SVGRenderer)throw new Error("Please load either the SVG- or the CanvasRenderer");d.renderer=SVGRenderer}var e={},f=0,g=function(){this.el=a,this.options=e;for(var b in d)d.hasOwnProperty(b)&&(e[b]=c&&"undefined"!=typeof c[b]?c[b]:d[b],"function"==typeof e[b]&&(e[b]=e[b].bind(this)));"string"==typeof e.easing&&"undefined"!=typeof jQuery&&jQuery.isFunction(jQuery.easing[e.easing])?e.easing=jQuery.easing[e.easing]:e.easing=d.easing,"number"==typeof e.animate&&(e.animate={duration:e.animate,enabled:!0}),"boolean"!=typeof e.animate||e.animate||(e.animate={duration:1e3,enabled:e.animate}),this.renderer=new e.renderer(a,e),this.renderer.draw(f),a.dataset&&a.dataset.percent?this.update(parseFloat(a.dataset.percent)):a.getAttribute&&a.getAttribute("data-percent")&&this.update(parseFloat(a.getAttribute("data-percent")))}.bind(this);this.update=function(a){return a=parseFloat(a),e.animate.enabled?this.renderer.animate(f,a):this.renderer.draw(a),f=a,this}.bind(this),this.disableAnimation=function(){return e.animate.enabled=!1,this},this.enableAnimation=function(){return e.animate.enabled=!0,this},g()};a.fn.easyPieChart=function(b){return this.each(function(){var d;a.data(this,"easyPieChart")||(d=a.extend({},b,a(this).data()),a.data(this,"easyPieChart",new c(this,d)))})}});
!function(a,b){"object"==typeof exports&&"undefined"!=typeof module?module.exports=b():"function"==typeof define&&define.amd?define(b):a.moment=b()}(this,function(){"use strict";function a(){return re.apply(null,arguments)}function b(a){re=a}function c(a){return a instanceof Array||"[object Array]"===Object.prototype.toString.call(a)}function d(a){return null!=a&&"[object Object]"===Object.prototype.toString.call(a)}function e(a){var b;for(b in a)return!1;return!0}function f(a){return void 0===a}function g(a){return"number"==typeof a||"[object Number]"===Object.prototype.toString.call(a)}function h(a){return a instanceof Date||"[object Date]"===Object.prototype.toString.call(a)}function i(a,b){var c,d=[];for(c=0;c<a.length;++c)d.push(b(a[c],c));return d}function j(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function k(a,b){for(var c in b)j(b,c)&&(a[c]=b[c]);return j(b,"toString")&&(a.toString=b.toString),j(b,"valueOf")&&(a.valueOf=b.valueOf),a}function l(a,b,c,d){return sb(a,b,c,d,!0).utc()}function m(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null,rfc2822:!1,weekdayMismatch:!1}}function n(a){return null==a._pf&&(a._pf=m()),a._pf}function o(a){if(null==a._isValid){var b=n(a),c=te.call(b.parsedDateParts,function(a){return null!=a}),d=!isNaN(a._d.getTime())&&b.overflow<0&&!b.empty&&!b.invalidMonth&&!b.invalidWeekday&&!b.nullInput&&!b.invalidFormat&&!b.userInvalidated&&(!b.meridiem||b.meridiem&&c);if(a._strict&&(d=d&&0===b.charsLeftOver&&0===b.unusedTokens.length&&void 0===b.bigHour),null!=Object.isFrozen&&Object.isFrozen(a))return d;a._isValid=d}return a._isValid}function p(a){var b=l(NaN);return null!=a?k(n(b),a):n(b).userInvalidated=!0,b}function q(a,b){var c,d,e;if(f(b._isAMomentObject)||(a._isAMomentObject=b._isAMomentObject),f(b._i)||(a._i=b._i),f(b._f)||(a._f=b._f),f(b._l)||(a._l=b._l),f(b._strict)||(a._strict=b._strict),f(b._tzm)||(a._tzm=b._tzm),f(b._isUTC)||(a._isUTC=b._isUTC),f(b._offset)||(a._offset=b._offset),f(b._pf)||(a._pf=n(b)),f(b._locale)||(a._locale=b._locale),ue.length>0)for(c=0;c<ue.length;c++)d=ue[c],e=b[d],f(e)||(a[d]=e);return a}function r(b){q(this,b),this._d=new Date(null!=b._d?b._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),ve===!1&&(ve=!0,a.updateOffset(this),ve=!1)}function s(a){return a instanceof r||null!=a&&null!=a._isAMomentObject}function t(a){return a<0?Math.ceil(a)||0:Math.floor(a)}function u(a){var b=+a,c=0;return 0!==b&&isFinite(b)&&(c=t(b)),c}function v(a,b,c){var d,e=Math.min(a.length,b.length),f=Math.abs(a.length-b.length),g=0;for(d=0;d<e;d++)(c&&a[d]!==b[d]||!c&&u(a[d])!==u(b[d]))&&g++;return g+f}function w(b){a.suppressDeprecationWarnings===!1&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+b)}function x(b,c){var d=!0;return k(function(){if(null!=a.deprecationHandler&&a.deprecationHandler(null,b),d){for(var e,f=[],g=0;g<arguments.length;g++){if(e="","object"==typeof arguments[g]){e+="\n["+g+"] ";for(var h in arguments[0])e+=h+": "+arguments[0][h]+", ";e=e.slice(0,-2)}else e=arguments[g];f.push(e)}w(b+"\nArguments: "+Array.prototype.slice.call(f).join("")+"\n"+(new Error).stack),d=!1}return c.apply(this,arguments)},c)}function y(b,c){null!=a.deprecationHandler&&a.deprecationHandler(b,c),we[b]||(w(c),we[b]=!0)}function z(a){return a instanceof Function||"[object Function]"===Object.prototype.toString.call(a)}function A(a){var b,c;for(c in a)b=a[c],z(b)?this[c]=b:this["_"+c]=b;this._config=a,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source)}function B(a,b){var c,e=k({},a);for(c in b)j(b,c)&&(d(a[c])&&d(b[c])?(e[c]={},k(e[c],a[c]),k(e[c],b[c])):null!=b[c]?e[c]=b[c]:delete e[c]);for(c in a)j(a,c)&&!j(b,c)&&d(a[c])&&(e[c]=k({},e[c]));return e}function C(a){null!=a&&this.set(a)}function D(a,b,c){var d=this._calendar[a]||this._calendar.sameElse;return z(d)?d.call(b,c):d}function E(a){var b=this._longDateFormat[a],c=this._longDateFormat[a.toUpperCase()];return b||!c?b:(this._longDateFormat[a]=c.replace(/MMMM|MM|DD|dddd/g,function(a){return a.slice(1)}),this._longDateFormat[a])}function F(){return this._invalidDate}function G(a){return this._ordinal.replace("%d",a)}function H(a,b,c,d){var e=this._relativeTime[c];return z(e)?e(a,b,c,d):e.replace(/%d/i,a)}function I(a,b){var c=this._relativeTime[a>0?"future":"past"];return z(c)?c(b):c.replace(/%s/i,b)}function J(a,b){var c=a.toLowerCase();Ge[c]=Ge[c+"s"]=Ge[b]=a}function K(a){return"string"==typeof a?Ge[a]||Ge[a.toLowerCase()]:void 0}function L(a){var b,c,d={};for(c in a)j(a,c)&&(b=K(c),b&&(d[b]=a[c]));return d}function M(a,b){He[a]=b}function N(a){var b=[];for(var c in a)b.push({unit:c,priority:He[c]});return b.sort(function(a,b){return a.priority-b.priority}),b}function O(b,c){return function(d){return null!=d?(Q(this,b,d),a.updateOffset(this,c),this):P(this,b)}}function P(a,b){return a.isValid()?a._d["get"+(a._isUTC?"UTC":"")+b]():NaN}function Q(a,b,c){a.isValid()&&a._d["set"+(a._isUTC?"UTC":"")+b](c)}function R(a){return a=K(a),z(this[a])?this[a]():this}function S(a,b){if("object"==typeof a){a=L(a);for(var c=N(a),d=0;d<c.length;d++)this[c[d].unit](a[c[d].unit])}else if(a=K(a),z(this[a]))return this[a](b);return this}function T(a,b,c){var d=""+Math.abs(a),e=b-d.length,f=a>=0;return(f?c?"+":"":"-")+Math.pow(10,Math.max(0,e)).toString().substr(1)+d}function U(a,b,c,d){var e=d;"string"==typeof d&&(e=function(){return this[d]()}),a&&(Le[a]=e),b&&(Le[b[0]]=function(){return T(e.apply(this,arguments),b[1],b[2])}),c&&(Le[c]=function(){return this.localeData().ordinal(e.apply(this,arguments),a)})}function V(a){return a.match(/\[[\s\S]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function W(a){var b,c,d=a.match(Ie);for(b=0,c=d.length;b<c;b++)Le[d[b]]?d[b]=Le[d[b]]:d[b]=V(d[b]);return function(b){var e,f="";for(e=0;e<c;e++)f+=z(d[e])?d[e].call(b,a):d[e];return f}}function X(a,b){return a.isValid()?(b=Y(b,a.localeData()),Ke[b]=Ke[b]||W(b),Ke[b](a)):a.localeData().invalidDate()}function Y(a,b){function c(a){return b.longDateFormat(a)||a}var d=5;for(Je.lastIndex=0;d>=0&&Je.test(a);)a=a.replace(Je,c),Je.lastIndex=0,d-=1;return a}function Z(a,b,c){bf[a]=z(b)?b:function(a,d){return a&&c?c:b}}function $(a,b){return j(bf,a)?bf[a](b._strict,b._locale):new RegExp(_(a))}function _(a){return aa(a.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(a,b,c,d,e){return b||c||d||e}))}function aa(a){return a.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function ba(a,b){var c,d=b;for("string"==typeof a&&(a=[a]),g(b)&&(d=function(a,c){c[b]=u(a)}),c=0;c<a.length;c++)cf[a[c]]=d}function ca(a,b){ba(a,function(a,c,d,e){d._w=d._w||{},b(a,d._w,d,e)})}function da(a,b,c){null!=b&&j(cf,a)&&cf[a](b,c._a,c,a)}function ea(a,b){return new Date(Date.UTC(a,b+1,0)).getUTCDate()}function fa(a,b){return a?c(this._months)?this._months[a.month()]:this._months[(this._months.isFormat||of).test(b)?"format":"standalone"][a.month()]:c(this._months)?this._months:this._months.standalone}function ga(a,b){return a?c(this._monthsShort)?this._monthsShort[a.month()]:this._monthsShort[of.test(b)?"format":"standalone"][a.month()]:c(this._monthsShort)?this._monthsShort:this._monthsShort.standalone}function ha(a,b,c){var d,e,f,g=a.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],d=0;d<12;++d)f=l([2e3,d]),this._shortMonthsParse[d]=this.monthsShort(f,"").toLocaleLowerCase(),this._longMonthsParse[d]=this.months(f,"").toLocaleLowerCase();return c?"MMM"===b?(e=nf.call(this._shortMonthsParse,g),e!==-1?e:null):(e=nf.call(this._longMonthsParse,g),e!==-1?e:null):"MMM"===b?(e=nf.call(this._shortMonthsParse,g),e!==-1?e:(e=nf.call(this._longMonthsParse,g),e!==-1?e:null)):(e=nf.call(this._longMonthsParse,g),e!==-1?e:(e=nf.call(this._shortMonthsParse,g),e!==-1?e:null))}function ia(a,b,c){var d,e,f;if(this._monthsParseExact)return ha.call(this,a,b,c);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),d=0;d<12;d++){if(e=l([2e3,d]),c&&!this._longMonthsParse[d]&&(this._longMonthsParse[d]=new RegExp("^"+this.months(e,"").replace(".","")+"$","i"),this._shortMonthsParse[d]=new RegExp("^"+this.monthsShort(e,"").replace(".","")+"$","i")),c||this._monthsParse[d]||(f="^"+this.months(e,"")+"|^"+this.monthsShort(e,""),this._monthsParse[d]=new RegExp(f.replace(".",""),"i")),c&&"MMMM"===b&&this._longMonthsParse[d].test(a))return d;if(c&&"MMM"===b&&this._shortMonthsParse[d].test(a))return d;if(!c&&this._monthsParse[d].test(a))return d}}function ja(a,b){var c;if(!a.isValid())return a;if("string"==typeof b)if(/^\d+$/.test(b))b=u(b);else if(b=a.localeData().monthsParse(b),!g(b))return a;return c=Math.min(a.date(),ea(a.year(),b)),a._d["set"+(a._isUTC?"UTC":"")+"Month"](b,c),a}function ka(b){return null!=b?(ja(this,b),a.updateOffset(this,!0),this):P(this,"Month")}function la(){return ea(this.year(),this.month())}function ma(a){return this._monthsParseExact?(j(this,"_monthsRegex")||oa.call(this),a?this._monthsShortStrictRegex:this._monthsShortRegex):(j(this,"_monthsShortRegex")||(this._monthsShortRegex=rf),this._monthsShortStrictRegex&&a?this._monthsShortStrictRegex:this._monthsShortRegex)}function na(a){return this._monthsParseExact?(j(this,"_monthsRegex")||oa.call(this),a?this._monthsStrictRegex:this._monthsRegex):(j(this,"_monthsRegex")||(this._monthsRegex=sf),this._monthsStrictRegex&&a?this._monthsStrictRegex:this._monthsRegex)}function oa(){function a(a,b){return b.length-a.length}var b,c,d=[],e=[],f=[];for(b=0;b<12;b++)c=l([2e3,b]),d.push(this.monthsShort(c,"")),e.push(this.months(c,"")),f.push(this.months(c,"")),f.push(this.monthsShort(c,""));for(d.sort(a),e.sort(a),f.sort(a),b=0;b<12;b++)d[b]=aa(d[b]),e[b]=aa(e[b]);for(b=0;b<24;b++)f[b]=aa(f[b]);this._monthsRegex=new RegExp("^("+f.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+e.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+d.join("|")+")","i")}function pa(a){return qa(a)?366:365}function qa(a){return a%4===0&&a%100!==0||a%400===0}function ra(){return qa(this.year())}function sa(a,b,c,d,e,f,g){var h=new Date(a,b,c,d,e,f,g);return a<100&&a>=0&&isFinite(h.getFullYear())&&h.setFullYear(a),h}function ta(a){var b=new Date(Date.UTC.apply(null,arguments));return a<100&&a>=0&&isFinite(b.getUTCFullYear())&&b.setUTCFullYear(a),b}function ua(a,b,c){var d=7+b-c,e=(7+ta(a,0,d).getUTCDay()-b)%7;return-e+d-1}function va(a,b,c,d,e){var f,g,h=(7+c-d)%7,i=ua(a,d,e),j=1+7*(b-1)+h+i;return j<=0?(f=a-1,g=pa(f)+j):j>pa(a)?(f=a+1,g=j-pa(a)):(f=a,g=j),{year:f,dayOfYear:g}}function wa(a,b,c){var d,e,f=ua(a.year(),b,c),g=Math.floor((a.dayOfYear()-f-1)/7)+1;return g<1?(e=a.year()-1,d=g+xa(e,b,c)):g>xa(a.year(),b,c)?(d=g-xa(a.year(),b,c),e=a.year()+1):(e=a.year(),d=g),{week:d,year:e}}function xa(a,b,c){var d=ua(a,b,c),e=ua(a+1,b,c);return(pa(a)-d+e)/7}function ya(a){return wa(a,this._week.dow,this._week.doy).week}function za(){return this._week.dow}function Aa(){return this._week.doy}function Ba(a){var b=this.localeData().week(this);return null==a?b:this.add(7*(a-b),"d")}function Ca(a){var b=wa(this,1,4).week;return null==a?b:this.add(7*(a-b),"d")}function Da(a,b){return"string"!=typeof a?a:isNaN(a)?(a=b.weekdaysParse(a),"number"==typeof a?a:null):parseInt(a,10)}function Ea(a,b){return"string"==typeof a?b.weekdaysParse(a)%7||7:isNaN(a)?null:a}function Fa(a,b){return a?c(this._weekdays)?this._weekdays[a.day()]:this._weekdays[this._weekdays.isFormat.test(b)?"format":"standalone"][a.day()]:c(this._weekdays)?this._weekdays:this._weekdays.standalone}function Ga(a){return a?this._weekdaysShort[a.day()]:this._weekdaysShort}function Ha(a){return a?this._weekdaysMin[a.day()]:this._weekdaysMin}function Ia(a,b,c){var d,e,f,g=a.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],d=0;d<7;++d)f=l([2e3,1]).day(d),this._minWeekdaysParse[d]=this.weekdaysMin(f,"").toLocaleLowerCase(),this._shortWeekdaysParse[d]=this.weekdaysShort(f,"").toLocaleLowerCase(),this._weekdaysParse[d]=this.weekdays(f,"").toLocaleLowerCase();return c?"dddd"===b?(e=nf.call(this._weekdaysParse,g),e!==-1?e:null):"ddd"===b?(e=nf.call(this._shortWeekdaysParse,g),e!==-1?e:null):(e=nf.call(this._minWeekdaysParse,g),e!==-1?e:null):"dddd"===b?(e=nf.call(this._weekdaysParse,g),e!==-1?e:(e=nf.call(this._shortWeekdaysParse,g),e!==-1?e:(e=nf.call(this._minWeekdaysParse,g),e!==-1?e:null))):"ddd"===b?(e=nf.call(this._shortWeekdaysParse,g),e!==-1?e:(e=nf.call(this._weekdaysParse,g),e!==-1?e:(e=nf.call(this._minWeekdaysParse,g),e!==-1?e:null))):(e=nf.call(this._minWeekdaysParse,g),e!==-1?e:(e=nf.call(this._weekdaysParse,g),e!==-1?e:(e=nf.call(this._shortWeekdaysParse,g),e!==-1?e:null)))}function Ja(a,b,c){var d,e,f;if(this._weekdaysParseExact)return Ia.call(this,a,b,c);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),d=0;d<7;d++){if(e=l([2e3,1]).day(d),c&&!this._fullWeekdaysParse[d]&&(this._fullWeekdaysParse[d]=new RegExp("^"+this.weekdays(e,"").replace(".",".?")+"$","i"),this._shortWeekdaysParse[d]=new RegExp("^"+this.weekdaysShort(e,"").replace(".",".?")+"$","i"),this._minWeekdaysParse[d]=new RegExp("^"+this.weekdaysMin(e,"").replace(".",".?")+"$","i")),this._weekdaysParse[d]||(f="^"+this.weekdays(e,"")+"|^"+this.weekdaysShort(e,"")+"|^"+this.weekdaysMin(e,""),this._weekdaysParse[d]=new RegExp(f.replace(".",""),"i")),c&&"dddd"===b&&this._fullWeekdaysParse[d].test(a))return d;if(c&&"ddd"===b&&this._shortWeekdaysParse[d].test(a))return d;if(c&&"dd"===b&&this._minWeekdaysParse[d].test(a))return d;if(!c&&this._weekdaysParse[d].test(a))return d}}function Ka(a){if(!this.isValid())return null!=a?this:NaN;var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=a?(a=Da(a,this.localeData()),this.add(a-b,"d")):b}function La(a){if(!this.isValid())return null!=a?this:NaN;var b=(this.day()+7-this.localeData()._week.dow)%7;return null==a?b:this.add(a-b,"d")}function Ma(a){if(!this.isValid())return null!=a?this:NaN;if(null!=a){var b=Ea(a,this.localeData());return this.day(this.day()%7?b:b-7)}return this.day()||7}function Na(a){return this._weekdaysParseExact?(j(this,"_weekdaysRegex")||Qa.call(this),a?this._weekdaysStrictRegex:this._weekdaysRegex):(j(this,"_weekdaysRegex")||(this._weekdaysRegex=yf),this._weekdaysStrictRegex&&a?this._weekdaysStrictRegex:this._weekdaysRegex)}function Oa(a){return this._weekdaysParseExact?(j(this,"_weekdaysRegex")||Qa.call(this),a?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(j(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=zf),this._weekdaysShortStrictRegex&&a?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)}function Pa(a){return this._weekdaysParseExact?(j(this,"_weekdaysRegex")||Qa.call(this),a?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(j(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=Af),this._weekdaysMinStrictRegex&&a?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)}function Qa(){function a(a,b){return b.length-a.length}var b,c,d,e,f,g=[],h=[],i=[],j=[];for(b=0;b<7;b++)c=l([2e3,1]).day(b),d=this.weekdaysMin(c,""),e=this.weekdaysShort(c,""),f=this.weekdays(c,""),g.push(d),h.push(e),i.push(f),j.push(d),j.push(e),j.push(f);for(g.sort(a),h.sort(a),i.sort(a),j.sort(a),b=0;b<7;b++)h[b]=aa(h[b]),i[b]=aa(i[b]),j[b]=aa(j[b]);this._weekdaysRegex=new RegExp("^("+j.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+i.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+h.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+g.join("|")+")","i")}function Ra(){return this.hours()%12||12}function Sa(){return this.hours()||24}function Ta(a,b){U(a,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),b)})}function Ua(a,b){return b._meridiemParse}function Va(a){return"p"===(a+"").toLowerCase().charAt(0)}function Wa(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"}function Xa(a){return a?a.toLowerCase().replace("_","-"):a}function Ya(a){for(var b,c,d,e,f=0;f<a.length;){for(e=Xa(a[f]).split("-"),b=e.length,c=Xa(a[f+1]),c=c?c.split("-"):null;b>0;){if(d=Za(e.slice(0,b).join("-")))return d;if(c&&c.length>=b&&v(e,c,!0)>=b-1)break;b--}f++}return null}function Za(a){var b=null;if(!Ff[a]&&"undefined"!=typeof module&&module&&module.exports)try{b=Bf._abbr,require("./locale/"+a),$a(b)}catch(a){}return Ff[a]}function $a(a,b){var c;return a&&(c=f(b)?bb(a):_a(a,b),c&&(Bf=c)),Bf._abbr}function _a(a,b){if(null!==b){var c=Ef;if(b.abbr=a,null!=Ff[a])y("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),c=Ff[a]._config;else if(null!=b.parentLocale){if(null==Ff[b.parentLocale])return Gf[b.parentLocale]||(Gf[b.parentLocale]=[]),Gf[b.parentLocale].push({name:a,config:b}),null;c=Ff[b.parentLocale]._config}return Ff[a]=new C(B(c,b)),Gf[a]&&Gf[a].forEach(function(a){_a(a.name,a.config)}),$a(a),Ff[a]}return delete Ff[a],null}function ab(a,b){if(null!=b){var c,d=Ef;null!=Ff[a]&&(d=Ff[a]._config),b=B(d,b),c=new C(b),c.parentLocale=Ff[a],Ff[a]=c,$a(a)}else null!=Ff[a]&&(null!=Ff[a].parentLocale?Ff[a]=Ff[a].parentLocale:null!=Ff[a]&&delete Ff[a]);return Ff[a]}function bb(a){var b;if(a&&a._locale&&a._locale._abbr&&(a=a._locale._abbr),!a)return Bf;if(!c(a)){if(b=Za(a))return b;a=[a]}return Ya(a)}function cb(){return ze(Ff)}function db(a){var b,c=a._a;return c&&n(a).overflow===-2&&(b=c[ef]<0||c[ef]>11?ef:c[ff]<1||c[ff]>ea(c[df],c[ef])?ff:c[gf]<0||c[gf]>24||24===c[gf]&&(0!==c[hf]||0!==c[jf]||0!==c[kf])?gf:c[hf]<0||c[hf]>59?hf:c[jf]<0||c[jf]>59?jf:c[kf]<0||c[kf]>999?kf:-1,n(a)._overflowDayOfYear&&(b<df||b>ff)&&(b=ff),n(a)._overflowWeeks&&b===-1&&(b=lf),n(a)._overflowWeekday&&b===-1&&(b=mf),n(a).overflow=b),a}function eb(a){var b,c,d,e,f,g,h=a._i,i=Hf.exec(h)||If.exec(h);if(i){for(n(a).iso=!0,b=0,c=Kf.length;b<c;b++)if(Kf[b][1].exec(i[1])){e=Kf[b][0],d=Kf[b][2]!==!1;break}if(null==e)return void(a._isValid=!1);if(i[3]){for(b=0,c=Lf.length;b<c;b++)if(Lf[b][1].exec(i[3])){f=(i[2]||" ")+Lf[b][0];break}if(null==f)return void(a._isValid=!1)}if(!d&&null!=f)return void(a._isValid=!1);if(i[4]){if(!Jf.exec(i[4]))return void(a._isValid=!1);g="Z"}a._f=e+(f||"")+(g||""),lb(a)}else a._isValid=!1}function fb(a){var b,c,d,e,f,g,h,i,j={" GMT":" +0000"," EDT":" -0400"," EST":" -0500"," CDT":" -0500"," CST":" -0600"," MDT":" -0600"," MST":" -0700"," PDT":" -0700"," PST":" -0800"},k="YXWVUTSRQPONZABCDEFGHIKLM";if(b=a._i.replace(/\([^\)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").replace(/^\s|\s$/g,""),c=Nf.exec(b)){if(d=c[1]?"ddd"+(5===c[1].length?", ":" "):"",e="D MMM "+(c[2].length>10?"YYYY ":"YY "),f="HH:mm"+(c[4]?":ss":""),c[1]){var l=new Date(c[2]),m=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][l.getDay()];if(c[1].substr(0,3)!==m)return n(a).weekdayMismatch=!0,void(a._isValid=!1)}switch(c[5].length){case 2:0===i?h=" +0000":(i=k.indexOf(c[5][1].toUpperCase())-12,h=(i<0?" -":" +")+(""+i).replace(/^-?/,"0").match(/..$/)[0]+"00");break;case 4:h=j[c[5]];break;default:h=j[" GMT"]}c[5]=h,a._i=c.splice(1).join(""),g=" ZZ",a._f=d+e+f+g,lb(a),n(a).rfc2822=!0}else a._isValid=!1}function gb(b){var c=Mf.exec(b._i);return null!==c?void(b._d=new Date(+c[1])):(eb(b),void(b._isValid===!1&&(delete b._isValid,fb(b),b._isValid===!1&&(delete b._isValid,a.createFromInputFallback(b)))))}function hb(a,b,c){return null!=a?a:null!=b?b:c}function ib(b){var c=new Date(a.now());return b._useUTC?[c.getUTCFullYear(),c.getUTCMonth(),c.getUTCDate()]:[c.getFullYear(),c.getMonth(),c.getDate()]}function jb(a){var b,c,d,e,f=[];if(!a._d){for(d=ib(a),a._w&&null==a._a[ff]&&null==a._a[ef]&&kb(a),null!=a._dayOfYear&&(e=hb(a._a[df],d[df]),(a._dayOfYear>pa(e)||0===a._dayOfYear)&&(n(a)._overflowDayOfYear=!0),c=ta(e,0,a._dayOfYear),a._a[ef]=c.getUTCMonth(),a._a[ff]=c.getUTCDate()),b=0;b<3&&null==a._a[b];++b)a._a[b]=f[b]=d[b];for(;b<7;b++)a._a[b]=f[b]=null==a._a[b]?2===b?1:0:a._a[b];24===a._a[gf]&&0===a._a[hf]&&0===a._a[jf]&&0===a._a[kf]&&(a._nextDay=!0,a._a[gf]=0),a._d=(a._useUTC?ta:sa).apply(null,f),null!=a._tzm&&a._d.setUTCMinutes(a._d.getUTCMinutes()-a._tzm),a._nextDay&&(a._a[gf]=24)}}function kb(a){var b,c,d,e,f,g,h,i;if(b=a._w,null!=b.GG||null!=b.W||null!=b.E)f=1,g=4,c=hb(b.GG,a._a[df],wa(tb(),1,4).year),d=hb(b.W,1),e=hb(b.E,1),(e<1||e>7)&&(i=!0);else{f=a._locale._week.dow,g=a._locale._week.doy;var j=wa(tb(),f,g);c=hb(b.gg,a._a[df],j.year),d=hb(b.w,j.week),null!=b.d?(e=b.d,(e<0||e>6)&&(i=!0)):null!=b.e?(e=b.e+f,(b.e<0||b.e>6)&&(i=!0)):e=f}d<1||d>xa(c,f,g)?n(a)._overflowWeeks=!0:null!=i?n(a)._overflowWeekday=!0:(h=va(c,d,e,f,g),a._a[df]=h.year,a._dayOfYear=h.dayOfYear)}function lb(b){if(b._f===a.ISO_8601)return void eb(b);if(b._f===a.RFC_2822)return void fb(b);b._a=[],n(b).empty=!0;var c,d,e,f,g,h=""+b._i,i=h.length,j=0;for(e=Y(b._f,b._locale).match(Ie)||[],c=0;c<e.length;c++)f=e[c],d=(h.match($(f,b))||[])[0],d&&(g=h.substr(0,h.indexOf(d)),g.length>0&&n(b).unusedInput.push(g),h=h.slice(h.indexOf(d)+d.length),j+=d.length),Le[f]?(d?n(b).empty=!1:n(b).unusedTokens.push(f),da(f,d,b)):b._strict&&!d&&n(b).unusedTokens.push(f);n(b).charsLeftOver=i-j,h.length>0&&n(b).unusedInput.push(h),b._a[gf]<=12&&n(b).bigHour===!0&&b._a[gf]>0&&(n(b).bigHour=void 0),n(b).parsedDateParts=b._a.slice(0),n(b).meridiem=b._meridiem,b._a[gf]=mb(b._locale,b._a[gf],b._meridiem),jb(b),db(b)}function mb(a,b,c){var d;return null==c?b:null!=a.meridiemHour?a.meridiemHour(b,c):null!=a.isPM?(d=a.isPM(c),d&&b<12&&(b+=12),d||12!==b||(b=0),b):b}function nb(a){var b,c,d,e,f;if(0===a._f.length)return n(a).invalidFormat=!0,void(a._d=new Date(NaN));for(e=0;e<a._f.length;e++)f=0,b=q({},a),null!=a._useUTC&&(b._useUTC=a._useUTC),b._f=a._f[e],lb(b),o(b)&&(f+=n(b).charsLeftOver,f+=10*n(b).unusedTokens.length,n(b).score=f,(null==d||f<d)&&(d=f,c=b));k(a,c||b)}function ob(a){if(!a._d){var b=L(a._i);a._a=i([b.year,b.month,b.day||b.date,b.hour,b.minute,b.second,b.millisecond],function(a){return a&&parseInt(a,10)}),jb(a)}}function pb(a){var b=new r(db(qb(a)));return b._nextDay&&(b.add(1,"d"),b._nextDay=void 0),b}function qb(a){var b=a._i,d=a._f;return a._locale=a._locale||bb(a._l),null===b||void 0===d&&""===b?p({nullInput:!0}):("string"==typeof b&&(a._i=b=a._locale.preparse(b)),s(b)?new r(db(b)):(h(b)?a._d=b:c(d)?nb(a):d?lb(a):rb(a),o(a)||(a._d=null),a))}function rb(b){var e=b._i;f(e)?b._d=new Date(a.now()):h(e)?b._d=new Date(e.valueOf()):"string"==typeof e?gb(b):c(e)?(b._a=i(e.slice(0),function(a){return parseInt(a,10)}),jb(b)):d(e)?ob(b):g(e)?b._d=new Date(e):a.createFromInputFallback(b)}function sb(a,b,f,g,h){var i={};return f!==!0&&f!==!1||(g=f,f=void 0),(d(a)&&e(a)||c(a)&&0===a.length)&&(a=void 0),i._isAMomentObject=!0,i._useUTC=i._isUTC=h,i._l=f,i._i=a,i._f=b,i._strict=g,pb(i)}function tb(a,b,c,d){return sb(a,b,c,d,!1)}function ub(a,b){var d,e;if(1===b.length&&c(b[0])&&(b=b[0]),!b.length)return tb();for(d=b[0],e=1;e<b.length;++e)b[e].isValid()&&!b[e][a](d)||(d=b[e]);return d}function vb(){var a=[].slice.call(arguments,0);return ub("isBefore",a)}function wb(){var a=[].slice.call(arguments,0);return ub("isAfter",a)}function xb(a){for(var b in a)if(Rf.indexOf(b)===-1||null!=a[b]&&isNaN(a[b]))return!1;for(var c=!1,d=0;d<Rf.length;++d)if(a[Rf[d]]){if(c)return!1;parseFloat(a[Rf[d]])!==u(a[Rf[d]])&&(c=!0)}return!0}function yb(){return this._isValid}function zb(){return Sb(NaN)}function Ab(a){var b=L(a),c=b.year||0,d=b.quarter||0,e=b.month||0,f=b.week||0,g=b.day||0,h=b.hour||0,i=b.minute||0,j=b.second||0,k=b.millisecond||0;this._isValid=xb(b),this._milliseconds=+k+1e3*j+6e4*i+1e3*h*60*60,this._days=+g+7*f,this._months=+e+3*d+12*c,this._data={},this._locale=bb(),this._bubble()}function Bb(a){return a instanceof Ab}function Cb(a){return a<0?Math.round(-1*a)*-1:Math.round(a)}function Db(a,b){U(a,0,0,function(){var a=this.utcOffset(),c="+";return a<0&&(a=-a,c="-"),c+T(~~(a/60),2)+b+T(~~a%60,2)})}function Eb(a,b){var c=(b||"").match(a);if(null===c)return null;var d=c[c.length-1]||[],e=(d+"").match(Sf)||["-",0,0],f=+(60*e[1])+u(e[2]);return 0===f?0:"+"===e[0]?f:-f}function Fb(b,c){var d,e;return c._isUTC?(d=c.clone(),e=(s(b)||h(b)?b.valueOf():tb(b).valueOf())-d.valueOf(),d._d.setTime(d._d.valueOf()+e),a.updateOffset(d,!1),d):tb(b).local()}function Gb(a){return 15*-Math.round(a._d.getTimezoneOffset()/15)}function Hb(b,c,d){var e,f=this._offset||0;if(!this.isValid())return null!=b?this:NaN;if(null!=b){if("string"==typeof b){if(b=Eb($e,b),null===b)return this}else Math.abs(b)<16&&!d&&(b=60*b);return!this._isUTC&&c&&(e=Gb(this)),this._offset=b,this._isUTC=!0,null!=e&&this.add(e,"m"),f!==b&&(!c||this._changeInProgress?Xb(this,Sb(b-f,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,a.updateOffset(this,!0),this._changeInProgress=null)),this}return this._isUTC?f:Gb(this)}function Ib(a,b){return null!=a?("string"!=typeof a&&(a=-a),this.utcOffset(a,b),this):-this.utcOffset()}function Jb(a){return this.utcOffset(0,a)}function Kb(a){return this._isUTC&&(this.utcOffset(0,a),this._isUTC=!1,a&&this.subtract(Gb(this),"m")),this}function Lb(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var a=Eb(Ze,this._i);null!=a?this.utcOffset(a):this.utcOffset(0,!0)}return this}function Mb(a){return!!this.isValid()&&(a=a?tb(a).utcOffset():0,(this.utcOffset()-a)%60===0)}function Nb(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()}function Ob(){if(!f(this._isDSTShifted))return this._isDSTShifted;var a={};if(q(a,this),a=qb(a),a._a){var b=a._isUTC?l(a._a):tb(a._a);this._isDSTShifted=this.isValid()&&v(a._a,b.toArray())>0}else this._isDSTShifted=!1;return this._isDSTShifted}function Pb(){return!!this.isValid()&&!this._isUTC}function Qb(){return!!this.isValid()&&this._isUTC}function Rb(){return!!this.isValid()&&(this._isUTC&&0===this._offset)}function Sb(a,b){var c,d,e,f=a,h=null;return Bb(a)?f={ms:a._milliseconds,d:a._days,M:a._months}:g(a)?(f={},b?f[b]=a:f.milliseconds=a):(h=Tf.exec(a))?(c="-"===h[1]?-1:1,f={y:0,d:u(h[ff])*c,h:u(h[gf])*c,m:u(h[hf])*c,s:u(h[jf])*c,ms:u(Cb(1e3*h[kf]))*c}):(h=Uf.exec(a))?(c="-"===h[1]?-1:1,f={y:Tb(h[2],c),M:Tb(h[3],c),w:Tb(h[4],c),d:Tb(h[5],c),h:Tb(h[6],c),m:Tb(h[7],c),s:Tb(h[8],c)}):null==f?f={}:"object"==typeof f&&("from"in f||"to"in f)&&(e=Vb(tb(f.from),tb(f.to)),f={},f.ms=e.milliseconds,f.M=e.months),d=new Ab(f),Bb(a)&&j(a,"_locale")&&(d._locale=a._locale),d}function Tb(a,b){var c=a&&parseFloat(a.replace(",","."));return(isNaN(c)?0:c)*b}function Ub(a,b){var c={milliseconds:0,months:0};return c.months=b.month()-a.month()+12*(b.year()-a.year()),a.clone().add(c.months,"M").isAfter(b)&&--c.months,c.milliseconds=+b-+a.clone().add(c.months,"M"),c}function Vb(a,b){var c;return a.isValid()&&b.isValid()?(b=Fb(b,a),a.isBefore(b)?c=Ub(a,b):(c=Ub(b,a),c.milliseconds=-c.milliseconds,c.months=-c.months),c):{milliseconds:0,months:0}}function Wb(a,b){return function(c,d){var e,f;return null===d||isNaN(+d)||(y(b,"moment()."+b+"(period, number) is deprecated. Please use moment()."+b+"(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),f=c,c=d,d=f),c="string"==typeof c?+c:c,e=Sb(c,d),Xb(this,e,a),this}}function Xb(b,c,d,e){var f=c._milliseconds,g=Cb(c._days),h=Cb(c._months);b.isValid()&&(e=null==e||e,f&&b._d.setTime(b._d.valueOf()+f*d),g&&Q(b,"Date",P(b,"Date")+g*d),h&&ja(b,P(b,"Month")+h*d),e&&a.updateOffset(b,g||h))}function Yb(a,b){var c=a.diff(b,"days",!0);return c<-6?"sameElse":c<-1?"lastWeek":c<0?"lastDay":c<1?"sameDay":c<2?"nextDay":c<7?"nextWeek":"sameElse"}function Zb(b,c){var d=b||tb(),e=Fb(d,this).startOf("day"),f=a.calendarFormat(this,e)||"sameElse",g=c&&(z(c[f])?c[f].call(this,d):c[f]);return this.format(g||this.localeData().calendar(f,this,tb(d)))}function $b(){return new r(this)}function _b(a,b){var c=s(a)?a:tb(a);return!(!this.isValid()||!c.isValid())&&(b=K(f(b)?"millisecond":b),"millisecond"===b?this.valueOf()>c.valueOf():c.valueOf()<this.clone().startOf(b).valueOf())}function ac(a,b){var c=s(a)?a:tb(a);return!(!this.isValid()||!c.isValid())&&(b=K(f(b)?"millisecond":b),"millisecond"===b?this.valueOf()<c.valueOf():this.clone().endOf(b).valueOf()<c.valueOf())}function bc(a,b,c,d){return d=d||"()",("("===d[0]?this.isAfter(a,c):!this.isBefore(a,c))&&(")"===d[1]?this.isBefore(b,c):!this.isAfter(b,c))}function cc(a,b){var c,d=s(a)?a:tb(a);return!(!this.isValid()||!d.isValid())&&(b=K(b||"millisecond"),"millisecond"===b?this.valueOf()===d.valueOf():(c=d.valueOf(),this.clone().startOf(b).valueOf()<=c&&c<=this.clone().endOf(b).valueOf()))}function dc(a,b){return this.isSame(a,b)||this.isAfter(a,b)}function ec(a,b){return this.isSame(a,b)||this.isBefore(a,b)}function fc(a,b,c){var d,e,f,g;return this.isValid()?(d=Fb(a,this),d.isValid()?(e=6e4*(d.utcOffset()-this.utcOffset()),b=K(b),"year"===b||"month"===b||"quarter"===b?(g=gc(this,d),"quarter"===b?g/=3:"year"===b&&(g/=12)):(f=this-d,g="second"===b?f/1e3:"minute"===b?f/6e4:"hour"===b?f/36e5:"day"===b?(f-e)/864e5:"week"===b?(f-e)/6048e5:f),c?g:t(g)):NaN):NaN}function gc(a,b){var c,d,e=12*(b.year()-a.year())+(b.month()-a.month()),f=a.clone().add(e,"months");return b-f<0?(c=a.clone().add(e-1,"months"),d=(b-f)/(f-c)):(c=a.clone().add(e+1,"months"),d=(b-f)/(c-f)),-(e+d)||0}function hc(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")}function ic(){if(!this.isValid())return null;var a=this.clone().utc();return a.year()<0||a.year()>9999?X(a,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):z(Date.prototype.toISOString)?this.toDate().toISOString():X(a,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]")}function jc(){if(!this.isValid())return"moment.invalid(/* "+this._i+" */)";var a="moment",b="";this.isLocal()||(a=0===this.utcOffset()?"moment.utc":"moment.parseZone",b="Z");var c="["+a+'("]',d=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",e="-MM-DD[T]HH:mm:ss.SSS",f=b+'[")]';return this.format(c+d+e+f)}function kc(b){b||(b=this.isUtc()?a.defaultFormatUtc:a.defaultFormat);var c=X(this,b);return this.localeData().postformat(c)}function lc(a,b){return this.isValid()&&(s(a)&&a.isValid()||tb(a).isValid())?Sb({to:this,from:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function mc(a){return this.from(tb(),a)}function nc(a,b){return this.isValid()&&(s(a)&&a.isValid()||tb(a).isValid())?Sb({from:this,to:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function oc(a){return this.to(tb(),a)}function pc(a){var b;return void 0===a?this._locale._abbr:(b=bb(a),null!=b&&(this._locale=b),this)}function qc(){return this._locale}function rc(a){switch(a=K(a)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":case"date":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===a&&this.weekday(0),"isoWeek"===a&&this.isoWeekday(1),"quarter"===a&&this.month(3*Math.floor(this.month()/3)),this}function sc(a){return a=K(a),void 0===a||"millisecond"===a?this:("date"===a&&(a="day"),this.startOf(a).add(1,"isoWeek"===a?"week":a).subtract(1,"ms"))}function tc(){return this._d.valueOf()-6e4*(this._offset||0)}function uc(){return Math.floor(this.valueOf()/1e3)}function vc(){return new Date(this.valueOf())}function wc(){var a=this;return[a.year(),a.month(),a.date(),a.hour(),a.minute(),a.second(),a.millisecond()]}function xc(){var a=this;return{years:a.year(),months:a.month(),date:a.date(),hours:a.hours(),minutes:a.minutes(),seconds:a.seconds(),milliseconds:a.milliseconds()}}function yc(){return this.isValid()?this.toISOString():null}function zc(){return o(this)}function Ac(){
return k({},n(this))}function Bc(){return n(this).overflow}function Cc(){return{input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}}function Dc(a,b){U(0,[a,a.length],0,b)}function Ec(a){return Ic.call(this,a,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)}function Fc(a){return Ic.call(this,a,this.isoWeek(),this.isoWeekday(),1,4)}function Gc(){return xa(this.year(),1,4)}function Hc(){var a=this.localeData()._week;return xa(this.year(),a.dow,a.doy)}function Ic(a,b,c,d,e){var f;return null==a?wa(this,d,e).year:(f=xa(a,d,e),b>f&&(b=f),Jc.call(this,a,b,c,d,e))}function Jc(a,b,c,d,e){var f=va(a,b,c,d,e),g=ta(f.year,0,f.dayOfYear);return this.year(g.getUTCFullYear()),this.month(g.getUTCMonth()),this.date(g.getUTCDate()),this}function Kc(a){return null==a?Math.ceil((this.month()+1)/3):this.month(3*(a-1)+this.month()%3)}function Lc(a){var b=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==a?b:this.add(a-b,"d")}function Mc(a,b){b[kf]=u(1e3*("0."+a))}function Nc(){return this._isUTC?"UTC":""}function Oc(){return this._isUTC?"Coordinated Universal Time":""}function Pc(a){return tb(1e3*a)}function Qc(){return tb.apply(null,arguments).parseZone()}function Rc(a){return a}function Sc(a,b,c,d){var e=bb(),f=l().set(d,b);return e[c](f,a)}function Tc(a,b,c){if(g(a)&&(b=a,a=void 0),a=a||"",null!=b)return Sc(a,b,c,"month");var d,e=[];for(d=0;d<12;d++)e[d]=Sc(a,d,c,"month");return e}function Uc(a,b,c,d){"boolean"==typeof a?(g(b)&&(c=b,b=void 0),b=b||""):(b=a,c=b,a=!1,g(b)&&(c=b,b=void 0),b=b||"");var e=bb(),f=a?e._week.dow:0;if(null!=c)return Sc(b,(c+f)%7,d,"day");var h,i=[];for(h=0;h<7;h++)i[h]=Sc(b,(h+f)%7,d,"day");return i}function Vc(a,b){return Tc(a,b,"months")}function Wc(a,b){return Tc(a,b,"monthsShort")}function Xc(a,b,c){return Uc(a,b,c,"weekdays")}function Yc(a,b,c){return Uc(a,b,c,"weekdaysShort")}function Zc(a,b,c){return Uc(a,b,c,"weekdaysMin")}function $c(){var a=this._data;return this._milliseconds=dg(this._milliseconds),this._days=dg(this._days),this._months=dg(this._months),a.milliseconds=dg(a.milliseconds),a.seconds=dg(a.seconds),a.minutes=dg(a.minutes),a.hours=dg(a.hours),a.months=dg(a.months),a.years=dg(a.years),this}function _c(a,b,c,d){var e=Sb(b,c);return a._milliseconds+=d*e._milliseconds,a._days+=d*e._days,a._months+=d*e._months,a._bubble()}function ad(a,b){return _c(this,a,b,1)}function bd(a,b){return _c(this,a,b,-1)}function cd(a){return a<0?Math.floor(a):Math.ceil(a)}function dd(){var a,b,c,d,e,f=this._milliseconds,g=this._days,h=this._months,i=this._data;return f>=0&&g>=0&&h>=0||f<=0&&g<=0&&h<=0||(f+=864e5*cd(fd(h)+g),g=0,h=0),i.milliseconds=f%1e3,a=t(f/1e3),i.seconds=a%60,b=t(a/60),i.minutes=b%60,c=t(b/60),i.hours=c%24,g+=t(c/24),e=t(ed(g)),h+=e,g-=cd(fd(e)),d=t(h/12),h%=12,i.days=g,i.months=h,i.years=d,this}function ed(a){return 4800*a/146097}function fd(a){return 146097*a/4800}function gd(a){if(!this.isValid())return NaN;var b,c,d=this._milliseconds;if(a=K(a),"month"===a||"year"===a)return b=this._days+d/864e5,c=this._months+ed(b),"month"===a?c:c/12;switch(b=this._days+Math.round(fd(this._months)),a){case"week":return b/7+d/6048e5;case"day":return b+d/864e5;case"hour":return 24*b+d/36e5;case"minute":return 1440*b+d/6e4;case"second":return 86400*b+d/1e3;case"millisecond":return Math.floor(864e5*b)+d;default:throw new Error("Unknown unit "+a)}}function hd(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*u(this._months/12):NaN}function id(a){return function(){return this.as(a)}}function jd(a){return a=K(a),this.isValid()?this[a+"s"]():NaN}function kd(a){return function(){return this.isValid()?this._data[a]:NaN}}function ld(){return t(this.days()/7)}function md(a,b,c,d,e){return e.relativeTime(b||1,!!c,a,d)}function nd(a,b,c){var d=Sb(a).abs(),e=tg(d.as("s")),f=tg(d.as("m")),g=tg(d.as("h")),h=tg(d.as("d")),i=tg(d.as("M")),j=tg(d.as("y")),k=e<=ug.ss&&["s",e]||e<ug.s&&["ss",e]||f<=1&&["m"]||f<ug.m&&["mm",f]||g<=1&&["h"]||g<ug.h&&["hh",g]||h<=1&&["d"]||h<ug.d&&["dd",h]||i<=1&&["M"]||i<ug.M&&["MM",i]||j<=1&&["y"]||["yy",j];return k[2]=b,k[3]=+a>0,k[4]=c,md.apply(null,k)}function od(a){return void 0===a?tg:"function"==typeof a&&(tg=a,!0)}function pd(a,b){return void 0!==ug[a]&&(void 0===b?ug[a]:(ug[a]=b,"s"===a&&(ug.ss=b-1),!0))}function qd(a){if(!this.isValid())return this.localeData().invalidDate();var b=this.localeData(),c=nd(this,!a,b);return a&&(c=b.pastFuture(+this,c)),b.postformat(c)}function rd(){if(!this.isValid())return this.localeData().invalidDate();var a,b,c,d=vg(this._milliseconds)/1e3,e=vg(this._days),f=vg(this._months);a=t(d/60),b=t(a/60),d%=60,a%=60,c=t(f/12),f%=12;var g=c,h=f,i=e,j=b,k=a,l=d,m=this.asSeconds();return m?(m<0?"-":"")+"P"+(g?g+"Y":"")+(h?h+"M":"")+(i?i+"D":"")+(j||k||l?"T":"")+(j?j+"H":"")+(k?k+"M":"")+(l?l+"S":""):"P0D"}
//! moment.js locale configuration
//! locale : Belarusian [be]
//! author : Dmitry Demidov : https://github.com/demidov91
//! author: Praleska: http://praleska.pro/
//! Author : Menelion Elensúle : https://github.com/Oire
function sd(a,b){var c=a.split("_");return b%10===1&&b%100!==11?c[0]:b%10>=2&&b%10<=4&&(b%100<10||b%100>=20)?c[1]:c[2]}function td(a,b,c){var d={mm:b?"хвіліна_хвіліны_хвілін":"хвіліну_хвіліны_хвілін",hh:b?"гадзіна_гадзіны_гадзін":"гадзіну_гадзіны_гадзін",dd:"дзень_дні_дзён",MM:"месяц_месяцы_месяцаў",yy:"год_гады_гадоў"};return"m"===c?b?"хвіліна":"хвіліну":"h"===c?b?"гадзіна":"гадзіну":a+" "+sd(d[c],+a)}
//! moment.js locale configuration
//! locale : Breton [br]
//! author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou
function ud(a,b,c){var d={mm:"munutenn",MM:"miz",dd:"devezh"};return a+" "+xd(d[c],a)}function vd(a){switch(wd(a)){case 1:case 3:case 4:case 5:case 9:return a+" bloaz";default:return a+" vloaz"}}function wd(a){return a>9?wd(a%10):a}function xd(a,b){return 2===b?yd(a):a}function yd(a){var b={m:"v",b:"v",d:"z"};return void 0===b[a.charAt(0)]?a:b[a.charAt(0)]+a.substring(1)}
//! moment.js locale configuration
//! locale : Bosnian [bs]
//! author : Nedim Cholich : https://github.com/frontyard
//! based on (hr) translation by Bojan Marković
function zd(a,b,c){var d=a+" ";switch(c){case"m":return b?"jedna minuta":"jedne minute";case"mm":return d+=1===a?"minuta":2===a||3===a||4===a?"minute":"minuta";case"h":return b?"jedan sat":"jednog sata";case"hh":return d+=1===a?"sat":2===a||3===a||4===a?"sata":"sati";case"dd":return d+=1===a?"dan":"dana";case"MM":return d+=1===a?"mjesec":2===a||3===a||4===a?"mjeseca":"mjeseci";case"yy":return d+=1===a?"godina":2===a||3===a||4===a?"godine":"godina"}}function Ad(a){return a>1&&a<5&&1!==~~(a/10)}function Bd(a,b,c,d){var e=a+" ";switch(c){case"s":return b||d?"pár sekund":"pár sekundami";case"m":return b?"minuta":d?"minutu":"minutou";case"mm":return b||d?e+(Ad(a)?"minuty":"minut"):e+"minutami";break;case"h":return b?"hodina":d?"hodinu":"hodinou";case"hh":return b||d?e+(Ad(a)?"hodiny":"hodin"):e+"hodinami";break;case"d":return b||d?"den":"dnem";case"dd":return b||d?e+(Ad(a)?"dny":"dní"):e+"dny";break;case"M":return b||d?"měsíc":"měsícem";case"MM":return b||d?e+(Ad(a)?"měsíce":"měsíců"):e+"měsíci";break;case"y":return b||d?"rok":"rokem";case"yy":return b||d?e+(Ad(a)?"roky":"let"):e+"lety"}}
//! moment.js locale configuration
//! locale : German (Austria) [de-at]
//! author : lluchs : https://github.com/lluchs
//! author: Menelion Elensúle: https://github.com/Oire
//! author : Martin Groller : https://github.com/MadMG
//! author : Mikolaj Dadela : https://github.com/mik01aj
function Cd(a,b,c,d){var e={m:["eine Minute","einer Minute"],h:["eine Stunde","einer Stunde"],d:["ein Tag","einem Tag"],dd:[a+" Tage",a+" Tagen"],M:["ein Monat","einem Monat"],MM:[a+" Monate",a+" Monaten"],y:["ein Jahr","einem Jahr"],yy:[a+" Jahre",a+" Jahren"]};return b?e[c][0]:e[c][1]}
//! moment.js locale configuration
//! locale : German (Switzerland) [de-ch]
//! author : sschueller : https://github.com/sschueller
function Dd(a,b,c,d){var e={m:["eine Minute","einer Minute"],h:["eine Stunde","einer Stunde"],d:["ein Tag","einem Tag"],dd:[a+" Tage",a+" Tagen"],M:["ein Monat","einem Monat"],MM:[a+" Monate",a+" Monaten"],y:["ein Jahr","einem Jahr"],yy:[a+" Jahre",a+" Jahren"]};return b?e[c][0]:e[c][1]}
//! moment.js locale configuration
//! locale : German [de]
//! author : lluchs : https://github.com/lluchs
//! author: Menelion Elensúle: https://github.com/Oire
//! author : Mikolaj Dadela : https://github.com/mik01aj
function Ed(a,b,c,d){var e={m:["eine Minute","einer Minute"],h:["eine Stunde","einer Stunde"],d:["ein Tag","einem Tag"],dd:[a+" Tage",a+" Tagen"],M:["ein Monat","einem Monat"],MM:[a+" Monate",a+" Monaten"],y:["ein Jahr","einem Jahr"],yy:[a+" Jahre",a+" Jahren"]};return b?e[c][0]:e[c][1]}
//! moment.js locale configuration
//! locale : Estonian [et]
//! author : Henry Kehlmann : https://github.com/madhenry
//! improvements : Illimar Tambek : https://github.com/ragulka
function Fd(a,b,c,d){var e={s:["mõne sekundi","mõni sekund","paar sekundit"],m:["ühe minuti","üks minut"],mm:[a+" minuti",a+" minutit"],h:["ühe tunni","tund aega","üks tund"],hh:[a+" tunni",a+" tundi"],d:["ühe päeva","üks päev"],M:["kuu aja","kuu aega","üks kuu"],MM:[a+" kuu",a+" kuud"],y:["ühe aasta","aasta","üks aasta"],yy:[a+" aasta",a+" aastat"]};return b?e[c][2]?e[c][2]:e[c][1]:d?e[c][0]:e[c][1]}function Gd(a,b,c,d){var e="";switch(c){case"s":return d?"muutaman sekunnin":"muutama sekunti";case"m":return d?"minuutin":"minuutti";case"mm":e=d?"minuutin":"minuuttia";break;case"h":return d?"tunnin":"tunti";case"hh":e=d?"tunnin":"tuntia";break;case"d":return d?"päivän":"päivä";case"dd":e=d?"päivän":"päivää";break;case"M":return d?"kuukauden":"kuukausi";case"MM":e=d?"kuukauden":"kuukautta";break;case"y":return d?"vuoden":"vuosi";case"yy":e=d?"vuoden":"vuotta"}return e=Hd(a,d)+" "+e}function Hd(a,b){return a<10?b?$g[a]:Zg[a]:a}
//! moment.js locale configuration
//! locale : Konkani Latin script [gom-latn]
//! author : The Discoverer : https://github.com/WikiDiscoverer
function Id(a,b,c,d){var e={s:["thodde secondanim","thodde second"],m:["eka mintan","ek minute"],mm:[a+" mintanim",a+" mintam"],h:["eka horan","ek hor"],hh:[a+" horanim",a+" hor"],d:["eka disan","ek dis"],dd:[a+" disanim",a+" dis"],M:["eka mhoinean","ek mhoino"],MM:[a+" mhoineanim",a+" mhoine"],y:["eka vorsan","ek voros"],yy:[a+" vorsanim",a+" vorsam"]};return b?e[c][0]:e[c][1]}
//! moment.js locale configuration
//! locale : Croatian [hr]
//! author : Bojan Marković : https://github.com/bmarkovic
function Jd(a,b,c){var d=a+" ";switch(c){case"m":return b?"jedna minuta":"jedne minute";case"mm":return d+=1===a?"minuta":2===a||3===a||4===a?"minute":"minuta";case"h":return b?"jedan sat":"jednog sata";case"hh":return d+=1===a?"sat":2===a||3===a||4===a?"sata":"sati";case"dd":return d+=1===a?"dan":"dana";case"MM":return d+=1===a?"mjesec":2===a||3===a||4===a?"mjeseca":"mjeseci";case"yy":return d+=1===a?"godina":2===a||3===a||4===a?"godine":"godina"}}function Kd(a,b,c,d){var e=a;switch(c){case"s":return d||b?"néhány másodperc":"néhány másodperce";case"m":return"egy"+(d||b?" perc":" perce");case"mm":return e+(d||b?" perc":" perce");case"h":return"egy"+(d||b?" óra":" órája");case"hh":return e+(d||b?" óra":" órája");case"d":return"egy"+(d||b?" nap":" napja");case"dd":return e+(d||b?" nap":" napja");case"M":return"egy"+(d||b?" hónap":" hónapja");case"MM":return e+(d||b?" hónap":" hónapja");case"y":return"egy"+(d||b?" év":" éve");case"yy":return e+(d||b?" év":" éve")}return""}function Ld(a){return(a?"":"[múlt] ")+"["+ih[this.day()]+"] LT[-kor]"}
//! moment.js locale configuration
//! locale : Icelandic [is]
//! author : Hinrik Örn Sigurðsson : https://github.com/hinrik
function Md(a){return a%100===11||a%10!==1}function Nd(a,b,c,d){var e=a+" ";switch(c){case"s":return b||d?"nokkrar sekúndur":"nokkrum sekúndum";case"m":return b?"mínúta":"mínútu";case"mm":return Md(a)?e+(b||d?"mínútur":"mínútum"):b?e+"mínúta":e+"mínútu";case"hh":return Md(a)?e+(b||d?"klukkustundir":"klukkustundum"):e+"klukkustund";case"d":return b?"dagur":d?"dag":"degi";case"dd":return Md(a)?b?e+"dagar":e+(d?"daga":"dögum"):b?e+"dagur":e+(d?"dag":"degi");case"M":return b?"mánuður":d?"mánuð":"mánuði";case"MM":return Md(a)?b?e+"mánuðir":e+(d?"mánuði":"mánuðum"):b?e+"mánuður":e+(d?"mánuð":"mánuði");case"y":return b||d?"ár":"ári";case"yy":return Md(a)?e+(b||d?"ár":"árum"):e+(b||d?"ár":"ári")}}
//! moment.js locale configuration
//! locale : Luxembourgish [lb]
//! author : mweimerskirch : https://github.com/mweimerskirch
//! author : David Raison : https://github.com/kwisatz
function Od(a,b,c,d){var e={m:["eng Minutt","enger Minutt"],h:["eng Stonn","enger Stonn"],d:["een Dag","engem Dag"],M:["ee Mount","engem Mount"],y:["ee Joer","engem Joer"]};return b?e[c][0]:e[c][1]}function Pd(a){var b=a.substr(0,a.indexOf(" "));return Rd(b)?"a "+a:"an "+a}function Qd(a){var b=a.substr(0,a.indexOf(" "));return Rd(b)?"viru "+a:"virun "+a}function Rd(a){if(a=parseInt(a,10),isNaN(a))return!1;if(a<0)return!0;if(a<10)return 4<=a&&a<=7;if(a<100){var b=a%10,c=a/10;return Rd(0===b?c:b)}if(a<1e4){for(;a>=10;)a/=10;return Rd(a)}return a/=1e3,Rd(a)}function Sd(a,b,c,d){return b?"kelios sekundės":d?"kelių sekundžių":"kelias sekundes"}function Td(a,b,c,d){return b?Vd(c)[0]:d?Vd(c)[1]:Vd(c)[2]}function Ud(a){return a%10===0||a>10&&a<20}function Vd(a){return nh[a].split("_")}function Wd(a,b,c,d){var e=a+" ";return 1===a?e+Td(a,b,c[0],d):b?e+(Ud(a)?Vd(c)[1]:Vd(c)[0]):d?e+Vd(c)[1]:e+(Ud(a)?Vd(c)[1]:Vd(c)[2])}function Xd(a,b,c){return c?b%10===1&&b%100!==11?a[2]:a[3]:b%10===1&&b%100!==11?a[0]:a[1]}function Yd(a,b,c){return a+" "+Xd(oh[c],a,b)}function Zd(a,b,c){return Xd(oh[c],a,b)}function $d(a,b){return b?"dažas sekundes":"dažām sekundēm"}function _d(a,b,c,d){var e="";if(b)switch(c){case"s":e="काही सेकंद";break;case"m":e="एक मिनिट";break;case"mm":e="%d मिनिटे";break;case"h":e="एक तास";break;case"hh":e="%d तास";break;case"d":e="एक दिवस";break;case"dd":e="%d दिवस";break;case"M":e="एक महिना";break;case"MM":e="%d महिने";break;case"y":e="एक वर्ष";break;case"yy":e="%d वर्षे"}else switch(c){case"s":e="काही सेकंदां";break;case"m":e="एका मिनिटा";break;case"mm":e="%d मिनिटां";break;case"h":e="एका तासा";break;case"hh":e="%d तासां";break;case"d":e="एका दिवसा";break;case"dd":e="%d दिवसां";break;case"M":e="एका महिन्या";break;case"MM":e="%d महिन्यां";break;case"y":e="एका वर्षा";break;case"yy":e="%d वर्षां"}return e.replace(/%d/i,a)}function ae(a){return a%10<5&&a%10>1&&~~(a/10)%10!==1}function be(a,b,c){var d=a+" ";switch(c){case"m":return b?"minuta":"minutę";case"mm":return d+(ae(a)?"minuty":"minut");case"h":return b?"godzina":"godzinę";case"hh":return d+(ae(a)?"godziny":"godzin");case"MM":return d+(ae(a)?"miesiące":"miesięcy");case"yy":return d+(ae(a)?"lata":"lat")}}
//! moment.js locale configuration
//! locale : Romanian [ro]
//! author : Vlad Gurdiga : https://github.com/gurdiga
//! author : Valentin Agachi : https://github.com/avaly
function ce(a,b,c){var d={mm:"minute",hh:"ore",dd:"zile",MM:"luni",yy:"ani"},e=" ";return(a%100>=20||a>=100&&a%100===0)&&(e=" de "),a+e+d[c]}
//! moment.js locale configuration
//! locale : Russian [ru]
//! author : Viktorminator : https://github.com/Viktorminator
//! Author : Menelion Elensúle : https://github.com/Oire
//! author : Коренберг Марк : https://github.com/socketpair
function de(a,b){var c=a.split("_");return b%10===1&&b%100!==11?c[0]:b%10>=2&&b%10<=4&&(b%100<10||b%100>=20)?c[1]:c[2]}function ee(a,b,c){var d={mm:b?"минута_минуты_минут":"минуту_минуты_минут",hh:"час_часа_часов",dd:"день_дня_дней",MM:"месяц_месяца_месяцев",yy:"год_года_лет"};return"m"===c?b?"минута":"минуту":a+" "+de(d[c],+a)}function fe(a){return a>1&&a<5}function ge(a,b,c,d){var e=a+" ";switch(c){case"s":return b||d?"pár sekúnd":"pár sekundami";case"m":return b?"minúta":d?"minútu":"minútou";case"mm":return b||d?e+(fe(a)?"minúty":"minút"):e+"minútami";break;case"h":return b?"hodina":d?"hodinu":"hodinou";case"hh":return b||d?e+(fe(a)?"hodiny":"hodín"):e+"hodinami";break;case"d":return b||d?"deň":"dňom";case"dd":return b||d?e+(fe(a)?"dni":"dní"):e+"dňami";break;case"M":return b||d?"mesiac":"mesiacom";case"MM":return b||d?e+(fe(a)?"mesiace":"mesiacov"):e+"mesiacmi";break;case"y":return b||d?"rok":"rokom";case"yy":return b||d?e+(fe(a)?"roky":"rokov"):e+"rokmi"}}
//! moment.js locale configuration
//! locale : Slovenian [sl]
//! author : Robert Sedovšek : https://github.com/sedovsek
function he(a,b,c,d){var e=a+" ";switch(c){case"s":return b||d?"nekaj sekund":"nekaj sekundami";case"m":return b?"ena minuta":"eno minuto";case"mm":return e+=1===a?b?"minuta":"minuto":2===a?b||d?"minuti":"minutama":a<5?b||d?"minute":"minutami":b||d?"minut":"minutami";case"h":return b?"ena ura":"eno uro";case"hh":return e+=1===a?b?"ura":"uro":2===a?b||d?"uri":"urama":a<5?b||d?"ure":"urami":b||d?"ur":"urami";case"d":return b||d?"en dan":"enim dnem";case"dd":return e+=1===a?b||d?"dan":"dnem":2===a?b||d?"dni":"dnevoma":b||d?"dni":"dnevi";case"M":return b||d?"en mesec":"enim mesecem";case"MM":return e+=1===a?b||d?"mesec":"mesecem":2===a?b||d?"meseca":"mesecema":a<5?b||d?"mesece":"meseci":b||d?"mesecev":"meseci";case"y":return b||d?"eno leto":"enim letom";case"yy":return e+=1===a?b||d?"leto":"letom":2===a?b||d?"leti":"letoma":a<5?b||d?"leta":"leti":b||d?"let":"leti"}}function ie(a){var b=a;return b=a.indexOf("jaj")!==-1?b.slice(0,-3)+"leS":a.indexOf("jar")!==-1?b.slice(0,-3)+"waQ":a.indexOf("DIS")!==-1?b.slice(0,-3)+"nem":b+" pIq"}function je(a){var b=a;return b=a.indexOf("jaj")!==-1?b.slice(0,-3)+"Hu’":a.indexOf("jar")!==-1?b.slice(0,-3)+"wen":a.indexOf("DIS")!==-1?b.slice(0,-3)+"ben":b+" ret"}function ke(a,b,c,d){var e=le(a);switch(c){case"mm":return e+" tup";case"hh":return e+" rep";case"dd":return e+" jaj";case"MM":return e+" jar";case"yy":return e+" DIS"}}function le(a){var b=Math.floor(a%1e3/100),c=Math.floor(a%100/10),d=a%10,e="";return b>0&&(e+=Rh[b]+"vatlh"),c>0&&(e+=(""!==e?" ":"")+Rh[c]+"maH"),d>0&&(e+=(""!==e?" ":"")+Rh[d]),""===e?"pagh":e}function me(a,b,c,d){var e={s:["viensas secunds","'iensas secunds"],m:["'n míut","'iens míut"],mm:[a+" míuts",""+a+" míuts"],h:["'n þora","'iensa þora"],hh:[a+" þoras",""+a+" þoras"],d:["'n ziua","'iensa ziua"],dd:[a+" ziuas",""+a+" ziuas"],M:["'n mes","'iens mes"],MM:[a+" mesen",""+a+" mesen"],y:["'n ar","'iens ar"],yy:[a+" ars",""+a+" ars"]};return d?e[c][0]:b?e[c][0]:e[c][1]}
//! moment.js locale configuration
//! locale : Ukrainian [uk]
//! author : zemlanin : https://github.com/zemlanin
//! Author : Menelion Elensúle : https://github.com/Oire
function ne(a,b){var c=a.split("_");return b%10===1&&b%100!==11?c[0]:b%10>=2&&b%10<=4&&(b%100<10||b%100>=20)?c[1]:c[2]}function oe(a,b,c){var d={mm:b?"хвилина_хвилини_хвилин":"хвилину_хвилини_хвилин",hh:b?"година_години_годин":"годину_години_годин",dd:"день_дні_днів",MM:"місяць_місяці_місяців",yy:"рік_роки_років"};return"m"===c?b?"хвилина":"хвилину":"h"===c?b?"година":"годину":a+" "+ne(d[c],+a)}function pe(a,b){var c={nominative:"неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота".split("_"),accusative:"неділю_понеділок_вівторок_середу_четвер_п’ятницю_суботу".split("_"),genitive:"неділі_понеділка_вівторка_середи_четверга_п’ятниці_суботи".split("_")};if(!a)return c.nominative;var d=/(\[[ВвУу]\]) ?dddd/.test(b)?"accusative":/\[?(?:минулої|наступної)? ?\] ?dddd/.test(b)?"genitive":"nominative";return c[d][a.day()]}function qe(a){return function(){return a+"о"+(11===this.hours()?"б":"")+"] LT"}}var re,se;se=Array.prototype.some?Array.prototype.some:function(a){for(var b=Object(this),c=b.length>>>0,d=0;d<c;d++)if(d in b&&a.call(this,b[d],d,b))return!0;return!1};var te=se,ue=a.momentProperties=[],ve=!1,we={};a.suppressDeprecationWarnings=!1,a.deprecationHandler=null;var xe;xe=Object.keys?Object.keys:function(a){var b,c=[];for(b in a)j(a,b)&&c.push(b);return c};var ye,ze=xe,Ae={sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},Be={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},Ce="Invalid date",De="%d",Ee=/\d{1,2}/,Fe={future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},Ge={},He={},Ie=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,Je=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,Ke={},Le={},Me=/\d/,Ne=/\d\d/,Oe=/\d{3}/,Pe=/\d{4}/,Qe=/[+-]?\d{6}/,Re=/\d\d?/,Se=/\d\d\d\d?/,Te=/\d\d\d\d\d\d?/,Ue=/\d{1,3}/,Ve=/\d{1,4}/,We=/[+-]?\d{1,6}/,Xe=/\d+/,Ye=/[+-]?\d+/,Ze=/Z|[+-]\d\d:?\d\d/gi,$e=/Z|[+-]\d\d(?::?\d\d)?/gi,_e=/[+-]?\d+(\.\d{1,3})?/,af=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,bf={},cf={},df=0,ef=1,ff=2,gf=3,hf=4,jf=5,kf=6,lf=7,mf=8;ye=Array.prototype.indexOf?Array.prototype.indexOf:function(a){var b;for(b=0;b<this.length;++b)if(this[b]===a)return b;return-1};var nf=ye;U("M",["MM",2],"Mo",function(){return this.month()+1}),U("MMM",0,0,function(a){return this.localeData().monthsShort(this,a)}),U("MMMM",0,0,function(a){return this.localeData().months(this,a)}),J("month","M"),M("month",8),Z("M",Re),Z("MM",Re,Ne),Z("MMM",function(a,b){return b.monthsShortRegex(a)}),Z("MMMM",function(a,b){return b.monthsRegex(a)}),ba(["M","MM"],function(a,b){b[ef]=u(a)-1}),ba(["MMM","MMMM"],function(a,b,c,d){var e=c._locale.monthsParse(a,d,c._strict);null!=e?b[ef]=e:n(c).invalidMonth=a});var of=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,pf="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),qf="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),rf=af,sf=af;U("Y",0,0,function(){var a=this.year();return a<=9999?""+a:"+"+a}),U(0,["YY",2],0,function(){return this.year()%100}),U(0,["YYYY",4],0,"year"),U(0,["YYYYY",5],0,"year"),U(0,["YYYYYY",6,!0],0,"year"),J("year","y"),M("year",1),Z("Y",Ye),Z("YY",Re,Ne),Z("YYYY",Ve,Pe),Z("YYYYY",We,Qe),Z("YYYYYY",We,Qe),ba(["YYYYY","YYYYYY"],df),ba("YYYY",function(b,c){c[df]=2===b.length?a.parseTwoDigitYear(b):u(b)}),ba("YY",function(b,c){c[df]=a.parseTwoDigitYear(b)}),ba("Y",function(a,b){b[df]=parseInt(a,10)}),a.parseTwoDigitYear=function(a){return u(a)+(u(a)>68?1900:2e3)};var tf=O("FullYear",!0);U("w",["ww",2],"wo","week"),U("W",["WW",2],"Wo","isoWeek"),J("week","w"),J("isoWeek","W"),M("week",5),M("isoWeek",5),Z("w",Re),Z("ww",Re,Ne),Z("W",Re),Z("WW",Re,Ne),ca(["w","ww","W","WW"],function(a,b,c,d){b[d.substr(0,1)]=u(a)});var uf={dow:0,doy:6};U("d",0,"do","day"),U("dd",0,0,function(a){return this.localeData().weekdaysMin(this,a)}),U("ddd",0,0,function(a){return this.localeData().weekdaysShort(this,a)}),U("dddd",0,0,function(a){return this.localeData().weekdays(this,a)}),U("e",0,0,"weekday"),U("E",0,0,"isoWeekday"),J("day","d"),J("weekday","e"),J("isoWeekday","E"),M("day",11),M("weekday",11),M("isoWeekday",11),Z("d",Re),Z("e",Re),Z("E",Re),Z("dd",function(a,b){return b.weekdaysMinRegex(a)}),Z("ddd",function(a,b){return b.weekdaysShortRegex(a)}),Z("dddd",function(a,b){return b.weekdaysRegex(a)}),ca(["dd","ddd","dddd"],function(a,b,c,d){var e=c._locale.weekdaysParse(a,d,c._strict);null!=e?b.d=e:n(c).invalidWeekday=a}),ca(["d","e","E"],function(a,b,c,d){b[d]=u(a)});var vf="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),wf="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),xf="Su_Mo_Tu_We_Th_Fr_Sa".split("_"),yf=af,zf=af,Af=af;U("H",["HH",2],0,"hour"),U("h",["hh",2],0,Ra),U("k",["kk",2],0,Sa),U("hmm",0,0,function(){return""+Ra.apply(this)+T(this.minutes(),2)}),U("hmmss",0,0,function(){return""+Ra.apply(this)+T(this.minutes(),2)+T(this.seconds(),2)}),U("Hmm",0,0,function(){return""+this.hours()+T(this.minutes(),2)}),U("Hmmss",0,0,function(){return""+this.hours()+T(this.minutes(),2)+T(this.seconds(),2)}),Ta("a",!0),Ta("A",!1),J("hour","h"),M("hour",13),Z("a",Ua),Z("A",Ua),Z("H",Re),Z("h",Re),Z("k",Re),Z("HH",Re,Ne),Z("hh",Re,Ne),Z("kk",Re,Ne),Z("hmm",Se),Z("hmmss",Te),Z("Hmm",Se),Z("Hmmss",Te),ba(["H","HH"],gf),ba(["k","kk"],function(a,b,c){var d=u(a);b[gf]=24===d?0:d}),ba(["a","A"],function(a,b,c){c._isPm=c._locale.isPM(a),c._meridiem=a}),ba(["h","hh"],function(a,b,c){b[gf]=u(a),n(c).bigHour=!0}),ba("hmm",function(a,b,c){var d=a.length-2;b[gf]=u(a.substr(0,d)),b[hf]=u(a.substr(d)),n(c).bigHour=!0}),ba("hmmss",function(a,b,c){var d=a.length-4,e=a.length-2;b[gf]=u(a.substr(0,d)),b[hf]=u(a.substr(d,2)),b[jf]=u(a.substr(e)),n(c).bigHour=!0}),ba("Hmm",function(a,b,c){var d=a.length-2;b[gf]=u(a.substr(0,d)),b[hf]=u(a.substr(d))}),ba("Hmmss",function(a,b,c){var d=a.length-4,e=a.length-2;b[gf]=u(a.substr(0,d)),b[hf]=u(a.substr(d,2)),b[jf]=u(a.substr(e))});var Bf,Cf=/[ap]\.?m?\.?/i,Df=O("Hours",!0),Ef={calendar:Ae,longDateFormat:Be,invalidDate:Ce,ordinal:De,dayOfMonthOrdinalParse:Ee,relativeTime:Fe,months:pf,monthsShort:qf,week:uf,weekdays:vf,weekdaysMin:xf,weekdaysShort:wf,meridiemParse:Cf},Ff={},Gf={},Hf=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,If=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,Jf=/Z|[+-]\d\d(?::?\d\d)?/,Kf=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],Lf=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],Mf=/^\/?Date\((\-?\d+)/i,Nf=/^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d?\d\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d\d)?\d\d\s)(\d\d:\d\d)(\:\d\d)?(\s(?:UT|GMT|[ECMP][SD]T|[A-IK-Za-ik-z]|[+-]\d{4}))$/;a.createFromInputFallback=x("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",function(a){a._d=new Date(a._i+(a._useUTC?" UTC":""))}),a.ISO_8601=function(){},a.RFC_2822=function(){};var Of=x("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var a=tb.apply(null,arguments);return this.isValid()&&a.isValid()?a<this?this:a:p()}),Pf=x("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var a=tb.apply(null,arguments);return this.isValid()&&a.isValid()?a>this?this:a:p()}),Qf=function(){return Date.now?Date.now():+new Date},Rf=["year","quarter","month","week","day","hour","minute","second","millisecond"];Db("Z",":"),Db("ZZ",""),Z("Z",$e),Z("ZZ",$e),ba(["Z","ZZ"],function(a,b,c){c._useUTC=!0,c._tzm=Eb($e,a)});var Sf=/([\+\-]|\d\d)/gi;a.updateOffset=function(){};var Tf=/^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,Uf=/^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;Sb.fn=Ab.prototype,Sb.invalid=zb;var Vf=Wb(1,"add"),Wf=Wb(-1,"subtract");a.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",a.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var Xf=x("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",function(a){return void 0===a?this.localeData():this.locale(a)});U(0,["gg",2],0,function(){return this.weekYear()%100}),U(0,["GG",2],0,function(){return this.isoWeekYear()%100}),Dc("gggg","weekYear"),Dc("ggggg","weekYear"),Dc("GGGG","isoWeekYear"),Dc("GGGGG","isoWeekYear"),J("weekYear","gg"),J("isoWeekYear","GG"),M("weekYear",1),M("isoWeekYear",1),Z("G",Ye),Z("g",Ye),Z("GG",Re,Ne),Z("gg",Re,Ne),Z("GGGG",Ve,Pe),Z("gggg",Ve,Pe),Z("GGGGG",We,Qe),Z("ggggg",We,Qe),ca(["gggg","ggggg","GGGG","GGGGG"],function(a,b,c,d){b[d.substr(0,2)]=u(a)}),ca(["gg","GG"],function(b,c,d,e){c[e]=a.parseTwoDigitYear(b)}),U("Q",0,"Qo","quarter"),J("quarter","Q"),M("quarter",7),Z("Q",Me),ba("Q",function(a,b){b[ef]=3*(u(a)-1)}),U("D",["DD",2],"Do","date"),J("date","D"),M("date",9),Z("D",Re),Z("DD",Re,Ne),Z("Do",function(a,b){return a?b._dayOfMonthOrdinalParse||b._ordinalParse:b._dayOfMonthOrdinalParseLenient}),ba(["D","DD"],ff),ba("Do",function(a,b){b[ff]=u(a.match(Re)[0],10)});var Yf=O("Date",!0);U("DDD",["DDDD",3],"DDDo","dayOfYear"),J("dayOfYear","DDD"),M("dayOfYear",4),Z("DDD",Ue),Z("DDDD",Oe),ba(["DDD","DDDD"],function(a,b,c){c._dayOfYear=u(a)}),U("m",["mm",2],0,"minute"),J("minute","m"),M("minute",14),Z("m",Re),Z("mm",Re,Ne),ba(["m","mm"],hf);var Zf=O("Minutes",!1);U("s",["ss",2],0,"second"),J("second","s"),M("second",15),Z("s",Re),Z("ss",Re,Ne),ba(["s","ss"],jf);var $f=O("Seconds",!1);U("S",0,0,function(){return~~(this.millisecond()/100)}),U(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),U(0,["SSS",3],0,"millisecond"),U(0,["SSSS",4],0,function(){return 10*this.millisecond()}),U(0,["SSSSS",5],0,function(){return 100*this.millisecond()}),U(0,["SSSSSS",6],0,function(){return 1e3*this.millisecond()}),U(0,["SSSSSSS",7],0,function(){return 1e4*this.millisecond()}),U(0,["SSSSSSSS",8],0,function(){return 1e5*this.millisecond()}),U(0,["SSSSSSSSS",9],0,function(){return 1e6*this.millisecond()}),J("millisecond","ms"),M("millisecond",16),Z("S",Ue,Me),Z("SS",Ue,Ne),Z("SSS",Ue,Oe);var _f;for(_f="SSSS";_f.length<=9;_f+="S")Z(_f,Xe);for(_f="S";_f.length<=9;_f+="S")ba(_f,Mc);var ag=O("Milliseconds",!1);U("z",0,0,"zoneAbbr"),U("zz",0,0,"zoneName");var bg=r.prototype;bg.add=Vf,bg.calendar=Zb,bg.clone=$b,bg.diff=fc,bg.endOf=sc,bg.format=kc,bg.from=lc,bg.fromNow=mc,bg.to=nc,bg.toNow=oc,bg.get=R,bg.invalidAt=Bc,bg.isAfter=_b,bg.isBefore=ac,bg.isBetween=bc,bg.isSame=cc,bg.isSameOrAfter=dc,bg.isSameOrBefore=ec,bg.isValid=zc,bg.lang=Xf,bg.locale=pc,bg.localeData=qc,bg.max=Pf,bg.min=Of,bg.parsingFlags=Ac,bg.set=S,bg.startOf=rc,bg.subtract=Wf,bg.toArray=wc,bg.toObject=xc,bg.toDate=vc,bg.toISOString=ic,bg.inspect=jc,bg.toJSON=yc,bg.toString=hc,bg.unix=uc,bg.valueOf=tc,bg.creationData=Cc,bg.year=tf,bg.isLeapYear=ra,bg.weekYear=Ec,bg.isoWeekYear=Fc,bg.quarter=bg.quarters=Kc,bg.month=ka,bg.daysInMonth=la,bg.week=bg.weeks=Ba,bg.isoWeek=bg.isoWeeks=Ca,bg.weeksInYear=Hc,bg.isoWeeksInYear=Gc,bg.date=Yf,bg.day=bg.days=Ka,bg.weekday=La,bg.isoWeekday=Ma,bg.dayOfYear=Lc,bg.hour=bg.hours=Df,bg.minute=bg.minutes=Zf,bg.second=bg.seconds=$f,bg.millisecond=bg.milliseconds=ag,bg.utcOffset=Hb,bg.utc=Jb,bg.local=Kb,bg.parseZone=Lb,bg.hasAlignedHourOffset=Mb,bg.isDST=Nb,bg.isLocal=Pb,bg.isUtcOffset=Qb,bg.isUtc=Rb,bg.isUTC=Rb,bg.zoneAbbr=Nc,bg.zoneName=Oc,bg.dates=x("dates accessor is deprecated. Use date instead.",Yf),bg.months=x("months accessor is deprecated. Use month instead",ka),bg.years=x("years accessor is deprecated. Use year instead",tf),bg.zone=x("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",Ib),bg.isDSTShifted=x("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",Ob);var cg=C.prototype;cg.calendar=D,cg.longDateFormat=E,cg.invalidDate=F,cg.ordinal=G,cg.preparse=Rc,cg.postformat=Rc,cg.relativeTime=H,cg.pastFuture=I,cg.set=A,cg.months=fa,cg.monthsShort=ga,cg.monthsParse=ia,cg.monthsRegex=na,cg.monthsShortRegex=ma,cg.week=ya,cg.firstDayOfYear=Aa,cg.firstDayOfWeek=za,cg.weekdays=Fa,cg.weekdaysMin=Ha,cg.weekdaysShort=Ga,cg.weekdaysParse=Ja,cg.weekdaysRegex=Na,cg.weekdaysShortRegex=Oa,cg.weekdaysMinRegex=Pa,cg.isPM=Va,cg.meridiem=Wa,$a("en",{dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(a){var b=a%10,c=1===u(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),a.lang=x("moment.lang is deprecated. Use moment.locale instead.",$a),a.langData=x("moment.langData is deprecated. Use moment.localeData instead.",bb);var dg=Math.abs,eg=id("ms"),fg=id("s"),gg=id("m"),hg=id("h"),ig=id("d"),jg=id("w"),kg=id("M"),lg=id("y"),mg=kd("milliseconds"),ng=kd("seconds"),og=kd("minutes"),pg=kd("hours"),qg=kd("days"),rg=kd("months"),sg=kd("years"),tg=Math.round,ug={ss:44,s:45,m:45,h:22,d:26,M:11},vg=Math.abs,wg=Ab.prototype;wg.isValid=yb,wg.abs=$c,wg.add=ad,wg.subtract=bd,wg.as=gd,wg.asMilliseconds=eg,wg.asSeconds=fg,wg.asMinutes=gg,wg.asHours=hg,wg.asDays=ig,wg.asWeeks=jg,wg.asMonths=kg,wg.asYears=lg,wg.valueOf=hd,wg._bubble=dd,wg.get=jd,wg.milliseconds=mg,wg.seconds=ng,wg.minutes=og,wg.hours=pg,wg.days=qg,wg.weeks=ld,wg.months=rg,wg.years=sg,wg.humanize=qd,wg.toISOString=rd,wg.toString=rd,wg.toJSON=rd,wg.locale=pc,wg.localeData=qc,wg.toIsoString=x("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",rd),wg.lang=Xf,U("X",0,0,"unix"),U("x",0,0,"valueOf"),Z("x",Ye),Z("X",_e),ba("X",function(a,b,c){c._d=new Date(1e3*parseFloat(a,10))}),ba("x",function(a,b,c){c._d=new Date(u(a))}),
//! moment.js
//! version : 2.18.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
a.version="2.18.1",b(tb),a.fn=bg,a.min=vb,a.max=wb,a.now=Qf,a.utc=l,a.unix=Pc,a.months=Vc,a.isDate=h,a.locale=$a,a.invalid=p,a.duration=Sb,a.isMoment=s,a.weekdays=Xc,a.parseZone=Qc,a.localeData=bb,a.isDuration=Bb,a.monthsShort=Wc,a.weekdaysMin=Zc,a.defineLocale=_a,a.updateLocale=ab,a.locales=cb,a.weekdaysShort=Yc,a.normalizeUnits=K,a.relativeTimeRounding=od,a.relativeTimeThreshold=pd,a.calendarFormat=Yb,a.prototype=bg,
//! moment.js locale configuration
//! locale : Afrikaans [af]
//! author : Werner Mollentze : https://github.com/wernerm
a.defineLocale("af",{months:"Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember".split("_"),monthsShort:"Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des".split("_"),weekdays:"Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag".split("_"),weekdaysShort:"Son_Maa_Din_Woe_Don_Vry_Sat".split("_"),weekdaysMin:"So_Ma_Di_Wo_Do_Vr_Sa".split("_"),meridiemParse:/vm|nm/i,isPM:function(a){return/^nm$/i.test(a)},meridiem:function(a,b,c){return a<12?c?"vm":"VM":c?"nm":"NM"},longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Vandag om] LT",nextDay:"[Môre om] LT",nextWeek:"dddd [om] LT",lastDay:"[Gister om] LT",lastWeek:"[Laas] dddd [om] LT",sameElse:"L"},relativeTime:{future:"oor %s",past:"%s gelede",s:"'n paar sekondes",m:"'n minuut",mm:"%d minute",h:"'n uur",hh:"%d ure",d:"'n dag",dd:"%d dae",M:"'n maand",MM:"%d maande",y:"'n jaar",yy:"%d jaar"},dayOfMonthOrdinalParse:/\d{1,2}(ste|de)/,ordinal:function(a){return a+(1===a||8===a||a>=20?"ste":"de")},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Arabic (Algeria) [ar-dz]
//! author : Noureddine LOUAHEDJ : https://github.com/noureddineme
a.defineLocale("ar-dz",{months:"جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),monthsShort:"جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),weekdays:"الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),weekdaysShort:"احد_اثنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"),weekdaysMin:"أح_إث_ثلا_أر_خم_جم_سب".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[اليوم على الساعة] LT",nextDay:"[غدا على الساعة] LT",nextWeek:"dddd [على الساعة] LT",lastDay:"[أمس على الساعة] LT",lastWeek:"dddd [على الساعة] LT",sameElse:"L"},relativeTime:{future:"في %s",past:"منذ %s",s:"ثوان",m:"دقيقة",mm:"%d دقائق",h:"ساعة",hh:"%d ساعات",d:"يوم",dd:"%d أيام",M:"شهر",MM:"%d أشهر",y:"سنة",yy:"%d سنوات"},week:{dow:0,doy:4}}),
//! moment.js locale configuration
//! locale : Arabic (Kuwait) [ar-kw]
//! author : Nusret Parlak: https://github.com/nusretparlak
a.defineLocale("ar-kw",{months:"يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),monthsShort:"يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),weekdays:"الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),weekdaysShort:"احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"),weekdaysMin:"ح_ن_ث_ر_خ_ج_س".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[اليوم على الساعة] LT",nextDay:"[غدا على الساعة] LT",nextWeek:"dddd [على الساعة] LT",lastDay:"[أمس على الساعة] LT",lastWeek:"dddd [على الساعة] LT",sameElse:"L"},relativeTime:{future:"في %s",past:"منذ %s",s:"ثوان",m:"دقيقة",mm:"%d دقائق",h:"ساعة",hh:"%d ساعات",d:"يوم",dd:"%d أيام",M:"شهر",MM:"%d أشهر",y:"سنة",yy:"%d سنوات"},week:{dow:0,doy:12}});
//! moment.js locale configuration
//! locale : Arabic (Lybia) [ar-ly]
//! author : Ali Hmer: https://github.com/kikoanis
var xg={1:"1",2:"2",3:"3",4:"4",5:"5",6:"6",7:"7",8:"8",9:"9",0:"0"},yg=function(a){return 0===a?0:1===a?1:2===a?2:a%100>=3&&a%100<=10?3:a%100>=11?4:5},zg={s:["أقل من ثانية","ثانية واحدة",["ثانيتان","ثانيتين"],"%d ثوان","%d ثانية","%d ثانية"],m:["أقل من دقيقة","دقيقة واحدة",["دقيقتان","دقيقتين"],"%d دقائق","%d دقيقة","%d دقيقة"],h:["أقل من ساعة","ساعة واحدة",["ساعتان","ساعتين"],"%d ساعات","%d ساعة","%d ساعة"],d:["أقل من يوم","يوم واحد",["يومان","يومين"],"%d أيام","%d يومًا","%d يوم"],M:["أقل من شهر","شهر واحد",["شهران","شهرين"],"%d أشهر","%d شهرا","%d شهر"],y:["أقل من عام","عام واحد",["عامان","عامين"],"%d أعوام","%d عامًا","%d عام"]},Ag=function(a){return function(b,c,d,e){var f=yg(b),g=zg[a][yg(b)];return 2===f&&(g=g[c?0:1]),g.replace(/%d/i,b)}},Bg=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];a.defineLocale("ar-ly",{months:Bg,monthsShort:Bg,weekdays:"الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),weekdaysShort:"أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),weekdaysMin:"ح_ن_ث_ر_خ_ج_س".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"D/‏M/‏YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},meridiemParse:/ص|م/,isPM:function(a){return"م"===a},meridiem:function(a,b,c){return a<12?"ص":"م"},calendar:{sameDay:"[اليوم عند الساعة] LT",nextDay:"[غدًا عند الساعة] LT",nextWeek:"dddd [عند الساعة] LT",lastDay:"[أمس عند الساعة] LT",lastWeek:"dddd [عند الساعة] LT",sameElse:"L"},relativeTime:{future:"بعد %s",past:"منذ %s",s:Ag("s"),m:Ag("m"),mm:Ag("m"),h:Ag("h"),hh:Ag("h"),d:Ag("d"),dd:Ag("d"),M:Ag("M"),MM:Ag("M"),y:Ag("y"),yy:Ag("y")},preparse:function(a){return a.replace(/\u200f/g,"").replace(/،/g,",")},postformat:function(a){return a.replace(/\d/g,function(a){return xg[a]}).replace(/,/g,"،")},week:{dow:6,doy:12}}),
//! moment.js locale configuration
//! locale : Arabic (Morocco) [ar-ma]
//! author : ElFadili Yassine : https://github.com/ElFadiliY
//! author : Abdel Said : https://github.com/abdelsaid
a.defineLocale("ar-ma",{months:"يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),monthsShort:"يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),weekdays:"الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),weekdaysShort:"احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"),weekdaysMin:"ح_ن_ث_ر_خ_ج_س".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[اليوم على الساعة] LT",nextDay:"[غدا على الساعة] LT",nextWeek:"dddd [على الساعة] LT",lastDay:"[أمس على الساعة] LT",lastWeek:"dddd [على الساعة] LT",sameElse:"L"},relativeTime:{future:"في %s",past:"منذ %s",s:"ثوان",m:"دقيقة",mm:"%d دقائق",h:"ساعة",hh:"%d ساعات",d:"يوم",dd:"%d أيام",M:"شهر",MM:"%d أشهر",y:"سنة",yy:"%d سنوات"},week:{dow:6,doy:12}});
//! moment.js locale configuration
//! locale : Arabic (Saudi Arabia) [ar-sa]
//! author : Suhail Alkowaileet : https://github.com/xsoh
var Cg={1:"١",2:"٢",3:"٣",4:"٤",5:"٥",6:"٦",7:"٧",8:"٨",9:"٩",0:"٠"},Dg={"١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9","٠":"0"};a.defineLocale("ar-sa",{months:"يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),monthsShort:"يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),weekdays:"الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),weekdaysShort:"أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),weekdaysMin:"ح_ن_ث_ر_خ_ج_س".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},meridiemParse:/ص|م/,isPM:function(a){return"م"===a},meridiem:function(a,b,c){return a<12?"ص":"م"},calendar:{sameDay:"[اليوم على الساعة] LT",nextDay:"[غدا على الساعة] LT",nextWeek:"dddd [على الساعة] LT",lastDay:"[أمس على الساعة] LT",lastWeek:"dddd [على الساعة] LT",sameElse:"L"},relativeTime:{future:"في %s",past:"منذ %s",s:"ثوان",m:"دقيقة",mm:"%d دقائق",h:"ساعة",hh:"%d ساعات",d:"يوم",dd:"%d أيام",M:"شهر",MM:"%d أشهر",y:"سنة",yy:"%d سنوات"},preparse:function(a){return a.replace(/[١٢٣٤٥٦٧٨٩٠]/g,function(a){return Dg[a]}).replace(/،/g,",")},postformat:function(a){return a.replace(/\d/g,function(a){return Cg[a]}).replace(/,/g,"،")},week:{dow:0,doy:6}}),
//! moment.js locale configuration
//! locale  :  Arabic (Tunisia) [ar-tn]
//! author : Nader Toukabri : https://github.com/naderio
a.defineLocale("ar-tn",{months:"جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),monthsShort:"جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),weekdays:"الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),weekdaysShort:"أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),weekdaysMin:"ح_ن_ث_ر_خ_ج_س".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[اليوم على الساعة] LT",nextDay:"[غدا على الساعة] LT",nextWeek:"dddd [على الساعة] LT",lastDay:"[أمس على الساعة] LT",lastWeek:"dddd [على الساعة] LT",sameElse:"L"},relativeTime:{future:"في %s",past:"منذ %s",s:"ثوان",m:"دقيقة",mm:"%d دقائق",h:"ساعة",hh:"%d ساعات",d:"يوم",dd:"%d أيام",M:"شهر",MM:"%d أشهر",y:"سنة",yy:"%d سنوات"},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Arabic [ar]
//! author : Abdel Said: https://github.com/abdelsaid
//! author : Ahmed Elkhatib
//! author : forabi https://github.com/forabi
var Eg={1:"١",2:"٢",3:"٣",4:"٤",5:"٥",6:"٦",7:"٧",8:"٨",9:"٩",0:"٠"},Fg={"١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9","٠":"0"},Gg=function(a){return 0===a?0:1===a?1:2===a?2:a%100>=3&&a%100<=10?3:a%100>=11?4:5},Hg={s:["أقل من ثانية","ثانية واحدة",["ثانيتان","ثانيتين"],"%d ثوان","%d ثانية","%d ثانية"],m:["أقل من دقيقة","دقيقة واحدة",["دقيقتان","دقيقتين"],"%d دقائق","%d دقيقة","%d دقيقة"],h:["أقل من ساعة","ساعة واحدة",["ساعتان","ساعتين"],"%d ساعات","%d ساعة","%d ساعة"],d:["أقل من يوم","يوم واحد",["يومان","يومين"],"%d أيام","%d يومًا","%d يوم"],M:["أقل من شهر","شهر واحد",["شهران","شهرين"],"%d أشهر","%d شهرا","%d شهر"],y:["أقل من عام","عام واحد",["عامان","عامين"],"%d أعوام","%d عامًا","%d عام"]},Ig=function(a){return function(b,c,d,e){var f=Gg(b),g=Hg[a][Gg(b)];return 2===f&&(g=g[c?0:1]),g.replace(/%d/i,b)}},Jg=["كانون الثاني يناير","شباط فبراير","آذار مارس","نيسان أبريل","أيار مايو","حزيران يونيو","تموز يوليو","آب أغسطس","أيلول سبتمبر","تشرين الأول أكتوبر","تشرين الثاني نوفمبر","كانون الأول ديسمبر"];a.defineLocale("ar",{months:Jg,monthsShort:Jg,weekdays:"الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),weekdaysShort:"أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),weekdaysMin:"ح_ن_ث_ر_خ_ج_س".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"D/‏M/‏YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},meridiemParse:/ص|م/,isPM:function(a){return"م"===a},meridiem:function(a,b,c){return a<12?"ص":"م"},calendar:{sameDay:"[اليوم عند الساعة] LT",nextDay:"[غدًا عند الساعة] LT",nextWeek:"dddd [عند الساعة] LT",lastDay:"[أمس عند الساعة] LT",lastWeek:"dddd [عند الساعة] LT",sameElse:"L"},relativeTime:{future:"بعد %s",past:"منذ %s",s:Ig("s"),m:Ig("m"),mm:Ig("m"),h:Ig("h"),hh:Ig("h"),d:Ig("d"),dd:Ig("d"),M:Ig("M"),MM:Ig("M"),y:Ig("y"),yy:Ig("y")},preparse:function(a){return a.replace(/\u200f/g,"").replace(/[١٢٣٤٥٦٧٨٩٠]/g,function(a){return Fg[a]}).replace(/،/g,",")},postformat:function(a){return a.replace(/\d/g,function(a){return Eg[a]}).replace(/,/g,"،")},week:{dow:6,doy:12}});
//! moment.js locale configuration
//! locale : Azerbaijani [az]
//! author : topchiyev : https://github.com/topchiyev
var Kg={1:"-inci",5:"-inci",8:"-inci",70:"-inci",80:"-inci",2:"-nci",7:"-nci",20:"-nci",50:"-nci",3:"-üncü",4:"-üncü",100:"-üncü",6:"-ncı",9:"-uncu",10:"-uncu",30:"-uncu",60:"-ıncı",90:"-ıncı"};a.defineLocale("az",{months:"yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr".split("_"),monthsShort:"yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek".split("_"),weekdays:"Bazar_Bazar ertəsi_Çərşənbə axşamı_Çərşənbə_Cümə axşamı_Cümə_Şənbə".split("_"),weekdaysShort:"Baz_BzE_ÇAx_Çər_CAx_Cüm_Şən".split("_"),weekdaysMin:"Bz_BE_ÇA_Çə_CA_Cü_Şə".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[bugün saat] LT",nextDay:"[sabah saat] LT",nextWeek:"[gələn həftə] dddd [saat] LT",lastDay:"[dünən] LT",lastWeek:"[keçən həftə] dddd [saat] LT",sameElse:"L"},relativeTime:{future:"%s sonra",past:"%s əvvəl",s:"birneçə saniyyə",m:"bir dəqiqə",mm:"%d dəqiqə",h:"bir saat",hh:"%d saat",d:"bir gün",dd:"%d gün",M:"bir ay",MM:"%d ay",y:"bir il",yy:"%d il"},meridiemParse:/gecə|səhər|gündüz|axşam/,isPM:function(a){return/^(gündüz|axşam)$/.test(a)},meridiem:function(a,b,c){return a<4?"gecə":a<12?"səhər":a<17?"gündüz":"axşam"},dayOfMonthOrdinalParse:/\d{1,2}-(ıncı|inci|nci|üncü|ncı|uncu)/,ordinal:function(a){if(0===a)return a+"-ıncı";var b=a%10,c=a%100-b,d=a>=100?100:null;return a+(Kg[b]||Kg[c]||Kg[d])},week:{dow:1,doy:7}}),a.defineLocale("be",{months:{format:"студзеня_лютага_сакавіка_красавіка_траўня_чэрвеня_ліпеня_жніўня_верасня_кастрычніка_лістапада_снежня".split("_"),standalone:"студзень_люты_сакавік_красавік_травень_чэрвень_ліпень_жнівень_верасень_кастрычнік_лістапад_снежань".split("_")},monthsShort:"студ_лют_сак_крас_трав_чэрв_ліп_жнів_вер_каст_ліст_снеж".split("_"),weekdays:{format:"нядзелю_панядзелак_аўторак_сераду_чацвер_пятніцу_суботу".split("_"),standalone:"нядзеля_панядзелак_аўторак_серада_чацвер_пятніца_субота".split("_"),isFormat:/\[ ?[Вв] ?(?:мінулую|наступную)? ?\] ?dddd/},weekdaysShort:"нд_пн_ат_ср_чц_пт_сб".split("_"),weekdaysMin:"нд_пн_ат_ср_чц_пт_сб".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY г.",LLL:"D MMMM YYYY г., HH:mm",LLLL:"dddd, D MMMM YYYY г., HH:mm"},calendar:{sameDay:"[Сёння ў] LT",nextDay:"[Заўтра ў] LT",lastDay:"[Учора ў] LT",nextWeek:function(){return"[У] dddd [ў] LT"},lastWeek:function(){switch(this.day()){case 0:case 3:case 5:case 6:return"[У мінулую] dddd [ў] LT";case 1:case 2:case 4:return"[У мінулы] dddd [ў] LT"}},sameElse:"L"},relativeTime:{future:"праз %s",past:"%s таму",s:"некалькі секунд",m:td,mm:td,h:td,hh:td,d:"дзень",dd:td,M:"месяц",MM:td,y:"год",yy:td},meridiemParse:/ночы|раніцы|дня|вечара/,isPM:function(a){return/^(дня|вечара)$/.test(a)},meridiem:function(a,b,c){return a<4?"ночы":a<12?"раніцы":a<17?"дня":"вечара"},dayOfMonthOrdinalParse:/\d{1,2}-(і|ы|га)/,ordinal:function(a,b){switch(b){case"M":case"d":case"DDD":case"w":case"W":return a%10!==2&&a%10!==3||a%100===12||a%100===13?a+"-ы":a+"-і";case"D":return a+"-га";default:return a}},week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Bulgarian [bg]
//! author : Krasen Borisov : https://github.com/kraz
a.defineLocale("bg",{months:"януари_февруари_март_април_май_юни_юли_август_септември_октомври_ноември_декември".split("_"),monthsShort:"янр_фев_мар_апр_май_юни_юли_авг_сеп_окт_ное_дек".split("_"),weekdays:"неделя_понеделник_вторник_сряда_четвъртък_петък_събота".split("_"),weekdaysShort:"нед_пон_вто_сря_чет_пет_съб".split("_"),weekdaysMin:"нд_пн_вт_ср_чт_пт_сб".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"D.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY H:mm",LLLL:"dddd, D MMMM YYYY H:mm"},calendar:{sameDay:"[Днес в] LT",nextDay:"[Утре в] LT",nextWeek:"dddd [в] LT",lastDay:"[Вчера в] LT",lastWeek:function(){switch(this.day()){case 0:case 3:case 6:return"[В изминалата] dddd [в] LT";case 1:case 2:case 4:case 5:return"[В изминалия] dddd [в] LT"}},sameElse:"L"},relativeTime:{future:"след %s",past:"преди %s",s:"няколко секунди",m:"минута",mm:"%d минути",h:"час",hh:"%d часа",d:"ден",dd:"%d дни",M:"месец",MM:"%d месеца",y:"година",yy:"%d години"},dayOfMonthOrdinalParse:/\d{1,2}-(ев|ен|ти|ви|ри|ми)/,ordinal:function(a){var b=a%10,c=a%100;return 0===a?a+"-ев":0===c?a+"-ен":c>10&&c<20?a+"-ти":1===b?a+"-ви":2===b?a+"-ри":7===b||8===b?a+"-ми":a+"-ти"},week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Bengali [bn]
//! author : Kaushik Gandhi : https://github.com/kaushikgandhi
var Lg={1:"১",2:"২",3:"৩",4:"৪",5:"৫",6:"৬",7:"৭",8:"৮",9:"৯",0:"০"},Mg={"১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9","০":"0"};a.defineLocale("bn",{months:"জানুয়ারী_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর".split("_"),monthsShort:"জানু_ফেব_মার্চ_এপ্র_মে_জুন_জুল_আগ_সেপ্ট_অক্টো_নভে_ডিসে".split("_"),weekdays:"রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার".split("_"),weekdaysShort:"রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি".split("_"),weekdaysMin:"রবি_সোম_মঙ্গ_বুধ_বৃহঃ_শুক্র_শনি".split("_"),longDateFormat:{LT:"A h:mm সময়",LTS:"A h:mm:ss সময়",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm সময়",LLLL:"dddd, D MMMM YYYY, A h:mm সময়"},calendar:{sameDay:"[আজ] LT",nextDay:"[আগামীকাল] LT",nextWeek:"dddd, LT",lastDay:"[গতকাল] LT",lastWeek:"[গত] dddd, LT",sameElse:"L"},relativeTime:{future:"%s পরে",past:"%s আগে",s:"কয়েক সেকেন্ড",m:"এক মিনিট",mm:"%d মিনিট",h:"এক ঘন্টা",hh:"%d ঘন্টা",d:"এক দিন",dd:"%d দিন",M:"এক মাস",MM:"%d মাস",y:"এক বছর",yy:"%d বছর"},preparse:function(a){return a.replace(/[১২৩৪৫৬৭৮৯০]/g,function(a){return Mg[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return Lg[a]})},meridiemParse:/রাত|সকাল|দুপুর|বিকাল|রাত/,meridiemHour:function(a,b){return 12===a&&(a=0),"রাত"===b&&a>=4||"দুপুর"===b&&a<5||"বিকাল"===b?a+12:a},meridiem:function(a,b,c){return a<4?"রাত":a<10?"সকাল":a<17?"দুপুর":a<20?"বিকাল":"রাত"},week:{dow:0,doy:6}});
//! moment.js locale configuration
//! locale : Tibetan [bo]
//! author : Thupten N. Chakrishar : https://github.com/vajradog
var Ng={1:"༡",2:"༢",3:"༣",4:"༤",5:"༥",6:"༦",7:"༧",8:"༨",9:"༩",0:"༠"},Og={"༡":"1","༢":"2","༣":"3","༤":"4","༥":"5","༦":"6","༧":"7","༨":"8","༩":"9","༠":"0"};a.defineLocale("bo",{months:"ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ".split("_"),monthsShort:"ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ".split("_"),weekdays:"གཟའ་ཉི་མ་_གཟའ་ཟླ་བ་_གཟའ་མིག་དམར་_གཟའ་ལྷག་པ་_གཟའ་ཕུར་བུ_གཟའ་པ་སངས་_གཟའ་སྤེན་པ་".split("_"),weekdaysShort:"ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་".split("_"),weekdaysMin:"ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་".split("_"),longDateFormat:{LT:"A h:mm",LTS:"A h:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm",LLLL:"dddd, D MMMM YYYY, A h:mm"},calendar:{sameDay:"[དི་རིང] LT",nextDay:"[སང་ཉིན] LT",nextWeek:"[བདུན་ཕྲག་རྗེས་མ], LT",lastDay:"[ཁ་སང] LT",lastWeek:"[བདུན་ཕྲག་མཐའ་མ] dddd, LT",sameElse:"L"},relativeTime:{future:"%s ལ་",past:"%s སྔན་ལ",s:"ལམ་སང",m:"སྐར་མ་གཅིག",mm:"%d སྐར་མ",h:"ཆུ་ཚོད་གཅིག",hh:"%d ཆུ་ཚོད",d:"ཉིན་གཅིག",dd:"%d ཉིན་",M:"ཟླ་བ་གཅིག",MM:"%d ཟླ་བ",y:"ལོ་གཅིག",yy:"%d ལོ"},preparse:function(a){return a.replace(/[༡༢༣༤༥༦༧༨༩༠]/g,function(a){return Og[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return Ng[a]})},meridiemParse:/མཚན་མོ|ཞོགས་ཀས|ཉིན་གུང|དགོང་དག|མཚན་མོ/,meridiemHour:function(a,b){return 12===a&&(a=0),"མཚན་མོ"===b&&a>=4||"ཉིན་གུང"===b&&a<5||"དགོང་དག"===b?a+12:a},meridiem:function(a,b,c){return a<4?"མཚན་མོ":a<10?"ཞོགས་ཀས":a<17?"ཉིན་གུང":a<20?"དགོང་དག":"མཚན་མོ"},week:{dow:0,doy:6}}),a.defineLocale("br",{months:"Genver_C'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu".split("_"),monthsShort:"Gen_C'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker".split("_"),weekdays:"Sul_Lun_Meurzh_Merc'her_Yaou_Gwener_Sadorn".split("_"),weekdaysShort:"Sul_Lun_Meu_Mer_Yao_Gwe_Sad".split("_"),weekdaysMin:"Su_Lu_Me_Mer_Ya_Gw_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"h[e]mm A",LTS:"h[e]mm:ss A",L:"DD/MM/YYYY",LL:"D [a viz] MMMM YYYY",LLL:"D [a viz] MMMM YYYY h[e]mm A",LLLL:"dddd, D [a viz] MMMM YYYY h[e]mm A"},calendar:{sameDay:"[Hiziv da] LT",nextDay:"[Warc'hoazh da] LT",nextWeek:"dddd [da] LT",lastDay:"[Dec'h da] LT",lastWeek:"dddd [paset da] LT",sameElse:"L"},relativeTime:{future:"a-benn %s",past:"%s 'zo",s:"un nebeud segondennoù",m:"ur vunutenn",mm:ud,h:"un eur",hh:"%d eur",d:"un devezh",dd:ud,M:"ur miz",MM:ud,y:"ur bloaz",yy:vd},dayOfMonthOrdinalParse:/\d{1,2}(añ|vet)/,ordinal:function(a){var b=1===a?"añ":"vet";return a+b},week:{dow:1,doy:4}}),a.defineLocale("bs",{months:"januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar".split("_"),monthsShort:"jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.".split("_"),monthsParseExact:!0,weekdays:"nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),weekdaysShort:"ned._pon._uto._sri._čet._pet._sub.".split("_"),weekdaysMin:"ne_po_ut_sr_če_pe_su".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd, D. MMMM YYYY H:mm"},calendar:{sameDay:"[danas u] LT",nextDay:"[sutra u] LT",nextWeek:function(){switch(this.day()){case 0:return"[u] [nedjelju] [u] LT";case 3:return"[u] [srijedu] [u] LT";case 6:return"[u] [subotu] [u] LT";case 1:case 2:case 4:case 5:return"[u] dddd [u] LT"}},lastDay:"[jučer u] LT",lastWeek:function(){switch(this.day()){case 0:case 3:return"[prošlu] dddd [u] LT";case 6:return"[prošle] [subote] [u] LT";case 1:case 2:case 4:case 5:return"[prošli] dddd [u] LT"}},sameElse:"L"},relativeTime:{future:"za %s",past:"prije %s",s:"par sekundi",m:zd,mm:zd,h:zd,hh:zd,d:"dan",dd:zd,M:"mjesec",MM:zd,y:"godinu",yy:zd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Catalan [ca]
//! author : Juan G. Hurtado : https://github.com/juanghurtado
a.defineLocale("ca",{months:{standalone:"gener_febrer_març_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre".split("_"),format:"de gener_de febrer_de març_d'abril_de maig_de juny_de juliol_d'agost_de setembre_d'octubre_de novembre_de desembre".split("_"),isFormat:/D[oD]?(\s)+MMMM/},monthsShort:"gen._febr._març_abr._maig_juny_jul._ag._set._oct._nov._des.".split("_"),monthsParseExact:!0,weekdays:"diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte".split("_"),weekdaysShort:"dg._dl._dt._dc._dj._dv._ds.".split("_"),weekdaysMin:"Dg_Dl_Dt_Dc_Dj_Dv_Ds".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD/MM/YYYY",LL:"[el] D MMMM [de] YYYY",ll:"D MMM YYYY",LLL:"[el] D MMMM [de] YYYY [a les] H:mm",lll:"D MMM YYYY, H:mm",LLLL:"[el] dddd D MMMM [de] YYYY [a les] H:mm",llll:"ddd D MMM YYYY, H:mm"},calendar:{sameDay:function(){return"[avui a "+(1!==this.hours()?"les":"la")+"] LT"},nextDay:function(){return"[demà a "+(1!==this.hours()?"les":"la")+"] LT"},nextWeek:function(){return"dddd [a "+(1!==this.hours()?"les":"la")+"] LT"},lastDay:function(){return"[ahir a "+(1!==this.hours()?"les":"la")+"] LT"},lastWeek:function(){return"[el] dddd [passat a "+(1!==this.hours()?"les":"la")+"] LT"},sameElse:"L"},relativeTime:{future:"d'aquí %s",past:"fa %s",s:"uns segons",m:"un minut",mm:"%d minuts",h:"una hora",hh:"%d hores",d:"un dia",dd:"%d dies",M:"un mes",MM:"%d mesos",y:"un any",yy:"%d anys"},dayOfMonthOrdinalParse:/\d{1,2}(r|n|t|è|a)/,ordinal:function(a,b){var c=1===a?"r":2===a?"n":3===a?"r":4===a?"t":"è";return"w"!==b&&"W"!==b||(c="a"),a+c},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Czech [cs]
//! author : petrbela : https://github.com/petrbela
var Pg="leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec".split("_"),Qg="led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro".split("_");a.defineLocale("cs",{months:Pg,monthsShort:Qg,monthsParse:function(a,b){var c,d=[];for(c=0;c<12;c++)d[c]=new RegExp("^"+a[c]+"$|^"+b[c]+"$","i");return d}(Pg,Qg),shortMonthsParse:function(a){var b,c=[];for(b=0;b<12;b++)c[b]=new RegExp("^"+a[b]+"$","i");return c}(Qg),longMonthsParse:function(a){var b,c=[];for(b=0;b<12;b++)c[b]=new RegExp("^"+a[b]+"$","i");return c}(Pg),weekdays:"neděle_pondělí_úterý_středa_čtvrtek_pátek_sobota".split("_"),weekdaysShort:"ne_po_út_st_čt_pá_so".split("_"),weekdaysMin:"ne_po_út_st_čt_pá_so".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd D. MMMM YYYY H:mm",l:"D. M. YYYY"},calendar:{sameDay:"[dnes v] LT",nextDay:"[zítra v] LT",nextWeek:function(){switch(this.day()){case 0:return"[v neděli v] LT";case 1:case 2:return"[v] dddd [v] LT";case 3:return"[ve středu v] LT";case 4:return"[ve čtvrtek v] LT";case 5:return"[v pátek v] LT";case 6:return"[v sobotu v] LT"}},lastDay:"[včera v] LT",lastWeek:function(){switch(this.day()){case 0:return"[minulou neděli v] LT";case 1:case 2:return"[minulé] dddd [v] LT";case 3:return"[minulou středu v] LT";case 4:case 5:return"[minulý] dddd [v] LT";case 6:return"[minulou sobotu v] LT"}},sameElse:"L"},relativeTime:{future:"za %s",past:"před %s",s:Bd,m:Bd,mm:Bd,h:Bd,hh:Bd,d:Bd,dd:Bd,M:Bd,MM:Bd,y:Bd,yy:Bd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Chuvash [cv]
//! author : Anatoly Mironov : https://github.com/mirontoli
a.defineLocale("cv",{months:"кӑрлач_нарӑс_пуш_ака_май_ҫӗртме_утӑ_ҫурла_авӑн_юпа_чӳк_раштав".split("_"),monthsShort:"кӑр_нар_пуш_ака_май_ҫӗр_утӑ_ҫур_авн_юпа_чӳк_раш".split("_"),weekdays:"вырсарникун_тунтикун_ытларикун_юнкун_кӗҫнерникун_эрнекун_шӑматкун".split("_"),weekdaysShort:"выр_тун_ытл_юн_кӗҫ_эрн_шӑм".split("_"),weekdaysMin:"вр_тн_ыт_юн_кҫ_эр_шм".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD-MM-YYYY",LL:"YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ]",LLL:"YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm",LLLL:"dddd, YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm"},calendar:{sameDay:"[Паян] LT [сехетре]",nextDay:"[Ыран] LT [сехетре]",lastDay:"[Ӗнер] LT [сехетре]",nextWeek:"[Ҫитес] dddd LT [сехетре]",lastWeek:"[Иртнӗ] dddd LT [сехетре]",sameElse:"L"},relativeTime:{future:function(a){var b=/сехет$/i.exec(a)?"рен":/ҫул$/i.exec(a)?"тан":"ран";return a+b},past:"%s каялла",s:"пӗр-ик ҫеккунт",m:"пӗр минут",mm:"%d минут",h:"пӗр сехет",hh:"%d сехет",d:"пӗр кун",dd:"%d кун",M:"пӗр уйӑх",MM:"%d уйӑх",y:"пӗр ҫул",yy:"%d ҫул"},dayOfMonthOrdinalParse:/\d{1,2}-мӗш/,ordinal:"%d-мӗш",week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Welsh [cy]
//! author : Robert Allen : https://github.com/robgallen
//! author : https://github.com/ryangreaves
a.defineLocale("cy",{months:"Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr".split("_"),monthsShort:"Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag".split("_"),weekdays:"Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn".split("_"),weekdaysShort:"Sul_Llun_Maw_Mer_Iau_Gwe_Sad".split("_"),weekdaysMin:"Su_Ll_Ma_Me_Ia_Gw_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Heddiw am] LT",nextDay:"[Yfory am] LT",nextWeek:"dddd [am] LT",lastDay:"[Ddoe am] LT",lastWeek:"dddd [diwethaf am] LT",sameElse:"L"},relativeTime:{future:"mewn %s",past:"%s yn ôl",s:"ychydig eiliadau",m:"munud",mm:"%d munud",h:"awr",hh:"%d awr",d:"diwrnod",dd:"%d diwrnod",M:"mis",MM:"%d mis",y:"blwyddyn",yy:"%d flynedd"},dayOfMonthOrdinalParse:/\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,ordinal:function(a){var b=a,c="",d=["","af","il","ydd","ydd","ed","ed","ed","fed","fed","fed","eg","fed","eg","eg","fed","eg","eg","fed","eg","fed"];return b>20?c=40===b||50===b||60===b||80===b||100===b?"fed":"ain":b>0&&(c=d[b]),a+c},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Danish [da]
//! author : Ulrik Nielsen : https://github.com/mrbase
a.defineLocale("da",{months:"januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december".split("_"),monthsShort:"jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),weekdays:"søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"),weekdaysShort:"søn_man_tir_ons_tor_fre_lør".split("_"),weekdaysMin:"sø_ma_ti_on_to_fr_lø".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY HH:mm",LLLL:"dddd [d.] D. MMMM YYYY [kl.] HH:mm"},calendar:{sameDay:"[i dag kl.] LT",nextDay:"[i morgen kl.] LT",nextWeek:"på dddd [kl.] LT",lastDay:"[i går kl.] LT",lastWeek:"[i] dddd[s kl.] LT",sameElse:"L"},relativeTime:{future:"om %s",past:"%s siden",s:"få sekunder",m:"et minut",mm:"%d minutter",h:"en time",hh:"%d timer",d:"en dag",dd:"%d dage",M:"en måned",MM:"%d måneder",y:"et år",yy:"%d år"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),a.defineLocale("de-at",{months:"Jänner_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),monthsShort:"Jän._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),monthsParseExact:!0,weekdays:"Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),weekdaysShort:"So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),weekdaysMin:"So_Mo_Di_Mi_Do_Fr_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY HH:mm",LLLL:"dddd, D. MMMM YYYY HH:mm"},calendar:{sameDay:"[heute um] LT [Uhr]",sameElse:"L",nextDay:"[morgen um] LT [Uhr]",nextWeek:"dddd [um] LT [Uhr]",lastDay:"[gestern um] LT [Uhr]",lastWeek:"[letzten] dddd [um] LT [Uhr]"},relativeTime:{future:"in %s",past:"vor %s",s:"ein paar Sekunden",m:Cd,mm:"%d Minuten",h:Cd,hh:"%d Stunden",d:Cd,dd:Cd,M:Cd,MM:Cd,y:Cd,yy:Cd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),a.defineLocale("de-ch",{months:"Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),monthsShort:"Jan._Febr._März_April_Mai_Juni_Juli_Aug._Sept._Okt._Nov._Dez.".split("_"),monthsParseExact:!0,weekdays:"Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),weekdaysShort:"So_Mo_Di_Mi_Do_Fr_Sa".split("_"),weekdaysMin:"So_Mo_Di_Mi_Do_Fr_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH.mm",LTS:"HH.mm.ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY HH.mm",LLLL:"dddd, D. MMMM YYYY HH.mm"},calendar:{sameDay:"[heute um] LT [Uhr]",sameElse:"L",nextDay:"[morgen um] LT [Uhr]",nextWeek:"dddd [um] LT [Uhr]",lastDay:"[gestern um] LT [Uhr]",lastWeek:"[letzten] dddd [um] LT [Uhr]"},relativeTime:{future:"in %s",past:"vor %s",s:"ein paar Sekunden",m:Dd,mm:"%d Minuten",h:Dd,hh:"%d Stunden",d:Dd,dd:Dd,M:Dd,MM:Dd,y:Dd,yy:Dd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),a.defineLocale("de",{months:"Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),monthsShort:"Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),monthsParseExact:!0,weekdays:"Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),weekdaysShort:"So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),weekdaysMin:"So_Mo_Di_Mi_Do_Fr_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY HH:mm",LLLL:"dddd, D. MMMM YYYY HH:mm"},calendar:{sameDay:"[heute um] LT [Uhr]",sameElse:"L",nextDay:"[morgen um] LT [Uhr]",nextWeek:"dddd [um] LT [Uhr]",lastDay:"[gestern um] LT [Uhr]",lastWeek:"[letzten] dddd [um] LT [Uhr]"},relativeTime:{future:"in %s",past:"vor %s",s:"ein paar Sekunden",m:Ed,mm:"%d Minuten",h:Ed,hh:"%d Stunden",d:Ed,dd:Ed,M:Ed,MM:Ed,y:Ed,yy:Ed},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Maldivian [dv]
//! author : Jawish Hameed : https://github.com/jawish
var Rg=["ޖެނުއަރީ","ފެބްރުއަރީ","މާރިޗު","އޭޕްރީލު","މޭ","ޖޫން","ޖުލައި","އޯގަސްޓު","ސެޕްޓެމްބަރު","އޮކްޓޯބަރު","ނޮވެމްބަރު","ޑިސެމްބަރު"],Sg=["އާދިއްތަ","ހޯމަ","އަންގާރަ","ބުދަ","ބުރާސްފަތި","ހުކުރު","ހޮނިހިރު"];a.defineLocale("dv",{months:Rg,monthsShort:Rg,weekdays:Sg,weekdaysShort:Sg,weekdaysMin:"އާދި_ހޯމަ_އަން_ބުދަ_ބުރާ_ހުކު_ހޮނި".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"D/M/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},meridiemParse:/މކ|މފ/,isPM:function(a){return"މފ"===a},meridiem:function(a,b,c){return a<12?"މކ":"މފ"},calendar:{sameDay:"[މިއަދު] LT",nextDay:"[މާދަމާ] LT",nextWeek:"dddd LT",lastDay:"[އިއްޔެ] LT",lastWeek:"[ފާއިތުވި] dddd LT",sameElse:"L"},relativeTime:{future:"ތެރޭގައި %s",past:"ކުރިން %s",s:"ސިކުންތުކޮޅެއް",m:"މިނިޓެއް",mm:"މިނިޓު %d",h:"ގަޑިއިރެއް",hh:"ގަޑިއިރު %d",d:"ދުވަހެއް",dd:"ދުވަސް %d",M:"މަހެއް",MM:"މަސް %d",y:"އަހަރެއް",yy:"އަހަރު %d"},preparse:function(a){return a.replace(/،/g,",")},postformat:function(a){return a.replace(/,/g,"،")},week:{dow:7,doy:12}}),
//! moment.js locale configuration
//! locale : Greek [el]
//! author : Aggelos Karalias : https://github.com/mehiel
a.defineLocale("el",{monthsNominativeEl:"Ιανουάριος_Φεβρουάριος_Μάρτιος_Απρίλιος_Μάιος_Ιούνιος_Ιούλιος_Αύγουστος_Σεπτέμβριος_Οκτώβριος_Νοέμβριος_Δεκέμβριος".split("_"),monthsGenitiveEl:"Ιανουαρίου_Φεβρουαρίου_Μαρτίου_Απριλίου_Μαΐου_Ιουνίου_Ιουλίου_Αυγούστου_Σεπτεμβρίου_Οκτωβρίου_Νοεμβρίου_Δεκεμβρίου".split("_"),months:function(a,b){return a?/D/.test(b.substring(0,b.indexOf("MMMM")))?this._monthsGenitiveEl[a.month()]:this._monthsNominativeEl[a.month()]:this._monthsNominativeEl},monthsShort:"Ιαν_Φεβ_Μαρ_Απρ_Μαϊ_Ιουν_Ιουλ_Αυγ_Σεπ_Οκτ_Νοε_Δεκ".split("_"),weekdays:"Κυριακή_Δευτέρα_Τρίτη_Τετάρτη_Πέμπτη_Παρασκευή_Σάββατο".split("_"),weekdaysShort:"Κυρ_Δευ_Τρι_Τετ_Πεμ_Παρ_Σαβ".split("_"),weekdaysMin:"Κυ_Δε_Τρ_Τε_Πε_Πα_Σα".split("_"),meridiem:function(a,b,c){return a>11?c?"μμ":"ΜΜ":c?"πμ":"ΠΜ"},isPM:function(a){return"μ"===(a+"").toLowerCase()[0]},meridiemParse:/[ΠΜ]\.?Μ?\.?/i,longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY h:mm A",LLLL:"dddd, D MMMM YYYY h:mm A"},calendarEl:{sameDay:"[Σήμερα {}] LT",nextDay:"[Αύριο {}] LT",nextWeek:"dddd [{}] LT",lastDay:"[Χθες {}] LT",lastWeek:function(){switch(this.day()){case 6:return"[το προηγούμενο] dddd [{}] LT";default:return"[την προηγούμενη] dddd [{}] LT"}},sameElse:"L"},calendar:function(a,b){var c=this._calendarEl[a],d=b&&b.hours();return z(c)&&(c=c.apply(b)),c.replace("{}",d%12===1?"στη":"στις")},relativeTime:{future:"σε %s",past:"%s πριν",s:"λίγα δευτερόλεπτα",m:"ένα λεπτό",mm:"%d λεπτά",h:"μία ώρα",hh:"%d ώρες",d:"μία μέρα",dd:"%d μέρες",M:"ένας μήνας",MM:"%d μήνες",y:"ένας χρόνος",yy:"%d χρόνια"},dayOfMonthOrdinalParse:/\d{1,2}η/,ordinal:"%dη",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : English (Australia) [en-au]
//! author : Jared Morse : https://github.com/jarcoal
a.defineLocale("en-au",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY h:mm A",LLLL:"dddd, D MMMM YYYY h:mm A"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},dayOfMonthOrdinalParse:/\d{1,2}(st|nd|rd|th)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : English (Canada) [en-ca]
//! author : Jonathan Abourbih : https://github.com/jonbca
a.defineLocale("en-ca",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"YYYY-MM-DD",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},dayOfMonthOrdinalParse:/\d{1,2}(st|nd|rd|th)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),
//! moment.js locale configuration
//! locale : English (United Kingdom) [en-gb]
//! author : Chris Gedrim : https://github.com/chrisgedrim
a.defineLocale("en-gb",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},dayOfMonthOrdinalParse:/\d{1,2}(st|nd|rd|th)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : English (Ireland) [en-ie]
//! author : Chris Cartlidge : https://github.com/chriscartlidge
a.defineLocale("en-ie",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD-MM-YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},dayOfMonthOrdinalParse:/\d{1,2}(st|nd|rd|th)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : English (New Zealand) [en-nz]
//! author : Luke McGregor : https://github.com/lukemcgregor
a.defineLocale("en-nz",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY h:mm A",LLLL:"dddd, D MMMM YYYY h:mm A"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},dayOfMonthOrdinalParse:/\d{1,2}(st|nd|rd|th)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Esperanto [eo]
//! author : Colin Dean : https://github.com/colindean
//! author : Mia Nordentoft Imperatori : https://github.com/miestasmia
//! comment : miestasmia corrected the translation by colindean
a.defineLocale("eo",{months:"januaro_februaro_marto_aprilo_majo_junio_julio_aŭgusto_septembro_oktobro_novembro_decembro".split("_"),monthsShort:"jan_feb_mar_apr_maj_jun_jul_aŭg_sep_okt_nov_dec".split("_"),weekdays:"dimanĉo_lundo_mardo_merkredo_ĵaŭdo_vendredo_sabato".split("_"),weekdaysShort:"dim_lun_mard_merk_ĵaŭ_ven_sab".split("_"),weekdaysMin:"di_lu_ma_me_ĵa_ve_sa".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY-MM-DD",LL:"D[-a de] MMMM, YYYY",LLL:"D[-a de] MMMM, YYYY HH:mm",LLLL:"dddd, [la] D[-a de] MMMM, YYYY HH:mm"},meridiemParse:/[ap]\.t\.m/i,isPM:function(a){return"p"===a.charAt(0).toLowerCase()},meridiem:function(a,b,c){return a>11?c?"p.t.m.":"P.T.M.":c?"a.t.m.":"A.T.M."},calendar:{sameDay:"[Hodiaŭ je] LT",nextDay:"[Morgaŭ je] LT",nextWeek:"dddd [je] LT",lastDay:"[Hieraŭ je] LT",lastWeek:"[pasinta] dddd [je] LT",sameElse:"L"},relativeTime:{future:"post %s",past:"antaŭ %s",s:"sekundoj",m:"minuto",mm:"%d minutoj",h:"horo",hh:"%d horoj",d:"tago",dd:"%d tagoj",M:"monato",MM:"%d monatoj",y:"jaro",yy:"%d jaroj"},dayOfMonthOrdinalParse:/\d{1,2}a/,ordinal:"%da",week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Spanish (Dominican Republic) [es-do]
var Tg="ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"),Ug="ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_");a.defineLocale("es-do",{months:"enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),monthsShort:function(a,b){return a?/-MMM-/.test(b)?Ug[a.month()]:Tg[a.month()]:Tg},monthsParseExact:!0,weekdays:"domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),weekdaysShort:"dom._lun._mar._mié._jue._vie._sáb.".split("_"),weekdaysMin:"do_lu_ma_mi_ju_vi_sá".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"DD/MM/YYYY",LL:"D [de] MMMM [de] YYYY",LLL:"D [de] MMMM [de] YYYY h:mm A",LLLL:"dddd, D [de] MMMM [de] YYYY h:mm A"},calendar:{sameDay:function(){return"[hoy a la"+(1!==this.hours()?"s":"")+"] LT"},nextDay:function(){return"[mañana a la"+(1!==this.hours()?"s":"")+"] LT"},nextWeek:function(){return"dddd [a la"+(1!==this.hours()?"s":"")+"] LT"},lastDay:function(){return"[ayer a la"+(1!==this.hours()?"s":"")+"] LT"},lastWeek:function(){return"[el] dddd [pasado a la"+(1!==this.hours()?"s":"")+"] LT"},sameElse:"L"},relativeTime:{future:"en %s",past:"hace %s",s:"unos segundos",m:"un minuto",mm:"%d minutos",h:"una hora",hh:"%d horas",d:"un día",dd:"%d días",M:"un mes",MM:"%d meses",y:"un año",yy:"%d años"},dayOfMonthOrdinalParse:/\d{1,2}º/,ordinal:"%dº",week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Spanish [es]
//! author : Julio Napurí : https://github.com/julionc
var Vg="ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"),Wg="ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_");a.defineLocale("es",{months:"enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),monthsShort:function(a,b){return a?/-MMM-/.test(b)?Wg[a.month()]:Vg[a.month()]:Vg},monthsParseExact:!0,weekdays:"domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),weekdaysShort:"dom._lun._mar._mié._jue._vie._sáb.".split("_"),weekdaysMin:"do_lu_ma_mi_ju_vi_sá".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD/MM/YYYY",LL:"D [de] MMMM [de] YYYY",LLL:"D [de] MMMM [de] YYYY H:mm",LLLL:"dddd, D [de] MMMM [de] YYYY H:mm"},calendar:{sameDay:function(){return"[hoy a la"+(1!==this.hours()?"s":"")+"] LT"},nextDay:function(){return"[mañana a la"+(1!==this.hours()?"s":"")+"] LT"},nextWeek:function(){return"dddd [a la"+(1!==this.hours()?"s":"")+"] LT"},lastDay:function(){return"[ayer a la"+(1!==this.hours()?"s":"")+"] LT"},lastWeek:function(){return"[el] dddd [pasado a la"+(1!==this.hours()?"s":"")+"] LT"},sameElse:"L"},relativeTime:{future:"en %s",past:"hace %s",s:"unos segundos",m:"un minuto",mm:"%d minutos",h:"una hora",hh:"%d horas",d:"un día",dd:"%d días",M:"un mes",MM:"%d meses",y:"un año",yy:"%d años"},dayOfMonthOrdinalParse:/\d{1,2}º/,ordinal:"%dº",week:{dow:1,doy:4}}),a.defineLocale("et",{months:"jaanuar_veebruar_märts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember".split("_"),monthsShort:"jaan_veebr_märts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets".split("_"),weekdays:"pühapäev_esmaspäev_teisipäev_kolmapäev_neljapäev_reede_laupäev".split("_"),weekdaysShort:"P_E_T_K_N_R_L".split("_"),weekdaysMin:"P_E_T_K_N_R_L".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd, D. MMMM YYYY H:mm"},calendar:{sameDay:"[Täna,] LT",nextDay:"[Homme,] LT",nextWeek:"[Järgmine] dddd LT",lastDay:"[Eile,] LT",lastWeek:"[Eelmine] dddd LT",sameElse:"L"},relativeTime:{future:"%s pärast",past:"%s tagasi",s:Fd,m:Fd,mm:Fd,h:Fd,hh:Fd,d:Fd,dd:"%d päeva",M:Fd,MM:Fd,y:Fd,yy:Fd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Basque [eu]
//! author : Eneko Illarramendi : https://github.com/eillarra
a.defineLocale("eu",{months:"urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua".split("_"),monthsShort:"urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.".split("_"),monthsParseExact:!0,weekdays:"igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata".split("_"),weekdaysShort:"ig._al._ar._az._og._ol._lr.".split("_"),weekdaysMin:"ig_al_ar_az_og_ol_lr".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY-MM-DD",LL:"YYYY[ko] MMMM[ren] D[a]",LLL:"YYYY[ko] MMMM[ren] D[a] HH:mm",LLLL:"dddd, YYYY[ko] MMMM[ren] D[a] HH:mm",l:"YYYY-M-D",ll:"YYYY[ko] MMM D[a]",lll:"YYYY[ko] MMM D[a] HH:mm",llll:"ddd, YYYY[ko] MMM D[a] HH:mm"},calendar:{sameDay:"[gaur] LT[etan]",nextDay:"[bihar] LT[etan]",nextWeek:"dddd LT[etan]",lastDay:"[atzo] LT[etan]",lastWeek:"[aurreko] dddd LT[etan]",sameElse:"L"},relativeTime:{future:"%s barru",past:"duela %s",s:"segundo batzuk",m:"minutu bat",mm:"%d minutu",h:"ordu bat",hh:"%d ordu",d:"egun bat",dd:"%d egun",M:"hilabete bat",MM:"%d hilabete",y:"urte bat",yy:"%d urte"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Persian [fa]
//! author : Ebrahim Byagowi : https://github.com/ebraminio
var Xg={1:"۱",2:"۲",3:"۳",4:"۴",5:"۵",6:"۶",7:"۷",8:"۸",9:"۹",0:"۰"},Yg={"۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9","۰":"0"};a.defineLocale("fa",{months:"ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"),monthsShort:"ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"),weekdays:"یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"),weekdaysShort:"یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"),weekdaysMin:"ی_د_س_چ_پ_ج_ش".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},meridiemParse:/قبل از ظهر|بعد از ظهر/,isPM:function(a){return/بعد از ظهر/.test(a)},meridiem:function(a,b,c){return a<12?"قبل از ظهر":"بعد از ظهر"},calendar:{sameDay:"[امروز ساعت] LT",nextDay:"[فردا ساعت] LT",nextWeek:"dddd [ساعت] LT",lastDay:"[دیروز ساعت] LT",lastWeek:"dddd [پیش] [ساعت] LT",sameElse:"L"},relativeTime:{future:"در %s",past:"%s پیش",s:"چند ثانیه",m:"یک دقیقه",mm:"%d دقیقه",h:"یک ساعت",hh:"%d ساعت",d:"یک روز",dd:"%d روز",M:"یک ماه",MM:"%d ماه",y:"یک سال",yy:"%d سال"},preparse:function(a){return a.replace(/[۰-۹]/g,function(a){return Yg[a]}).replace(/،/g,",")},postformat:function(a){return a.replace(/\d/g,function(a){return Xg[a]}).replace(/,/g,"،")},dayOfMonthOrdinalParse:/\d{1,2}م/,ordinal:"%dم",week:{dow:6,doy:12}});
//! moment.js locale configuration
//! locale : Finnish [fi]
//! author : Tarmo Aidantausta : https://github.com/bleadof
var Zg="nolla yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän".split(" "),$g=["nolla","yhden","kahden","kolmen","neljän","viiden","kuuden",Zg[7],Zg[8],Zg[9]];a.defineLocale("fi",{months:"tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu".split("_"),monthsShort:"tammi_helmi_maalis_huhti_touko_kesä_heinä_elo_syys_loka_marras_joulu".split("_"),weekdays:"sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai".split("_"),weekdaysShort:"su_ma_ti_ke_to_pe_la".split("_"),weekdaysMin:"su_ma_ti_ke_to_pe_la".split("_"),longDateFormat:{LT:"HH.mm",LTS:"HH.mm.ss",L:"DD.MM.YYYY",LL:"Do MMMM[ta] YYYY",LLL:"Do MMMM[ta] YYYY, [klo] HH.mm",LLLL:"dddd, Do MMMM[ta] YYYY, [klo] HH.mm",l:"D.M.YYYY",ll:"Do MMM YYYY",lll:"Do MMM YYYY, [klo] HH.mm",llll:"ddd, Do MMM YYYY, [klo] HH.mm"},calendar:{sameDay:"[tänään] [klo] LT",nextDay:"[huomenna] [klo] LT",nextWeek:"dddd [klo] LT",lastDay:"[eilen] [klo] LT",lastWeek:"[viime] dddd[na] [klo] LT",sameElse:"L"},relativeTime:{future:"%s päästä",past:"%s sitten",s:Gd,m:Gd,mm:Gd,h:Gd,hh:Gd,d:Gd,dd:Gd,M:Gd,MM:Gd,y:Gd,yy:Gd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Faroese [fo]
//! author : Ragnar Johannesen : https://github.com/ragnar123
a.defineLocale("fo",{months:"januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember".split("_"),monthsShort:"jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),weekdays:"sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur".split("_"),weekdaysShort:"sun_mán_týs_mik_hós_frí_ley".split("_"),weekdaysMin:"su_má_tý_mi_hó_fr_le".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D. MMMM, YYYY HH:mm"},calendar:{sameDay:"[Í dag kl.] LT",nextDay:"[Í morgin kl.] LT",nextWeek:"dddd [kl.] LT",lastDay:"[Í gjár kl.] LT",lastWeek:"[síðstu] dddd [kl] LT",sameElse:"L"},relativeTime:{future:"um %s",past:"%s síðani",s:"fá sekund",m:"ein minutt",mm:"%d minuttir",h:"ein tími",hh:"%d tímar",d:"ein dagur",dd:"%d dagar",M:"ein mánaði",MM:"%d mánaðir",y:"eitt ár",yy:"%d ár"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : French (Canada) [fr-ca]
//! author : Jonathan Abourbih : https://github.com/jonbca
a.defineLocale("fr-ca",{months:"janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),monthsShort:"janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),monthsParseExact:!0,weekdays:"dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),weekdaysShort:"dim._lun._mar._mer._jeu._ven._sam.".split("_"),weekdaysMin:"Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY-MM-DD",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[Aujourd’hui à] LT",nextDay:"[Demain à] LT",nextWeek:"dddd [à] LT",lastDay:"[Hier à] LT",lastWeek:"dddd [dernier à] LT",sameElse:"L"},relativeTime:{future:"dans %s",past:"il y a %s",s:"quelques secondes",m:"une minute",mm:"%d minutes",h:"une heure",hh:"%d heures",d:"un jour",dd:"%d jours",M:"un mois",MM:"%d mois",y:"un an",yy:"%d ans"},dayOfMonthOrdinalParse:/\d{1,2}(er|e)/,ordinal:function(a,b){switch(b){default:case"M":case"Q":case"D":case"DDD":case"d":return a+(1===a?"er":"e");case"w":case"W":return a+(1===a?"re":"e")}}}),
//! moment.js locale configuration
//! locale : French (Switzerland) [fr-ch]
//! author : Gaspard Bucher : https://github.com/gaspard
a.defineLocale("fr-ch",{months:"janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),monthsShort:"janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),monthsParseExact:!0,weekdays:"dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),weekdaysShort:"dim._lun._mar._mer._jeu._ven._sam.".split("_"),weekdaysMin:"Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[Aujourd’hui à] LT",nextDay:"[Demain à] LT",nextWeek:"dddd [à] LT",lastDay:"[Hier à] LT",lastWeek:"dddd [dernier à] LT",sameElse:"L"},relativeTime:{future:"dans %s",past:"il y a %s",s:"quelques secondes",m:"une minute",mm:"%d minutes",h:"une heure",hh:"%d heures",d:"un jour",dd:"%d jours",M:"un mois",MM:"%d mois",y:"un an",yy:"%d ans"},dayOfMonthOrdinalParse:/\d{1,2}(er|e)/,ordinal:function(a,b){switch(b){default:case"M":case"Q":case"D":case"DDD":case"d":return a+(1===a?"er":"e");case"w":case"W":return a+(1===a?"re":"e")}},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : French [fr]
//! author : John Fischer : https://github.com/jfroffice
a.defineLocale("fr",{months:"janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),monthsShort:"janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),monthsParseExact:!0,weekdays:"dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),weekdaysShort:"dim._lun._mar._mer._jeu._ven._sam.".split("_"),weekdaysMin:"Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[Aujourd’hui à] LT",nextDay:"[Demain à] LT",nextWeek:"dddd [à] LT",lastDay:"[Hier à] LT",lastWeek:"dddd [dernier à] LT",sameElse:"L"},relativeTime:{future:"dans %s",past:"il y a %s",s:"quelques secondes",m:"une minute",mm:"%d minutes",h:"une heure",hh:"%d heures",d:"un jour",dd:"%d jours",M:"un mois",MM:"%d mois",y:"un an",yy:"%d ans"},dayOfMonthOrdinalParse:/\d{1,2}(er|)/,ordinal:function(a,b){switch(b){case"D":return a+(1===a?"er":"");default:case"M":case"Q":case"DDD":case"d":return a+(1===a?"er":"e");case"w":case"W":return a+(1===a?"re":"e")}},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Frisian [fy]
//! author : Robin van der Vliet : https://github.com/robin0van0der0v
var _g="jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.".split("_"),ah="jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_");a.defineLocale("fy",{months:"jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber".split("_"),monthsShort:function(a,b){return a?/-MMM-/.test(b)?ah[a.month()]:_g[a.month()]:_g},monthsParseExact:!0,weekdays:"snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon".split("_"),weekdaysShort:"si._mo._ti._wo._to._fr._so.".split("_"),weekdaysMin:"Si_Mo_Ti_Wo_To_Fr_So".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD-MM-YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[hjoed om] LT",nextDay:"[moarn om] LT",nextWeek:"dddd [om] LT",lastDay:"[juster om] LT",lastWeek:"[ôfrûne] dddd [om] LT",sameElse:"L"},relativeTime:{future:"oer %s",past:"%s lyn",s:"in pear sekonden",m:"ien minút",mm:"%d minuten",h:"ien oere",hh:"%d oeren",d:"ien dei",dd:"%d dagen",M:"ien moanne",MM:"%d moannen",y:"ien jier",yy:"%d jierren"},dayOfMonthOrdinalParse:/\d{1,2}(ste|de)/,ordinal:function(a){return a+(1===a||8===a||a>=20?"ste":"de")},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Scottish Gaelic [gd]
//! author : Jon Ashdown : https://github.com/jonashdown
var bh=["Am Faoilleach","An Gearran","Am Màrt","An Giblean","An Cèitean","An t-Ògmhios","An t-Iuchar","An Lùnastal","An t-Sultain","An Dàmhair","An t-Samhain","An Dùbhlachd"],ch=["Faoi","Gear","Màrt","Gibl","Cèit","Ògmh","Iuch","Lùn","Sult","Dàmh","Samh","Dùbh"],dh=["Didòmhnaich","Diluain","Dimàirt","Diciadain","Diardaoin","Dihaoine","Disathairne"],eh=["Did","Dil","Dim","Dic","Dia","Dih","Dis"],fh=["Dò","Lu","Mà","Ci","Ar","Ha","Sa"];a.defineLocale("gd",{months:bh,monthsShort:ch,monthsParseExact:!0,weekdays:dh,weekdaysShort:eh,weekdaysMin:fh,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[An-diugh aig] LT",nextDay:"[A-màireach aig] LT",nextWeek:"dddd [aig] LT",lastDay:"[An-dè aig] LT",lastWeek:"dddd [seo chaidh] [aig] LT",sameElse:"L"},relativeTime:{future:"ann an %s",past:"bho chionn %s",s:"beagan diogan",m:"mionaid",mm:"%d mionaidean",h:"uair",hh:"%d uairean",d:"latha",dd:"%d latha",M:"mìos",MM:"%d mìosan",y:"bliadhna",yy:"%d bliadhna"},dayOfMonthOrdinalParse:/\d{1,2}(d|na|mh)/,ordinal:function(a){var b=1===a?"d":a%10===2?"na":"mh";return a+b},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Galician [gl]
//! author : Juan G. Hurtado : https://github.com/juanghurtado
a.defineLocale("gl",{months:"xaneiro_febreiro_marzo_abril_maio_xuño_xullo_agosto_setembro_outubro_novembro_decembro".split("_"),monthsShort:"xan._feb._mar._abr._mai._xuñ._xul._ago._set._out._nov._dec.".split("_"),monthsParseExact:!0,weekdays:"domingo_luns_martes_mércores_xoves_venres_sábado".split("_"),weekdaysShort:"dom._lun._mar._mér._xov._ven._sáb.".split("_"),weekdaysMin:"do_lu_ma_mé_xo_ve_sá".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD/MM/YYYY",LL:"D [de] MMMM [de] YYYY",LLL:"D [de] MMMM [de] YYYY H:mm",LLLL:"dddd, D [de] MMMM [de] YYYY H:mm"},calendar:{sameDay:function(){return"[hoxe "+(1!==this.hours()?"ás":"á")+"] LT"},nextDay:function(){return"[mañá "+(1!==this.hours()?"ás":"á")+"] LT"},nextWeek:function(){return"dddd ["+(1!==this.hours()?"ás":"a")+"] LT"},lastDay:function(){return"[onte "+(1!==this.hours()?"á":"a")+"] LT"},lastWeek:function(){return"[o] dddd [pasado "+(1!==this.hours()?"ás":"a")+"] LT"},sameElse:"L"},relativeTime:{future:function(a){return 0===a.indexOf("un")?"n"+a:"en "+a},past:"hai %s",s:"uns segundos",m:"un minuto",mm:"%d minutos",h:"unha hora",hh:"%d horas",d:"un día",dd:"%d días",M:"un mes",MM:"%d meses",y:"un ano",yy:"%d anos"},dayOfMonthOrdinalParse:/\d{1,2}º/,ordinal:"%dº",week:{dow:1,doy:4}}),a.defineLocale("gom-latn",{months:"Janer_Febrer_Mars_Abril_Mai_Jun_Julai_Agost_Setembr_Otubr_Novembr_Dezembr".split("_"),monthsShort:"Jan._Feb._Mars_Abr._Mai_Jun_Jul._Ago._Set._Otu._Nov._Dez.".split("_"),monthsParseExact:!0,weekdays:"Aitar_Somar_Mongllar_Budvar_Brestar_Sukrar_Son'var".split("_"),weekdaysShort:"Ait._Som._Mon._Bud._Bre._Suk._Son.".split("_"),weekdaysMin:"Ai_Sm_Mo_Bu_Br_Su_Sn".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"A h:mm [vazta]",LTS:"A h:mm:ss [vazta]",L:"DD-MM-YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY A h:mm [vazta]",LLLL:"dddd, MMMM[achea] Do, YYYY, A h:mm [vazta]",llll:"ddd, D MMM YYYY, A h:mm [vazta]"},calendar:{sameDay:"[Aiz] LT",nextDay:"[Faleam] LT",nextWeek:"[Ieta to] dddd[,] LT",lastDay:"[Kal] LT",lastWeek:"[Fatlo] dddd[,] LT",sameElse:"L"},relativeTime:{future:"%s",past:"%s adim",s:Id,m:Id,mm:Id,h:Id,hh:Id,d:Id,dd:Id,M:Id,MM:Id,y:Id,yy:Id},dayOfMonthOrdinalParse:/\d{1,2}(er)/,ordinal:function(a,b){switch(b){case"D":return a+"er";default:case"M":case"Q":case"DDD":case"d":case"w":case"W":return a}},week:{dow:1,doy:4},meridiemParse:/rati|sokalli|donparam|sanje/,meridiemHour:function(a,b){return 12===a&&(a=0),"rati"===b?a<4?a:a+12:"sokalli"===b?a:"donparam"===b?a>12?a:a+12:"sanje"===b?a+12:void 0},meridiem:function(a,b,c){return a<4?"rati":a<12?"sokalli":a<16?"donparam":a<20?"sanje":"rati"}}),
//! moment.js locale configuration
//! locale : Hebrew [he]
//! author : Tomer Cohen : https://github.com/tomer
//! author : Moshe Simantov : https://github.com/DevelopmentIL
//! author : Tal Ater : https://github.com/TalAter
a.defineLocale("he",{months:"ינואר_פברואר_מרץ_אפריל_מאי_יוני_יולי_אוגוסט_ספטמבר_אוקטובר_נובמבר_דצמבר".split("_"),monthsShort:"ינו׳_פבר׳_מרץ_אפר׳_מאי_יוני_יולי_אוג׳_ספט׳_אוק׳_נוב׳_דצמ׳".split("_"),weekdays:"ראשון_שני_שלישי_רביעי_חמישי_שישי_שבת".split("_"),weekdaysShort:"א׳_ב׳_ג׳_ד׳_ה׳_ו׳_ש׳".split("_"),weekdaysMin:"א_ב_ג_ד_ה_ו_ש".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D [ב]MMMM YYYY",LLL:"D [ב]MMMM YYYY HH:mm",LLLL:"dddd, D [ב]MMMM YYYY HH:mm",l:"D/M/YYYY",ll:"D MMM YYYY",lll:"D MMM YYYY HH:mm",llll:"ddd, D MMM YYYY HH:mm"},calendar:{sameDay:"[היום ב־]LT",nextDay:"[מחר ב־]LT",nextWeek:"dddd [בשעה] LT",lastDay:"[אתמול ב־]LT",lastWeek:"[ביום] dddd [האחרון בשעה] LT",sameElse:"L"},relativeTime:{future:"בעוד %s",past:"לפני %s",s:"מספר שניות",m:"דקה",mm:"%d דקות",h:"שעה",hh:function(a){return 2===a?"שעתיים":a+" שעות"},d:"יום",dd:function(a){return 2===a?"יומיים":a+" ימים"},M:"חודש",MM:function(a){return 2===a?"חודשיים":a+" חודשים"},y:"שנה",yy:function(a){return 2===a?"שנתיים":a%10===0&&10!==a?a+" שנה":a+" שנים"}},meridiemParse:/אחה"צ|לפנה"צ|אחרי הצהריים|לפני הצהריים|לפנות בוקר|בבוקר|בערב/i,isPM:function(a){return/^(אחה"צ|אחרי הצהריים|בערב)$/.test(a)},meridiem:function(a,b,c){return a<5?"לפנות בוקר":a<10?"בבוקר":a<12?c?'לפנה"צ':"לפני הצהריים":a<18?c?'אחה"צ':"אחרי הצהריים":"בערב"}});
//! moment.js locale configuration
//! locale : Hindi [hi]
//! author : Mayank Singhal : https://github.com/mayanksinghal
var gh={1:"१",2:"२",3:"३",4:"४",5:"५",6:"६",7:"७",8:"८",9:"९",0:"०"},hh={"१":"1","२":"2","३":"3","४":"4","५":"5","६":"6","७":"7","८":"8","९":"9","०":"0"};a.defineLocale("hi",{months:"जनवरी_फ़रवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितम्बर_अक्टूबर_नवम्बर_दिसम्बर".split("_"),monthsShort:"जन._फ़र._मार्च_अप्रै._मई_जून_जुल._अग._सित._अक्टू._नव._दिस.".split("_"),monthsParseExact:!0,weekdays:"रविवार_सोमवार_मंगलवार_बुधवार_गुरूवार_शुक्रवार_शनिवार".split("_"),weekdaysShort:"रवि_सोम_मंगल_बुध_गुरू_शुक्र_शनि".split("_"),weekdaysMin:"र_सो_मं_बु_गु_शु_श".split("_"),longDateFormat:{LT:"A h:mm बजे",LTS:"A h:mm:ss बजे",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm बजे",LLLL:"dddd, D MMMM YYYY, A h:mm बजे"},calendar:{sameDay:"[आज] LT",nextDay:"[कल] LT",nextWeek:"dddd, LT",lastDay:"[कल] LT",lastWeek:"[पिछले] dddd, LT",sameElse:"L"},relativeTime:{future:"%s में",past:"%s पहले",s:"कुछ ही क्षण",m:"एक मिनट",mm:"%d मिनट",h:"एक घंटा",hh:"%d घंटे",d:"एक दिन",dd:"%d दिन",M:"एक महीने",MM:"%d महीने",y:"एक वर्ष",yy:"%d वर्ष"},preparse:function(a){return a.replace(/[१२३४५६७८९०]/g,function(a){return hh[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return gh[a]})},meridiemParse:/रात|सुबह|दोपहर|शाम/,meridiemHour:function(a,b){return 12===a&&(a=0),"रात"===b?a<4?a:a+12:"सुबह"===b?a:"दोपहर"===b?a>=10?a:a+12:"शाम"===b?a+12:void 0},meridiem:function(a,b,c){return a<4?"रात":a<10?"सुबह":a<17?"दोपहर":a<20?"शाम":"रात"},week:{dow:0,doy:6}}),a.defineLocale("hr",{months:{format:"siječnja_veljače_ožujka_travnja_svibnja_lipnja_srpnja_kolovoza_rujna_listopada_studenoga_prosinca".split("_"),standalone:"siječanj_veljača_ožujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac".split("_")},monthsShort:"sij._velj._ožu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.".split("_"),monthsParseExact:!0,weekdays:"nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),weekdaysShort:"ned._pon._uto._sri._čet._pet._sub.".split("_"),weekdaysMin:"ne_po_ut_sr_če_pe_su".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd, D. MMMM YYYY H:mm"},calendar:{sameDay:"[danas u] LT",nextDay:"[sutra u] LT",nextWeek:function(){switch(this.day()){case 0:return"[u] [nedjelju] [u] LT";case 3:return"[u] [srijedu] [u] LT";case 6:return"[u] [subotu] [u] LT";case 1:case 2:case 4:case 5:return"[u] dddd [u] LT"}},lastDay:"[jučer u] LT",lastWeek:function(){switch(this.day()){case 0:case 3:return"[prošlu] dddd [u] LT";case 6:return"[prošle] [subote] [u] LT";case 1:case 2:case 4:case 5:return"[prošli] dddd [u] LT"}},sameElse:"L"},relativeTime:{future:"za %s",past:"prije %s",s:"par sekundi",m:Jd,mm:Jd,h:Jd,hh:Jd,d:"dan",dd:Jd,M:"mjesec",MM:Jd,y:"godinu",yy:Jd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Hungarian [hu]
//! author : Adam Brunner : https://github.com/adambrunner
var ih="vasárnap hétfőn kedden szerdán csütörtökön pénteken szombaton".split(" ");a.defineLocale("hu",{months:"január_február_március_április_május_június_július_augusztus_szeptember_október_november_december".split("_"),monthsShort:"jan_feb_márc_ápr_máj_jún_júl_aug_szept_okt_nov_dec".split("_"),weekdays:"vasárnap_hétfő_kedd_szerda_csütörtök_péntek_szombat".split("_"),weekdaysShort:"vas_hét_kedd_sze_csüt_pén_szo".split("_"),weekdaysMin:"v_h_k_sze_cs_p_szo".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"YYYY.MM.DD.",LL:"YYYY. MMMM D.",LLL:"YYYY. MMMM D. H:mm",LLLL:"YYYY. MMMM D., dddd H:mm"},meridiemParse:/de|du/i,isPM:function(a){return"u"===a.charAt(1).toLowerCase()},meridiem:function(a,b,c){return a<12?c===!0?"de":"DE":c===!0?"du":"DU"},calendar:{sameDay:"[ma] LT[-kor]",nextDay:"[holnap] LT[-kor]",nextWeek:function(){return Ld.call(this,!0)},lastDay:"[tegnap] LT[-kor]",lastWeek:function(){return Ld.call(this,!1)},sameElse:"L"},relativeTime:{future:"%s múlva",past:"%s",s:Kd,m:Kd,mm:Kd,h:Kd,hh:Kd,d:Kd,dd:Kd,M:Kd,MM:Kd,y:Kd,yy:Kd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Armenian [hy-am]
//! author : Armendarabyan : https://github.com/armendarabyan
a.defineLocale("hy-am",{months:{format:"հունվարի_փետրվարի_մարտի_ապրիլի_մայիսի_հունիսի_հուլիսի_օգոստոսի_սեպտեմբերի_հոկտեմբերի_նոյեմբերի_դեկտեմբերի".split("_"),standalone:"հունվար_փետրվար_մարտ_ապրիլ_մայիս_հունիս_հուլիս_օգոստոս_սեպտեմբեր_հոկտեմբեր_նոյեմբեր_դեկտեմբեր".split("_")},monthsShort:"հնվ_փտր_մրտ_ապր_մյս_հնս_հլս_օգս_սպտ_հկտ_նմբ_դկտ".split("_"),weekdays:"կիրակի_երկուշաբթի_երեքշաբթի_չորեքշաբթի_հինգշաբթի_ուրբաթ_շաբաթ".split("_"),weekdaysShort:"կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ".split("_"),weekdaysMin:"կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY թ.",LLL:"D MMMM YYYY թ., HH:mm",LLLL:"dddd, D MMMM YYYY թ., HH:mm"},calendar:{sameDay:"[այսօր] LT",nextDay:"[վաղը] LT",lastDay:"[երեկ] LT",nextWeek:function(){return"dddd [օրը ժամը] LT"},lastWeek:function(){return"[անցած] dddd [օրը ժամը] LT"},sameElse:"L"},relativeTime:{future:"%s հետո",past:"%s առաջ",s:"մի քանի վայրկյան",m:"րոպե",mm:"%d րոպե",h:"ժամ",hh:"%d ժամ",d:"օր",dd:"%d օր",M:"ամիս",MM:"%d ամիս",y:"տարի",yy:"%d տարի"},meridiemParse:/գիշերվա|առավոտվա|ցերեկվա|երեկոյան/,isPM:function(a){return/^(ցերեկվա|երեկոյան)$/.test(a)},meridiem:function(a){return a<4?"գիշերվա":a<12?"առավոտվա":a<17?"ցերեկվա":"երեկոյան"},dayOfMonthOrdinalParse:/\d{1,2}|\d{1,2}-(ին|րդ)/,ordinal:function(a,b){switch(b){case"DDD":case"w":case"W":case"DDDo":return 1===a?a+"-ին":a+"-րդ";default:return a}},week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Indonesian [id]
//! author : Mohammad Satrio Utomo : https://github.com/tyok
//! reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan
a.defineLocale("id",{months:"Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember".split("_"),monthsShort:"Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des".split("_"),weekdays:"Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu".split("_"),weekdaysShort:"Min_Sen_Sel_Rab_Kam_Jum_Sab".split("_"),weekdaysMin:"Mg_Sn_Sl_Rb_Km_Jm_Sb".split("_"),longDateFormat:{LT:"HH.mm",LTS:"HH.mm.ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY [pukul] HH.mm",LLLL:"dddd, D MMMM YYYY [pukul] HH.mm"},meridiemParse:/pagi|siang|sore|malam/,meridiemHour:function(a,b){return 12===a&&(a=0),"pagi"===b?a:"siang"===b?a>=11?a:a+12:"sore"===b||"malam"===b?a+12:void 0},meridiem:function(a,b,c){return a<11?"pagi":a<15?"siang":a<19?"sore":"malam"},calendar:{sameDay:"[Hari ini pukul] LT",nextDay:"[Besok pukul] LT",nextWeek:"dddd [pukul] LT",lastDay:"[Kemarin pukul] LT",lastWeek:"dddd [lalu pukul] LT",sameElse:"L"},relativeTime:{future:"dalam %s",past:"%s yang lalu",s:"beberapa detik",m:"semenit",mm:"%d menit",h:"sejam",hh:"%d jam",d:"sehari",dd:"%d hari",M:"sebulan",MM:"%d bulan",y:"setahun",yy:"%d tahun"},week:{dow:1,doy:7}}),a.defineLocale("is",{months:"janúar_febrúar_mars_apríl_maí_júní_júlí_ágúst_september_október_nóvember_desember".split("_"),monthsShort:"jan_feb_mar_apr_maí_jún_júl_ágú_sep_okt_nóv_des".split("_"),weekdays:"sunnudagur_mánudagur_þriðjudagur_miðvikudagur_fimmtudagur_föstudagur_laugardagur".split("_"),weekdaysShort:"sun_mán_þri_mið_fim_fös_lau".split("_"),weekdaysMin:"Su_Má_Þr_Mi_Fi_Fö_La".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY [kl.] H:mm",LLLL:"dddd, D. MMMM YYYY [kl.] H:mm"},calendar:{sameDay:"[í dag kl.] LT",nextDay:"[á morgun kl.] LT",nextWeek:"dddd [kl.] LT",lastDay:"[í gær kl.] LT",lastWeek:"[síðasta] dddd [kl.] LT",sameElse:"L"},relativeTime:{future:"eftir %s",past:"fyrir %s síðan",s:Nd,m:Nd,mm:Nd,h:"klukkustund",hh:Nd,d:Nd,dd:Nd,M:Nd,MM:Nd,y:Nd,yy:Nd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Italian [it]
//! author : Lorenzo : https://github.com/aliem
//! author: Mattia Larentis: https://github.com/nostalgiaz
a.defineLocale("it",{months:"gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre".split("_"),monthsShort:"gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic".split("_"),weekdays:"domenica_lunedì_martedì_mercoledì_giovedì_venerdì_sabato".split("_"),weekdaysShort:"dom_lun_mar_mer_gio_ven_sab".split("_"),weekdaysMin:"do_lu_ma_me_gi_ve_sa".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Oggi alle] LT",nextDay:"[Domani alle] LT",nextWeek:"dddd [alle] LT",lastDay:"[Ieri alle] LT",lastWeek:function(){switch(this.day()){case 0:return"[la scorsa] dddd [alle] LT";default:return"[lo scorso] dddd [alle] LT"}},sameElse:"L"},relativeTime:{future:function(a){return(/^[0-9].+$/.test(a)?"tra":"in")+" "+a},past:"%s fa",s:"alcuni secondi",m:"un minuto",mm:"%d minuti",h:"un'ora",hh:"%d ore",d:"un giorno",dd:"%d giorni",M:"un mese",MM:"%d mesi",y:"un anno",yy:"%d anni"},dayOfMonthOrdinalParse:/\d{1,2}º/,ordinal:"%dº",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Japanese [ja]
//! author : LI Long : https://github.com/baryon
a.defineLocale("ja",{months:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),monthsShort:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),weekdays:"日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日".split("_"),weekdaysShort:"日_月_火_水_木_金_土".split("_"),weekdaysMin:"日_月_火_水_木_金_土".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY/MM/DD",LL:"YYYY年M月D日",LLL:"YYYY年M月D日 HH:mm",LLLL:"YYYY年M月D日 HH:mm dddd",l:"YYYY/MM/DD",ll:"YYYY年M月D日",lll:"YYYY年M月D日 HH:mm",llll:"YYYY年M月D日 HH:mm dddd"},meridiemParse:/午前|午後/i,isPM:function(a){return"午後"===a},meridiem:function(a,b,c){return a<12?"午前":"午後"},calendar:{sameDay:"[今日] LT",nextDay:"[明日] LT",nextWeek:"[来週]dddd LT",lastDay:"[昨日] LT",lastWeek:"[前週]dddd LT",sameElse:"L"},dayOfMonthOrdinalParse:/\d{1,2}日/,ordinal:function(a,b){switch(b){case"d":case"D":case"DDD":return a+"日";default:return a}},relativeTime:{future:"%s後",past:"%s前",s:"数秒",m:"1分",mm:"%d分",h:"1時間",hh:"%d時間",d:"1日",dd:"%d日",M:"1ヶ月",MM:"%dヶ月",y:"1年",yy:"%d年"}}),
//! moment.js locale configuration
//! locale : Javanese [jv]
//! author : Rony Lantip : https://github.com/lantip
//! reference: http://jv.wikipedia.org/wiki/Basa_Jawa
a.defineLocale("jv",{months:"Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_Nopember_Desember".split("_"),monthsShort:"Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nop_Des".split("_"),weekdays:"Minggu_Senen_Seloso_Rebu_Kemis_Jemuwah_Septu".split("_"),weekdaysShort:"Min_Sen_Sel_Reb_Kem_Jem_Sep".split("_"),weekdaysMin:"Mg_Sn_Sl_Rb_Km_Jm_Sp".split("_"),longDateFormat:{LT:"HH.mm",LTS:"HH.mm.ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY [pukul] HH.mm",LLLL:"dddd, D MMMM YYYY [pukul] HH.mm"},meridiemParse:/enjing|siyang|sonten|ndalu/,meridiemHour:function(a,b){return 12===a&&(a=0),"enjing"===b?a:"siyang"===b?a>=11?a:a+12:"sonten"===b||"ndalu"===b?a+12:void 0},meridiem:function(a,b,c){return a<11?"enjing":a<15?"siyang":a<19?"sonten":"ndalu"},calendar:{sameDay:"[Dinten puniko pukul] LT",nextDay:"[Mbenjang pukul] LT",nextWeek:"dddd [pukul] LT",lastDay:"[Kala wingi pukul] LT",lastWeek:"dddd [kepengker pukul] LT",sameElse:"L"},relativeTime:{future:"wonten ing %s",past:"%s ingkang kepengker",s:"sawetawis detik",m:"setunggal menit",mm:"%d menit",h:"setunggal jam",hh:"%d jam",d:"sedinten",dd:"%d dinten",M:"sewulan",MM:"%d wulan",y:"setaun",yy:"%d taun"},week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Georgian [ka]
//! author : Irakli Janiashvili : https://github.com/irakli-janiashvili
a.defineLocale("ka",{months:{standalone:"იანვარი_თებერვალი_მარტი_აპრილი_მაისი_ივნისი_ივლისი_აგვისტო_სექტემბერი_ოქტომბერი_ნოემბერი_დეკემბერი".split("_"),format:"იანვარს_თებერვალს_მარტს_აპრილის_მაისს_ივნისს_ივლისს_აგვისტს_სექტემბერს_ოქტომბერს_ნოემბერს_დეკემბერს".split("_")},monthsShort:"იან_თებ_მარ_აპრ_მაი_ივნ_ივლ_აგვ_სექ_ოქტ_ნოე_დეკ".split("_"),weekdays:{standalone:"კვირა_ორშაბათი_სამშაბათი_ოთხშაბათი_ხუთშაბათი_პარასკევი_შაბათი".split("_"),format:"კვირას_ორშაბათს_სამშაბათს_ოთხშაბათს_ხუთშაბათს_პარასკევს_შაბათს".split("_"),isFormat:/(წინა|შემდეგ)/},weekdaysShort:"კვი_ორშ_სამ_ოთხ_ხუთ_პარ_შაბ".split("_"),weekdaysMin:"კვ_ორ_სა_ოთ_ხუ_პა_შა".split("_"),longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY h:mm A",LLLL:"dddd, D MMMM YYYY h:mm A"},calendar:{sameDay:"[დღეს] LT[-ზე]",nextDay:"[ხვალ] LT[-ზე]",lastDay:"[გუშინ] LT[-ზე]",nextWeek:"[შემდეგ] dddd LT[-ზე]",lastWeek:"[წინა] dddd LT-ზე",sameElse:"L"},relativeTime:{future:function(a){return/(წამი|წუთი|საათი|წელი)/.test(a)?a.replace(/ი$/,"ში"):a+"ში"},past:function(a){return/(წამი|წუთი|საათი|დღე|თვე)/.test(a)?a.replace(/(ი|ე)$/,"ის უკან"):/წელი/.test(a)?a.replace(/წელი$/,"წლის უკან"):void 0},s:"რამდენიმე წამი",m:"წუთი",mm:"%d წუთი",h:"საათი",hh:"%d საათი",d:"დღე",dd:"%d დღე",M:"თვე",MM:"%d თვე",y:"წელი",yy:"%d წელი"},dayOfMonthOrdinalParse:/0|1-ლი|მე-\d{1,2}|\d{1,2}-ე/,ordinal:function(a){return 0===a?a:1===a?a+"-ლი":a<20||a<=100&&a%20===0||a%100===0?"მე-"+a:a+"-ე"},week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Kazakh [kk]
//! authors : Nurlan Rakhimzhanov : https://github.com/nurlan
var jh={0:"-ші",1:"-ші",2:"-ші",3:"-ші",4:"-ші",5:"-ші",6:"-шы",7:"-ші",8:"-ші",9:"-шы",10:"-шы",20:"-шы",30:"-шы",40:"-шы",50:"-ші",60:"-шы",70:"-ші",80:"-ші",90:"-шы",100:"-ші"};a.defineLocale("kk",{months:"қаңтар_ақпан_наурыз_сәуір_мамыр_маусым_шілде_тамыз_қыркүйек_қазан_қараша_желтоқсан".split("_"),monthsShort:"қаң_ақп_нау_сәу_мам_мау_шіл_там_қыр_қаз_қар_жел".split("_"),weekdays:"жексенбі_дүйсенбі_сейсенбі_сәрсенбі_бейсенбі_жұма_сенбі".split("_"),weekdaysShort:"жек_дүй_сей_сәр_бей_жұм_сен".split("_"),weekdaysMin:"жк_дй_сй_ср_бй_жм_сн".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Бүгін сағат] LT",nextDay:"[Ертең сағат] LT",nextWeek:"dddd [сағат] LT",lastDay:"[Кеше сағат] LT",lastWeek:"[Өткен аптаның] dddd [сағат] LT",sameElse:"L"},relativeTime:{future:"%s ішінде",past:"%s бұрын",s:"бірнеше секунд",m:"бір минут",mm:"%d минут",h:"бір сағат",hh:"%d сағат",d:"бір күн",dd:"%d күн",M:"бір ай",MM:"%d ай",y:"бір жыл",yy:"%d жыл"},dayOfMonthOrdinalParse:/\d{1,2}-(ші|шы)/,ordinal:function(a){var b=a%10,c=a>=100?100:null;return a+(jh[a]||jh[b]||jh[c])},week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Cambodian [km]
//! author : Kruy Vanna : https://github.com/kruyvanna
a.defineLocale("km",{months:"មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ".split("_"),monthsShort:"មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ".split("_"),weekdays:"អាទិត្យ_ច័ន្ទ_អង្គារ_ពុធ_ព្រហស្បតិ៍_សុក្រ_សៅរ៍".split("_"),weekdaysShort:"អាទិត្យ_ច័ន្ទ_អង្គារ_ពុធ_ព្រហស្បតិ៍_សុក្រ_សៅរ៍".split("_"),weekdaysMin:"អាទិត្យ_ច័ន្ទ_អង្គារ_ពុធ_ព្រហស្បតិ៍_សុក្រ_សៅរ៍".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[ថ្ងៃនេះ ម៉ោង] LT",nextDay:"[ស្អែក ម៉ោង] LT",nextWeek:"dddd [ម៉ោង] LT",lastDay:"[ម្សិលមិញ ម៉ោង] LT",lastWeek:"dddd [សប្តាហ៍មុន] [ម៉ោង] LT",sameElse:"L"},relativeTime:{future:"%sទៀត",past:"%sមុន",s:"ប៉ុន្មានវិនាទី",m:"មួយនាទី",mm:"%d នាទី",h:"មួយម៉ោង",hh:"%d ម៉ោង",d:"មួយថ្ងៃ",dd:"%d ថ្ងៃ",M:"មួយខែ",MM:"%d ខែ",y:"មួយឆ្នាំ",yy:"%d ឆ្នាំ"},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Kannada [kn]
//! author : Rajeev Naik : https://github.com/rajeevnaikte
var kh={1:"೧",2:"೨",3:"೩",4:"೪",5:"೫",6:"೬",7:"೭",8:"೮",9:"೯",0:"೦"},lh={"೧":"1","೨":"2","೩":"3","೪":"4","೫":"5","೬":"6","೭":"7","೮":"8","೯":"9","೦":"0"};a.defineLocale("kn",{months:"ಜನವರಿ_ಫೆಬ್ರವರಿ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂಬರ್_ಅಕ್ಟೋಬರ್_ನವೆಂಬರ್_ಡಿಸೆಂಬರ್".split("_"),monthsShort:"ಜನ_ಫೆಬ್ರ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂಬ_ಅಕ್ಟೋಬ_ನವೆಂಬ_ಡಿಸೆಂಬ".split("_"),monthsParseExact:!0,weekdays:"ಭಾನುವಾರ_ಸೋಮವಾರ_ಮಂಗಳವಾರ_ಬುಧವಾರ_ಗುರುವಾರ_ಶುಕ್ರವಾರ_ಶನಿವಾರ".split("_"),weekdaysShort:"ಭಾನು_ಸೋಮ_ಮಂಗಳ_ಬುಧ_ಗುರು_ಶುಕ್ರ_ಶನಿ".split("_"),weekdaysMin:"ಭಾ_ಸೋ_ಮಂ_ಬು_ಗು_ಶು_ಶ".split("_"),longDateFormat:{LT:"A h:mm",LTS:"A h:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm",LLLL:"dddd, D MMMM YYYY, A h:mm"},calendar:{sameDay:"[ಇಂದು] LT",nextDay:"[ನಾಳೆ] LT",nextWeek:"dddd, LT",lastDay:"[ನಿನ್ನೆ] LT",lastWeek:"[ಕೊನೆಯ] dddd, LT",sameElse:"L"},relativeTime:{future:"%s ನಂತರ",past:"%s ಹಿಂದೆ",s:"ಕೆಲವು ಕ್ಷಣಗಳು",m:"ಒಂದು ನಿಮಿಷ",mm:"%d ನಿಮಿಷ",h:"ಒಂದು ಗಂಟೆ",hh:"%d ಗಂಟೆ",d:"ಒಂದು ದಿನ",dd:"%d ದಿನ",M:"ಒಂದು ತಿಂಗಳು",MM:"%d ತಿಂಗಳು",y:"ಒಂದು ವರ್ಷ",yy:"%d ವರ್ಷ"},preparse:function(a){return a.replace(/[೧೨೩೪೫೬೭೮೯೦]/g,function(a){return lh[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return kh[a]})},meridiemParse:/ರಾತ್ರಿ|ಬೆಳಿಗ್ಗೆ|ಮಧ್ಯಾಹ್ನ|ಸಂಜೆ/,meridiemHour:function(a,b){return 12===a&&(a=0),"ರಾತ್ರಿ"===b?a<4?a:a+12:"ಬೆಳಿಗ್ಗೆ"===b?a:"ಮಧ್ಯಾಹ್ನ"===b?a>=10?a:a+12:"ಸಂಜೆ"===b?a+12:void 0},meridiem:function(a,b,c){return a<4?"ರಾತ್ರಿ":a<10?"ಬೆಳಿಗ್ಗೆ":a<17?"ಮಧ್ಯಾಹ್ನ":a<20?"ಸಂಜೆ":"ರಾತ್ರಿ"},dayOfMonthOrdinalParse:/\d{1,2}(ನೇ)/,ordinal:function(a){return a+"ನೇ"},week:{dow:0,doy:6}}),
//! moment.js locale configuration
//! locale : Korean [ko]
//! author : Kyungwook, Park : https://github.com/kyungw00k
//! author : Jeeeyul Lee <jeeeyul@gmail.com>
a.defineLocale("ko",{months:"1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),monthsShort:"1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),weekdays:"일요일_월요일_화요일_수요일_목요일_금요일_토요일".split("_"),weekdaysShort:"일_월_화_수_목_금_토".split("_"),weekdaysMin:"일_월_화_수_목_금_토".split("_"),longDateFormat:{LT:"A h:mm",LTS:"A h:mm:ss",L:"YYYY.MM.DD",LL:"YYYY년 MMMM D일",LLL:"YYYY년 MMMM D일 A h:mm",LLLL:"YYYY년 MMMM D일 dddd A h:mm",l:"YYYY.MM.DD",ll:"YYYY년 MMMM D일",lll:"YYYY년 MMMM D일 A h:mm",llll:"YYYY년 MMMM D일 dddd A h:mm"},calendar:{sameDay:"오늘 LT",nextDay:"내일 LT",nextWeek:"dddd LT",lastDay:"어제 LT",lastWeek:"지난주 dddd LT",sameElse:"L"},relativeTime:{future:"%s 후",past:"%s 전",s:"몇 초",ss:"%d초",m:"1분",mm:"%d분",h:"한 시간",hh:"%d시간",d:"하루",dd:"%d일",M:"한 달",MM:"%d달",y:"일 년",yy:"%d년"},dayOfMonthOrdinalParse:/\d{1,2}일/,ordinal:"%d일",meridiemParse:/오전|오후/,isPM:function(a){return"오후"===a},meridiem:function(a,b,c){return a<12?"오전":"오후"}});
//! moment.js locale configuration
//! locale : Kyrgyz [ky]
//! author : Chyngyz Arystan uulu : https://github.com/chyngyz
var mh={0:"-чү",1:"-чи",2:"-чи",3:"-чү",4:"-чү",5:"-чи",6:"-чы",7:"-чи",8:"-чи",9:"-чу",10:"-чу",20:"-чы",30:"-чу",40:"-чы",50:"-чү",60:"-чы",70:"-чи",80:"-чи",90:"-чу",100:"-чү"};a.defineLocale("ky",{months:"январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split("_"),monthsShort:"янв_фев_март_апр_май_июнь_июль_авг_сен_окт_ноя_дек".split("_"),weekdays:"Жекшемби_Дүйшөмбү_Шейшемби_Шаршемби_Бейшемби_Жума_Ишемби".split("_"),weekdaysShort:"Жек_Дүй_Шей_Шар_Бей_Жум_Ише".split("_"),weekdaysMin:"Жк_Дй_Шй_Шр_Бй_Жм_Иш".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Бүгүн саат] LT",nextDay:"[Эртең саат] LT",nextWeek:"dddd [саат] LT",lastDay:"[Кече саат] LT",lastWeek:"[Өткен аптанын] dddd [күнү] [саат] LT",sameElse:"L"},relativeTime:{future:"%s ичинде",past:"%s мурун",s:"бирнече секунд",m:"бир мүнөт",mm:"%d мүнөт",h:"бир саат",hh:"%d саат",d:"бир күн",dd:"%d күн",M:"бир ай",MM:"%d ай",y:"бир жыл",yy:"%d жыл"},dayOfMonthOrdinalParse:/\d{1,2}-(чи|чы|чү|чу)/,ordinal:function(a){var b=a%10,c=a>=100?100:null;return a+(mh[a]||mh[b]||mh[c])},week:{dow:1,doy:7}}),a.defineLocale("lb",{months:"Januar_Februar_Mäerz_Abrëll_Mee_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),monthsShort:"Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),monthsParseExact:!0,weekdays:"Sonndeg_Méindeg_Dënschdeg_Mëttwoch_Donneschdeg_Freideg_Samschdeg".split("_"),weekdaysShort:"So._Mé._Dë._Më._Do._Fr._Sa.".split("_"),weekdaysMin:"So_Mé_Dë_Më_Do_Fr_Sa".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm [Auer]",LTS:"H:mm:ss [Auer]",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm [Auer]",LLLL:"dddd, D. MMMM YYYY H:mm [Auer]"},calendar:{sameDay:"[Haut um] LT",sameElse:"L",nextDay:"[Muer um] LT",nextWeek:"dddd [um] LT",lastDay:"[Gëschter um] LT",lastWeek:function(){switch(this.day()){case 2:case 4:return"[Leschten] dddd [um] LT";default:return"[Leschte] dddd [um] LT"}}},relativeTime:{future:Pd,past:Qd,s:"e puer Sekonnen",m:Od,mm:"%d Minutten",h:Od,hh:"%d Stonnen",d:Od,dd:"%d Deeg",M:Od,MM:"%d Méint",y:Od,yy:"%d Joer"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Lao [lo]
//! author : Ryan Hart : https://github.com/ryanhart2
a.defineLocale("lo",{months:"ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ".split("_"),monthsShort:"ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ".split("_"),weekdays:"ອາທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ".split("_"),weekdaysShort:"ທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ".split("_"),weekdaysMin:"ທ_ຈ_ອຄ_ພ_ພຫ_ສກ_ສ".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"ວັນdddd D MMMM YYYY HH:mm"},meridiemParse:/ຕອນເຊົ້າ|ຕອນແລງ/,isPM:function(a){return"ຕອນແລງ"===a},meridiem:function(a,b,c){return a<12?"ຕອນເຊົ້າ":"ຕອນແລງ"},calendar:{sameDay:"[ມື້ນີ້ເວລາ] LT",nextDay:"[ມື້ອື່ນເວລາ] LT",nextWeek:"[ວັນ]dddd[ໜ້າເວລາ] LT",lastDay:"[ມື້ວານນີ້ເວລາ] LT",lastWeek:"[ວັນ]dddd[ແລ້ວນີ້ເວລາ] LT",sameElse:"L"},relativeTime:{future:"ອີກ %s",past:"%sຜ່ານມາ",s:"ບໍ່ເທົ່າໃດວິນາທີ",m:"1 ນາທີ",mm:"%d ນາທີ",h:"1 ຊົ່ວໂມງ",hh:"%d ຊົ່ວໂມງ",d:"1 ມື້",dd:"%d ມື້",M:"1 ເດືອນ",MM:"%d ເດືອນ",y:"1 ປີ",yy:"%d ປີ"},dayOfMonthOrdinalParse:/(ທີ່)\d{1,2}/,ordinal:function(a){return"ທີ່"+a}});
//! moment.js locale configuration
//! locale : Lithuanian [lt]
//! author : Mindaugas Mozūras : https://github.com/mmozuras
var nh={m:"minutė_minutės_minutę",mm:"minutės_minučių_minutes",h:"valanda_valandos_valandą",hh:"valandos_valandų_valandas",d:"diena_dienos_dieną",dd:"dienos_dienų_dienas",M:"mėnuo_mėnesio_mėnesį",MM:"mėnesiai_mėnesių_mėnesius",y:"metai_metų_metus",yy:"metai_metų_metus"};a.defineLocale("lt",{months:{format:"sausio_vasario_kovo_balandžio_gegužės_birželio_liepos_rugpjūčio_rugsėjo_spalio_lapkričio_gruodžio".split("_"),standalone:"sausis_vasaris_kovas_balandis_gegužė_birželis_liepa_rugpjūtis_rugsėjis_spalis_lapkritis_gruodis".split("_"),isFormat:/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?|MMMM?(\[[^\[\]]*\]|\s)+D[oD]?/},monthsShort:"sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd".split("_"),weekdays:{format:"sekmadienį_pirmadienį_antradienį_trečiadienį_ketvirtadienį_penktadienį_šeštadienį".split("_"),standalone:"sekmadienis_pirmadienis_antradienis_trečiadienis_ketvirtadienis_penktadienis_šeštadienis".split("_"),isFormat:/dddd HH:mm/},weekdaysShort:"Sek_Pir_Ant_Tre_Ket_Pen_Šeš".split("_"),weekdaysMin:"S_P_A_T_K_Pn_Š".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY-MM-DD",LL:"YYYY [m.] MMMM D [d.]",LLL:"YYYY [m.] MMMM D [d.], HH:mm [val.]",LLLL:"YYYY [m.] MMMM D [d.], dddd, HH:mm [val.]",l:"YYYY-MM-DD",ll:"YYYY [m.] MMMM D [d.]",lll:"YYYY [m.] MMMM D [d.], HH:mm [val.]",llll:"YYYY [m.] MMMM D [d.], ddd, HH:mm [val.]"},calendar:{sameDay:"[Šiandien] LT",nextDay:"[Rytoj] LT",nextWeek:"dddd LT",lastDay:"[Vakar] LT",lastWeek:"[Praėjusį] dddd LT",sameElse:"L"},relativeTime:{future:"po %s",past:"prieš %s",s:Sd,m:Td,mm:Wd,h:Td,hh:Wd,d:Td,dd:Wd,M:Td,MM:Wd,y:Td,yy:Wd},dayOfMonthOrdinalParse:/\d{1,2}-oji/,ordinal:function(a){return a+"-oji"},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Latvian [lv]
//! author : Kristaps Karlsons : https://github.com/skakri
//! author : Jānis Elmeris : https://github.com/JanisE
var oh={m:"minūtes_minūtēm_minūte_minūtes".split("_"),mm:"minūtes_minūtēm_minūte_minūtes".split("_"),h:"stundas_stundām_stunda_stundas".split("_"),hh:"stundas_stundām_stunda_stundas".split("_"),d:"dienas_dienām_diena_dienas".split("_"),dd:"dienas_dienām_diena_dienas".split("_"),M:"mēneša_mēnešiem_mēnesis_mēneši".split("_"),MM:"mēneša_mēnešiem_mēnesis_mēneši".split("_"),y:"gada_gadiem_gads_gadi".split("_"),yy:"gada_gadiem_gads_gadi".split("_")};a.defineLocale("lv",{months:"janvāris_februāris_marts_aprīlis_maijs_jūnijs_jūlijs_augusts_septembris_oktobris_novembris_decembris".split("_"),monthsShort:"jan_feb_mar_apr_mai_jūn_jūl_aug_sep_okt_nov_dec".split("_"),weekdays:"svētdiena_pirmdiena_otrdiena_trešdiena_ceturtdiena_piektdiena_sestdiena".split("_"),weekdaysShort:"Sv_P_O_T_C_Pk_S".split("_"),weekdaysMin:"Sv_P_O_T_C_Pk_S".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY.",LL:"YYYY. [gada] D. MMMM",LLL:"YYYY. [gada] D. MMMM, HH:mm",LLLL:"YYYY. [gada] D. MMMM, dddd, HH:mm"},calendar:{sameDay:"[Šodien pulksten] LT",nextDay:"[Rīt pulksten] LT",nextWeek:"dddd [pulksten] LT",lastDay:"[Vakar pulksten] LT",lastWeek:"[Pagājušā] dddd [pulksten] LT",sameElse:"L"},relativeTime:{future:"pēc %s",past:"pirms %s",s:$d,m:Zd,mm:Yd,h:Zd,hh:Yd,d:Zd,dd:Yd,M:Zd,MM:Yd,y:Zd,yy:Yd},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Montenegrin [me]
//! author : Miodrag Nikač <miodrag@restartit.me> : https://github.com/miodragnikac
var ph={words:{m:["jedan minut","jednog minuta"],mm:["minut","minuta","minuta"],h:["jedan sat","jednog sata"],hh:["sat","sata","sati"],dd:["dan","dana","dana"],MM:["mjesec","mjeseca","mjeseci"],yy:["godina","godine","godina"]},correctGrammaticalCase:function(a,b){return 1===a?b[0]:a>=2&&a<=4?b[1]:b[2]},translate:function(a,b,c){var d=ph.words[c];return 1===c.length?b?d[0]:d[1]:a+" "+ph.correctGrammaticalCase(a,d)}};a.defineLocale("me",{months:"januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar".split("_"),monthsShort:"jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.".split("_"),monthsParseExact:!0,weekdays:"nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),weekdaysShort:"ned._pon._uto._sri._čet._pet._sub.".split("_"),weekdaysMin:"ne_po_ut_sr_če_pe_su".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd, D. MMMM YYYY H:mm"},calendar:{sameDay:"[danas u] LT",nextDay:"[sjutra u] LT",nextWeek:function(){switch(this.day()){case 0:return"[u] [nedjelju] [u] LT";case 3:return"[u] [srijedu] [u] LT";case 6:return"[u] [subotu] [u] LT";case 1:case 2:case 4:case 5:return"[u] dddd [u] LT"}},lastDay:"[juče u] LT",lastWeek:function(){var a=["[prošle] [nedjelje] [u] LT","[prošlog] [ponedjeljka] [u] LT","[prošlog] [utorka] [u] LT","[prošle] [srijede] [u] LT","[prošlog] [četvrtka] [u] LT","[prošlog] [petka] [u] LT","[prošle] [subote] [u] LT"];return a[this.day()]},sameElse:"L"},relativeTime:{future:"za %s",past:"prije %s",s:"nekoliko sekundi",m:ph.translate,mm:ph.translate,h:ph.translate,hh:ph.translate,d:"dan",dd:ph.translate,M:"mjesec",MM:ph.translate,y:"godinu",yy:ph.translate},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Maori [mi]
//! author : John Corrigan <robbiecloset@gmail.com> : https://github.com/johnideal
a.defineLocale("mi",{months:"Kohi-tāte_Hui-tanguru_Poutū-te-rangi_Paenga-whāwhā_Haratua_Pipiri_Hōngoingoi_Here-turi-kōkā_Mahuru_Whiringa-ā-nuku_Whiringa-ā-rangi_Hakihea".split("_"),monthsShort:"Kohi_Hui_Pou_Pae_Hara_Pipi_Hōngoi_Here_Mahu_Whi-nu_Whi-ra_Haki".split("_"),monthsRegex:/(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,monthsStrictRegex:/(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,monthsShortRegex:/(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,monthsShortStrictRegex:/(?:['a-z\u0101\u014D\u016B]+\-?){1,2}/i,weekdays:"Rātapu_Mane_Tūrei_Wenerei_Tāite_Paraire_Hātarei".split("_"),weekdaysShort:"Ta_Ma_Tū_We_Tāi_Pa_Hā".split("_"),weekdaysMin:"Ta_Ma_Tū_We_Tāi_Pa_Hā".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY [i] HH:mm",LLLL:"dddd, D MMMM YYYY [i] HH:mm"},calendar:{sameDay:"[i teie mahana, i] LT",nextDay:"[apopo i] LT",nextWeek:"dddd [i] LT",lastDay:"[inanahi i] LT",lastWeek:"dddd [whakamutunga i] LT",sameElse:"L"},relativeTime:{future:"i roto i %s",past:"%s i mua",s:"te hēkona ruarua",m:"he meneti",mm:"%d meneti",h:"te haora",hh:"%d haora",d:"he ra",dd:"%d ra",M:"he marama",MM:"%d marama",y:"he tau",yy:"%d tau"},dayOfMonthOrdinalParse:/\d{1,2}º/,ordinal:"%dº",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Macedonian [mk]
//! author : Borislav Mickov : https://github.com/B0k0
a.defineLocale("mk",{months:"јануари_февруари_март_април_мај_јуни_јули_август_септември_октомври_ноември_декември".split("_"),monthsShort:"јан_фев_мар_апр_мај_јун_јул_авг_сеп_окт_ное_дек".split("_"),weekdays:"недела_понеделник_вторник_среда_четврток_петок_сабота".split("_"),weekdaysShort:"нед_пон_вто_сре_чет_пет_саб".split("_"),weekdaysMin:"нe_пo_вт_ср_че_пе_сa".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"D.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY H:mm",LLLL:"dddd, D MMMM YYYY H:mm"},calendar:{sameDay:"[Денес во] LT",nextDay:"[Утре во] LT",nextWeek:"[Во] dddd [во] LT",lastDay:"[Вчера во] LT",lastWeek:function(){switch(this.day()){case 0:case 3:case 6:return"[Изминатата] dddd [во] LT";case 1:case 2:case 4:case 5:return"[Изминатиот] dddd [во] LT"}},sameElse:"L"},relativeTime:{future:"после %s",past:"пред %s",s:"неколку секунди",m:"минута",mm:"%d минути",h:"час",hh:"%d часа",d:"ден",dd:"%d дена",M:"месец",MM:"%d месеци",y:"година",yy:"%d години"},dayOfMonthOrdinalParse:/\d{1,2}-(ев|ен|ти|ви|ри|ми)/,ordinal:function(a){var b=a%10,c=a%100;return 0===a?a+"-ев":0===c?a+"-ен":c>10&&c<20?a+"-ти":1===b?a+"-ви":2===b?a+"-ри":7===b||8===b?a+"-ми":a+"-ти"},week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Malayalam [ml]
//! author : Floyd Pink : https://github.com/floydpink
a.defineLocale("ml",{months:"ജനുവരി_ഫെബ്രുവരി_മാർച്ച്_ഏപ്രിൽ_മേയ്_ജൂൺ_ജൂലൈ_ഓഗസ്റ്റ്_സെപ്റ്റംബർ_ഒക്ടോബർ_നവംബർ_ഡിസംബർ".split("_"),monthsShort:"ജനു._ഫെബ്രു._മാർ._ഏപ്രി._മേയ്_ജൂൺ_ജൂലൈ._ഓഗ._സെപ്റ്റ._ഒക്ടോ._നവം._ഡിസം.".split("_"),monthsParseExact:!0,weekdays:"ഞായറാഴ്ച_തിങ്കളാഴ്ച_ചൊവ്വാഴ്ച_ബുധനാഴ്ച_വ്യാഴാഴ്ച_വെള്ളിയാഴ്ച_ശനിയാഴ്ച".split("_"),weekdaysShort:"ഞായർ_തിങ്കൾ_ചൊവ്വ_ബുധൻ_വ്യാഴം_വെള്ളി_ശനി".split("_"),weekdaysMin:"ഞാ_തി_ചൊ_ബു_വ്യാ_വെ_ശ".split("_"),longDateFormat:{LT:"A h:mm -നു",LTS:"A h:mm:ss -നു",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm -നു",LLLL:"dddd, D MMMM YYYY, A h:mm -നു"},calendar:{sameDay:"[ഇന്ന്] LT",nextDay:"[നാളെ] LT",nextWeek:"dddd, LT",lastDay:"[ഇന്നലെ] LT",lastWeek:"[കഴിഞ്ഞ] dddd, LT",sameElse:"L"},relativeTime:{future:"%s കഴിഞ്ഞ്",past:"%s മുൻപ്",s:"അൽപ നിമിഷങ്ങൾ",m:"ഒരു മിനിറ്റ്",mm:"%d മിനിറ്റ്",h:"ഒരു മണിക്കൂർ",hh:"%d മണിക്കൂർ",d:"ഒരു ദിവസം",dd:"%d ദിവസം",M:"ഒരു മാസം",MM:"%d മാസം",y:"ഒരു വർഷം",yy:"%d വർഷം"},meridiemParse:/രാത്രി|രാവിലെ|ഉച്ച കഴിഞ്ഞ്|വൈകുന്നേരം|രാത്രി/i,meridiemHour:function(a,b){return 12===a&&(a=0),"രാത്രി"===b&&a>=4||"ഉച്ച കഴിഞ്ഞ്"===b||"വൈകുന്നേരം"===b?a+12:a},meridiem:function(a,b,c){return a<4?"രാത്രി":a<12?"രാവിലെ":a<17?"ഉച്ച കഴിഞ്ഞ്":a<20?"വൈകുന്നേരം":"രാത്രി"}});
//! moment.js locale configuration
//! locale : Marathi [mr]
//! author : Harshad Kale : https://github.com/kalehv
//! author : Vivek Athalye : https://github.com/vnathalye
var qh={1:"१",2:"२",3:"३",4:"४",5:"५",6:"६",7:"७",8:"८",9:"९",0:"०"},rh={"१":"1","२":"2","३":"3","४":"4","५":"5","६":"6","७":"7","८":"8","९":"9","०":"0"};a.defineLocale("mr",{months:"जानेवारी_फेब्रुवारी_मार्च_एप्रिल_मे_जून_जुलै_ऑगस्ट_सप्टेंबर_ऑक्टोबर_नोव्हेंबर_डिसेंबर".split("_"),monthsShort:"जाने._फेब्रु._मार्च._एप्रि._मे._जून._जुलै._ऑग._सप्टें._ऑक्टो._नोव्हें._डिसें.".split("_"),monthsParseExact:!0,weekdays:"रविवार_सोमवार_मंगळवार_बुधवार_गुरूवार_शुक्रवार_शनिवार".split("_"),weekdaysShort:"रवि_सोम_मंगळ_बुध_गुरू_शुक्र_शनि".split("_"),weekdaysMin:"र_सो_मं_बु_गु_शु_श".split("_"),longDateFormat:{LT:"A h:mm वाजता",LTS:"A h:mm:ss वाजता",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm वाजता",LLLL:"dddd, D MMMM YYYY, A h:mm वाजता"},calendar:{sameDay:"[आज] LT",nextDay:"[उद्या] LT",nextWeek:"dddd, LT",lastDay:"[काल] LT",lastWeek:"[मागील] dddd, LT",sameElse:"L"},relativeTime:{future:"%sमध्ये",past:"%sपूर्वी",s:_d,m:_d,mm:_d,h:_d,hh:_d,d:_d,dd:_d,M:_d,MM:_d,y:_d,yy:_d},preparse:function(a){return a.replace(/[१२३४५६७८९०]/g,function(a){return rh[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return qh[a]})},meridiemParse:/रात्री|सकाळी|दुपारी|सायंकाळी/,meridiemHour:function(a,b){return 12===a&&(a=0),"रात्री"===b?a<4?a:a+12:"सकाळी"===b?a:"दुपारी"===b?a>=10?a:a+12:"सायंकाळी"===b?a+12:void 0},meridiem:function(a,b,c){return a<4?"रात्री":a<10?"सकाळी":a<17?"दुपारी":a<20?"सायंकाळी":"रात्री"},week:{dow:0,doy:6}}),
//! moment.js locale configuration
//! locale : Malay [ms-my]
//! note : DEPRECATED, the correct one is [ms]
//! author : Weldan Jamili : https://github.com/weldan
a.defineLocale("ms-my",{months:"Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),monthsShort:"Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),weekdays:"Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),weekdaysShort:"Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),weekdaysMin:"Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),longDateFormat:{LT:"HH.mm",LTS:"HH.mm.ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY [pukul] HH.mm",LLLL:"dddd, D MMMM YYYY [pukul] HH.mm"},meridiemParse:/pagi|tengahari|petang|malam/,meridiemHour:function(a,b){return 12===a&&(a=0),"pagi"===b?a:"tengahari"===b?a>=11?a:a+12:"petang"===b||"malam"===b?a+12:void 0},meridiem:function(a,b,c){return a<11?"pagi":a<15?"tengahari":a<19?"petang":"malam"},calendar:{sameDay:"[Hari ini pukul] LT",nextDay:"[Esok pukul] LT",nextWeek:"dddd [pukul] LT",lastDay:"[Kelmarin pukul] LT",lastWeek:"dddd [lepas pukul] LT",sameElse:"L"},relativeTime:{future:"dalam %s",past:"%s yang lepas",s:"beberapa saat",m:"seminit",mm:"%d minit",h:"sejam",hh:"%d jam",d:"sehari",dd:"%d hari",M:"sebulan",MM:"%d bulan",y:"setahun",yy:"%d tahun"},week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Malay [ms]
//! author : Weldan Jamili : https://github.com/weldan
a.defineLocale("ms",{months:"Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),monthsShort:"Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),weekdays:"Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),weekdaysShort:"Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),weekdaysMin:"Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),longDateFormat:{LT:"HH.mm",LTS:"HH.mm.ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY [pukul] HH.mm",LLLL:"dddd, D MMMM YYYY [pukul] HH.mm"},meridiemParse:/pagi|tengahari|petang|malam/,meridiemHour:function(a,b){return 12===a&&(a=0),"pagi"===b?a:"tengahari"===b?a>=11?a:a+12:"petang"===b||"malam"===b?a+12:void 0},meridiem:function(a,b,c){return a<11?"pagi":a<15?"tengahari":a<19?"petang":"malam"},calendar:{sameDay:"[Hari ini pukul] LT",nextDay:"[Esok pukul] LT",nextWeek:"dddd [pukul] LT",lastDay:"[Kelmarin pukul] LT",lastWeek:"dddd [lepas pukul] LT",sameElse:"L"},relativeTime:{future:"dalam %s",past:"%s yang lepas",s:"beberapa saat",m:"seminit",mm:"%d minit",h:"sejam",hh:"%d jam",d:"sehari",dd:"%d hari",M:"sebulan",MM:"%d bulan",y:"setahun",yy:"%d tahun"},week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Burmese [my]
//! author : Squar team, mysquar.com
//! author : David Rossellat : https://github.com/gholadr
//! author : Tin Aung Lin : https://github.com/thanyawzinmin
var sh={1:"၁",2:"၂",3:"၃",4:"၄",5:"၅",6:"၆",7:"၇",8:"၈",9:"၉",0:"၀"},th={"၁":"1","၂":"2","၃":"3","၄":"4","၅":"5","၆":"6","၇":"7","၈":"8","၉":"9","၀":"0"};a.defineLocale("my",{months:"ဇန်နဝါရီ_ဖေဖော်ဝါရီ_မတ်_ဧပြီ_မေ_ဇွန်_ဇူလိုင်_သြဂုတ်_စက်တင်ဘာ_အောက်တိုဘာ_နိုဝင်ဘာ_ဒီဇင်ဘာ".split("_"),monthsShort:"ဇန်_ဖေ_မတ်_ပြီ_မေ_ဇွန်_လိုင်_သြ_စက်_အောက်_နို_ဒီ".split("_"),weekdays:"တနင်္ဂနွေ_တနင်္လာ_အင်္ဂါ_ဗုဒ္ဓဟူး_ကြာသပတေး_သောကြာ_စနေ".split("_"),weekdaysShort:"နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ".split("_"),weekdaysMin:"နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[ယနေ.] LT [မှာ]",nextDay:"[မနက်ဖြန်] LT [မှာ]",nextWeek:"dddd LT [မှာ]",lastDay:"[မနေ.က] LT [မှာ]",lastWeek:"[ပြီးခဲ့သော] dddd LT [မှာ]",sameElse:"L"},relativeTime:{future:"လာမည့် %s မှာ",past:"လွန်ခဲ့သော %s က",s:"စက္ကန်.အနည်းငယ်",m:"တစ်မိနစ်",mm:"%d မိနစ်",h:"တစ်နာရီ",hh:"%d နာရီ",d:"တစ်ရက်",dd:"%d ရက်",M:"တစ်လ",MM:"%d လ",y:"တစ်နှစ်",yy:"%d နှစ်"},preparse:function(a){return a.replace(/[၁၂၃၄၅၆၇၈၉၀]/g,function(a){return th[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return sh[a]})},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Norwegian Bokmål [nb]
//! authors : Espen Hovlandsdal : https://github.com/rexxars
//!           Sigurd Gartmann : https://github.com/sigurdga
a.defineLocale("nb",{months:"januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),monthsShort:"jan._feb._mars_april_mai_juni_juli_aug._sep._okt._nov._des.".split("_"),monthsParseExact:!0,weekdays:"søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"),weekdaysShort:"sø._ma._ti._on._to._fr._lø.".split("_"),weekdaysMin:"sø_ma_ti_on_to_fr_lø".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY [kl.] HH:mm",LLLL:"dddd D. MMMM YYYY [kl.] HH:mm"},calendar:{sameDay:"[i dag kl.] LT",nextDay:"[i morgen kl.] LT",nextWeek:"dddd [kl.] LT",lastDay:"[i går kl.] LT",lastWeek:"[forrige] dddd [kl.] LT",sameElse:"L"},relativeTime:{future:"om %s",past:"%s siden",s:"noen sekunder",m:"ett minutt",mm:"%d minutter",h:"en time",hh:"%d timer",d:"en dag",dd:"%d dager",M:"en måned",MM:"%d måneder",y:"ett år",yy:"%d år"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Nepalese [ne]
//! author : suvash : https://github.com/suvash
var uh={1:"१",2:"२",3:"३",4:"४",5:"५",6:"६",7:"७",8:"८",9:"९",0:"०"},vh={"१":"1","२":"2","३":"3","४":"4","५":"5","६":"6","७":"7","८":"8","९":"9","०":"0"};a.defineLocale("ne",{months:"जनवरी_फेब्रुवरी_मार्च_अप्रिल_मई_जुन_जुलाई_अगष्ट_सेप्टेम्बर_अक्टोबर_नोभेम्बर_डिसेम्बर".split("_"),monthsShort:"जन._फेब्रु._मार्च_अप्रि._मई_जुन_जुलाई._अग._सेप्ट._अक्टो._नोभे._डिसे.".split("_"),monthsParseExact:!0,weekdays:"आइतबार_सोमबार_मङ्गलबार_बुधबार_बिहिबार_शुक्रबार_शनिबार".split("_"),weekdaysShort:"आइत._सोम._मङ्गल._बुध._बिहि._शुक्र._शनि.".split("_"),weekdaysMin:"आ._सो._मं._बु._बि._शु._श.".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"Aको h:mm बजे",LTS:"Aको h:mm:ss बजे",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, Aको h:mm बजे",LLLL:"dddd, D MMMM YYYY, Aको h:mm बजे"},preparse:function(a){return a.replace(/[१२३४५६७८९०]/g,function(a){return vh[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return uh[a]})},meridiemParse:/राति|बिहान|दिउँसो|साँझ/,meridiemHour:function(a,b){return 12===a&&(a=0),"राति"===b?a<4?a:a+12:"बिहान"===b?a:"दिउँसो"===b?a>=10?a:a+12:"साँझ"===b?a+12:void 0},meridiem:function(a,b,c){return a<3?"राति":a<12?"बिहान":a<16?"दिउँसो":a<20?"साँझ":"राति"},calendar:{sameDay:"[आज] LT",nextDay:"[भोलि] LT",nextWeek:"[आउँदो] dddd[,] LT",lastDay:"[हिजो] LT",lastWeek:"[गएको] dddd[,] LT",sameElse:"L"},relativeTime:{future:"%sमा",past:"%s अगाडि",s:"केही क्षण",m:"एक मिनेट",mm:"%d मिनेट",h:"एक घण्टा",hh:"%d घण्टा",d:"एक दिन",dd:"%d दिन",M:"एक महिना",MM:"%d महिना",y:"एक बर्ष",yy:"%d बर्ष"},week:{dow:0,doy:6}});
//! moment.js locale configuration
//! locale : Dutch (Belgium) [nl-be]
//! author : Joris Röling : https://github.com/jorisroling
//! author : Jacob Middag : https://github.com/middagj
var wh="jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_"),xh="jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_"),yh=[/^jan/i,/^feb/i,/^maart|mrt.?$/i,/^apr/i,/^mei$/i,/^jun[i.]?$/i,/^jul[i.]?$/i,/^aug/i,/^sep/i,/^okt/i,/^nov/i,/^dec/i],zh=/^(januari|februari|maart|april|mei|april|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;a.defineLocale("nl-be",{months:"januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),monthsShort:function(a,b){return a?/-MMM-/.test(b)?xh[a.month()]:wh[a.month()]:wh},monthsRegex:zh,monthsShortRegex:zh,monthsStrictRegex:/^(januari|februari|maart|mei|ju[nl]i|april|augustus|september|oktober|november|december)/i,monthsShortStrictRegex:/^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,monthsParse:yh,longMonthsParse:yh,shortMonthsParse:yh,weekdays:"zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),weekdaysShort:"zo._ma._di._wo._do._vr._za.".split("_"),weekdaysMin:"Zo_Ma_Di_Wo_Do_Vr_Za".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[vandaag om] LT",nextDay:"[morgen om] LT",nextWeek:"dddd [om] LT",lastDay:"[gisteren om] LT",lastWeek:"[afgelopen] dddd [om] LT",sameElse:"L"},relativeTime:{future:"over %s",past:"%s geleden",s:"een paar seconden",m:"één minuut",mm:"%d minuten",h:"één uur",hh:"%d uur",d:"één dag",dd:"%d dagen",M:"één maand",MM:"%d maanden",y:"één jaar",yy:"%d jaar"},dayOfMonthOrdinalParse:/\d{1,2}(ste|de)/,ordinal:function(a){return a+(1===a||8===a||a>=20?"ste":"de")},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Dutch [nl]
//! author : Joris Röling : https://github.com/jorisroling
//! author : Jacob Middag : https://github.com/middagj
var Ah="jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_"),Bh="jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_"),Ch=[/^jan/i,/^feb/i,/^maart|mrt.?$/i,/^apr/i,/^mei$/i,/^jun[i.]?$/i,/^jul[i.]?$/i,/^aug/i,/^sep/i,/^okt/i,/^nov/i,/^dec/i],Dh=/^(januari|februari|maart|april|mei|april|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;a.defineLocale("nl",{months:"januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),monthsShort:function(a,b){return a?/-MMM-/.test(b)?Bh[a.month()]:Ah[a.month()]:Ah},monthsRegex:Dh,monthsShortRegex:Dh,monthsStrictRegex:/^(januari|februari|maart|mei|ju[nl]i|april|augustus|september|oktober|november|december)/i,monthsShortStrictRegex:/^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,monthsParse:Ch,longMonthsParse:Ch,shortMonthsParse:Ch,weekdays:"zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),weekdaysShort:"zo._ma._di._wo._do._vr._za.".split("_"),weekdaysMin:"Zo_Ma_Di_Wo_Do_Vr_Za".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD-MM-YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[vandaag om] LT",nextDay:"[morgen om] LT",nextWeek:"dddd [om] LT",lastDay:"[gisteren om] LT",lastWeek:"[afgelopen] dddd [om] LT",sameElse:"L"},relativeTime:{future:"over %s",past:"%s geleden",s:"een paar seconden",m:"één minuut",mm:"%d minuten",h:"één uur",hh:"%d uur",d:"één dag",dd:"%d dagen",M:"één maand",MM:"%d maanden",y:"één jaar",yy:"%d jaar"},dayOfMonthOrdinalParse:/\d{1,2}(ste|de)/,ordinal:function(a){return a+(1===a||8===a||a>=20?"ste":"de")},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Nynorsk [nn]
//! author : https://github.com/mechuwind
a.defineLocale("nn",{months:"januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),monthsShort:"jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),weekdays:"sundag_måndag_tysdag_onsdag_torsdag_fredag_laurdag".split("_"),weekdaysShort:"sun_mån_tys_ons_tor_fre_lau".split("_"),weekdaysMin:"su_må_ty_on_to_fr_lø".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY [kl.] H:mm",LLLL:"dddd D. MMMM YYYY [kl.] HH:mm"},calendar:{sameDay:"[I dag klokka] LT",nextDay:"[I morgon klokka] LT",nextWeek:"dddd [klokka] LT",lastDay:"[I går klokka] LT",lastWeek:"[Føregåande] dddd [klokka] LT",sameElse:"L"},relativeTime:{future:"om %s",past:"%s sidan",s:"nokre sekund",m:"eit minutt",mm:"%d minutt",h:"ein time",hh:"%d timar",d:"ein dag",dd:"%d dagar",M:"ein månad",MM:"%d månader",y:"eit år",yy:"%d år"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Punjabi (India) [pa-in]
//! author : Harpreet Singh : https://github.com/harpreetkhalsagtbit
var Eh={1:"੧",2:"੨",3:"੩",4:"੪",5:"੫",6:"੬",7:"੭",8:"੮",9:"੯",0:"੦"},Fh={"੧":"1","੨":"2","੩":"3","੪":"4","੫":"5","੬":"6","੭":"7","੮":"8","੯":"9","੦":"0"};a.defineLocale("pa-in",{months:"ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ".split("_"),monthsShort:"ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ".split("_"),weekdays:"ਐਤਵਾਰ_ਸੋਮਵਾਰ_ਮੰਗਲਵਾਰ_ਬੁਧਵਾਰ_ਵੀਰਵਾਰ_ਸ਼ੁੱਕਰਵਾਰ_ਸ਼ਨੀਚਰਵਾਰ".split("_"),weekdaysShort:"ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ".split("_"),weekdaysMin:"ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ".split("_"),longDateFormat:{LT:"A h:mm ਵਜੇ",LTS:"A h:mm:ss ਵਜੇ",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm ਵਜੇ",LLLL:"dddd, D MMMM YYYY, A h:mm ਵਜੇ"},calendar:{sameDay:"[ਅਜ] LT",nextDay:"[ਕਲ] LT",nextWeek:"dddd, LT",lastDay:"[ਕਲ] LT",lastWeek:"[ਪਿਛਲੇ] dddd, LT",sameElse:"L"},relativeTime:{future:"%s ਵਿੱਚ",past:"%s ਪਿਛਲੇ",s:"ਕੁਝ ਸਕਿੰਟ",m:"ਇਕ ਮਿੰਟ",mm:"%d ਮਿੰਟ",h:"ਇੱਕ ਘੰਟਾ",hh:"%d ਘੰਟੇ",d:"ਇੱਕ ਦਿਨ",dd:"%d ਦਿਨ",M:"ਇੱਕ ਮਹੀਨਾ",MM:"%d ਮਹੀਨੇ",y:"ਇੱਕ ਸਾਲ",yy:"%d ਸਾਲ"},preparse:function(a){return a.replace(/[੧੨੩੪੫੬੭੮੯੦]/g,function(a){return Fh[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return Eh[a]})},meridiemParse:/ਰਾਤ|ਸਵੇਰ|ਦੁਪਹਿਰ|ਸ਼ਾਮ/,meridiemHour:function(a,b){return 12===a&&(a=0),"ਰਾਤ"===b?a<4?a:a+12:"ਸਵੇਰ"===b?a:"ਦੁਪਹਿਰ"===b?a>=10?a:a+12:"ਸ਼ਾਮ"===b?a+12:void 0},meridiem:function(a,b,c){return a<4?"ਰਾਤ":a<10?"ਸਵੇਰ":a<17?"ਦੁਪਹਿਰ":a<20?"ਸ਼ਾਮ":"ਰਾਤ"},week:{dow:0,doy:6}});
//! moment.js locale configuration
//! locale : Polish [pl]
//! author : Rafal Hirsz : https://github.com/evoL
var Gh="styczeń_luty_marzec_kwiecień_maj_czerwiec_lipiec_sierpień_wrzesień_październik_listopad_grudzień".split("_"),Hh="stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_września_października_listopada_grudnia".split("_");a.defineLocale("pl",{months:function(a,b){return a?""===b?"("+Hh[a.month()]+"|"+Gh[a.month()]+")":/D MMMM/.test(b)?Hh[a.month()]:Gh[a.month()]:Gh},monthsShort:"sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paź_lis_gru".split("_"),weekdays:"niedziela_poniedziałek_wtorek_środa_czwartek_piątek_sobota".split("_"),weekdaysShort:"ndz_pon_wt_śr_czw_pt_sob".split("_"),weekdaysMin:"Nd_Pn_Wt_Śr_Cz_Pt_So".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Dziś o] LT",nextDay:"[Jutro o] LT",nextWeek:"[W] dddd [o] LT",lastDay:"[Wczoraj o] LT",lastWeek:function(){switch(this.day()){case 0:return"[W zeszłą niedzielę o] LT";case 3:return"[W zeszłą środę o] LT";case 6:return"[W zeszłą sobotę o] LT";default:return"[W zeszły] dddd [o] LT"}},sameElse:"L"},relativeTime:{future:"za %s",past:"%s temu",s:"kilka sekund",m:be,mm:be,h:be,hh:be,d:"1 dzień",dd:"%d dni",M:"miesiąc",MM:be,y:"rok",yy:be},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Portuguese (Brazil) [pt-br]
//! author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira
a.defineLocale("pt-br",{months:"Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro".split("_"),monthsShort:"Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),weekdays:"Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado".split("_"),weekdaysShort:"Dom_Seg_Ter_Qua_Qui_Sex_Sáb".split("_"),weekdaysMin:"Do_2ª_3ª_4ª_5ª_6ª_Sá".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D [de] MMMM [de] YYYY",LLL:"D [de] MMMM [de] YYYY [às] HH:mm",LLLL:"dddd, D [de] MMMM [de] YYYY [às] HH:mm"},calendar:{sameDay:"[Hoje às] LT",nextDay:"[Amanhã às] LT",nextWeek:"dddd [às] LT",lastDay:"[Ontem às] LT",lastWeek:function(){return 0===this.day()||6===this.day()?"[Último] dddd [às] LT":"[Última] dddd [às] LT"},sameElse:"L"},relativeTime:{future:"em %s",past:"%s atrás",s:"poucos segundos",m:"um minuto",mm:"%d minutos",h:"uma hora",hh:"%d horas",d:"um dia",dd:"%d dias",M:"um mês",MM:"%d meses",y:"um ano",yy:"%d anos"},dayOfMonthOrdinalParse:/\d{1,2}º/,ordinal:"%dº"}),
//! moment.js locale configuration
//! locale : Portuguese [pt]
//! author : Jefferson : https://github.com/jalex79
a.defineLocale("pt",{months:"Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro".split("_"),monthsShort:"Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),weekdays:"Domingo_Segunda-Feira_Terça-Feira_Quarta-Feira_Quinta-Feira_Sexta-Feira_Sábado".split("_"),weekdaysShort:"Dom_Seg_Ter_Qua_Qui_Sex_Sáb".split("_"),weekdaysMin:"Do_2ª_3ª_4ª_5ª_6ª_Sá".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D [de] MMMM [de] YYYY",LLL:"D [de] MMMM [de] YYYY HH:mm",LLLL:"dddd, D [de] MMMM [de] YYYY HH:mm"},calendar:{sameDay:"[Hoje às] LT",nextDay:"[Amanhã às] LT",nextWeek:"dddd [às] LT",lastDay:"[Ontem às] LT",lastWeek:function(){return 0===this.day()||6===this.day()?"[Último] dddd [às] LT":"[Última] dddd [às] LT"},sameElse:"L"},relativeTime:{future:"em %s",past:"há %s",s:"segundos",m:"um minuto",mm:"%d minutos",h:"uma hora",hh:"%d horas",d:"um dia",dd:"%d dias",M:"um mês",MM:"%d meses",y:"um ano",yy:"%d anos"},dayOfMonthOrdinalParse:/\d{1,2}º/,ordinal:"%dº",week:{dow:1,doy:4}}),a.defineLocale("ro",{months:"ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie".split("_"),monthsShort:"ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.".split("_"),monthsParseExact:!0,weekdays:"duminică_luni_marți_miercuri_joi_vineri_sâmbătă".split("_"),weekdaysShort:"Dum_Lun_Mar_Mie_Joi_Vin_Sâm".split("_"),weekdaysMin:"Du_Lu_Ma_Mi_Jo_Vi_Sâ".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY H:mm",LLLL:"dddd, D MMMM YYYY H:mm"},calendar:{sameDay:"[azi la] LT",nextDay:"[mâine la] LT",nextWeek:"dddd [la] LT",lastDay:"[ieri la] LT",lastWeek:"[fosta] dddd [la] LT",sameElse:"L"},relativeTime:{future:"peste %s",past:"%s în urmă",s:"câteva secunde",m:"un minut",mm:ce,h:"o oră",hh:ce,d:"o zi",dd:ce,M:"o lună",MM:ce,y:"un an",yy:ce},week:{dow:1,doy:7}});var Ih=[/^янв/i,/^фев/i,/^мар/i,/^апр/i,/^ма[йя]/i,/^июн/i,/^июл/i,/^авг/i,/^сен/i,/^окт/i,/^ноя/i,/^дек/i];a.defineLocale("ru",{months:{format:"января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря".split("_"),standalone:"январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split("_")},monthsShort:{format:"янв._февр._мар._апр._мая_июня_июля_авг._сент._окт._нояб._дек.".split("_"),standalone:"янв._февр._март_апр._май_июнь_июль_авг._сент._окт._нояб._дек.".split("_")},weekdays:{standalone:"воскресенье_понедельник_вторник_среда_четверг_пятница_суббота".split("_"),format:"воскресенье_понедельник_вторник_среду_четверг_пятницу_субботу".split("_"),isFormat:/\[ ?[Вв] ?(?:прошлую|следующую|эту)? ?\] ?dddd/},weekdaysShort:"вс_пн_вт_ср_чт_пт_сб".split("_"),weekdaysMin:"вс_пн_вт_ср_чт_пт_сб".split("_"),monthsParse:Ih,longMonthsParse:Ih,shortMonthsParse:Ih,monthsRegex:/^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,monthsShortRegex:/^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,monthsStrictRegex:/^(январ[яь]|феврал[яь]|марта?|апрел[яь]|ма[яй]|июн[яь]|июл[яь]|августа?|сентябр[яь]|октябр[яь]|ноябр[яь]|декабр[яь])/i,monthsShortStrictRegex:/^(янв\.|февр?\.|мар[т.]|апр\.|ма[яй]|июн[ья.]|июл[ья.]|авг\.|сент?\.|окт\.|нояб?\.|дек\.)/i,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY г.",LLL:"D MMMM YYYY г., HH:mm",LLLL:"dddd, D MMMM YYYY г., HH:mm"},calendar:{sameDay:"[Сегодня в] LT",nextDay:"[Завтра в] LT",lastDay:"[Вчера в] LT",nextWeek:function(a){if(a.week()===this.week())return 2===this.day()?"[Во] dddd [в] LT":"[В] dddd [в] LT";switch(this.day()){case 0:return"[В следующее] dddd [в] LT";case 1:case 2:case 4:return"[В следующий] dddd [в] LT";case 3:case 5:case 6:return"[В следующую] dddd [в] LT"}},lastWeek:function(a){if(a.week()===this.week())return 2===this.day()?"[Во] dddd [в] LT":"[В] dddd [в] LT";switch(this.day()){case 0:return"[В прошлое] dddd [в] LT";case 1:case 2:case 4:return"[В прошлый] dddd [в] LT";case 3:case 5:case 6:return"[В прошлую] dddd [в] LT"}},sameElse:"L"},relativeTime:{future:"через %s",past:"%s назад",s:"несколько секунд",m:ee,mm:ee,h:"час",hh:ee,d:"день",dd:ee,M:"месяц",MM:ee,y:"год",yy:ee},meridiemParse:/ночи|утра|дня|вечера/i,isPM:function(a){return/^(дня|вечера)$/.test(a)},meridiem:function(a,b,c){return a<4?"ночи":a<12?"утра":a<17?"дня":"вечера"},dayOfMonthOrdinalParse:/\d{1,2}-(й|го|я)/,ordinal:function(a,b){switch(b){case"M":case"d":case"DDD":return a+"-й";case"D":return a+"-го";case"w":case"W":return a+"-я";default:return a}},week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Sindhi [sd]
//! author : Narain Sagar : https://github.com/narainsagar
var Jh=["جنوري","فيبروري","مارچ","اپريل","مئي","جون","جولاءِ","آگسٽ","سيپٽمبر","آڪٽوبر","نومبر","ڊسمبر"],Kh=["آچر","سومر","اڱارو","اربع","خميس","جمع","ڇنڇر"];a.defineLocale("sd",{months:Jh,monthsShort:Jh,weekdays:Kh,weekdaysShort:Kh,weekdaysMin:Kh,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd، D MMMM YYYY HH:mm"},meridiemParse:/صبح|شام/,isPM:function(a){return"شام"===a},meridiem:function(a,b,c){return a<12?"صبح":"شام"},calendar:{sameDay:"[اڄ] LT",nextDay:"[سڀاڻي] LT",nextWeek:"dddd [اڳين هفتي تي] LT",lastDay:"[ڪالهه] LT",lastWeek:"[گزريل هفتي] dddd [تي] LT",sameElse:"L"},relativeTime:{future:"%s پوء",past:"%s اڳ",s:"چند سيڪنڊ",m:"هڪ منٽ",mm:"%d منٽ",h:"هڪ ڪلاڪ",hh:"%d ڪلاڪ",d:"هڪ ڏينهن",dd:"%d ڏينهن",M:"هڪ مهينو",MM:"%d مهينا",y:"هڪ سال",yy:"%d سال"},preparse:function(a){return a.replace(/،/g,",")},postformat:function(a){return a.replace(/,/g,"،")},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Northern Sami [se]
//! authors : Bård Rolstad Henriksen : https://github.com/karamell
a.defineLocale("se",{months:"ođđajagemánnu_guovvamánnu_njukčamánnu_cuoŋománnu_miessemánnu_geassemánnu_suoidnemánnu_borgemánnu_čakčamánnu_golggotmánnu_skábmamánnu_juovlamánnu".split("_"),monthsShort:"ođđj_guov_njuk_cuo_mies_geas_suoi_borg_čakč_golg_skáb_juov".split("_"),weekdays:"sotnabeaivi_vuossárga_maŋŋebárga_gaskavahkku_duorastat_bearjadat_lávvardat".split("_"),weekdaysShort:"sotn_vuos_maŋ_gask_duor_bear_láv".split("_"),weekdaysMin:"s_v_m_g_d_b_L".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"MMMM D. [b.] YYYY",LLL:"MMMM D. [b.] YYYY [ti.] HH:mm",LLLL:"dddd, MMMM D. [b.] YYYY [ti.] HH:mm"},calendar:{sameDay:"[otne ti] LT",nextDay:"[ihttin ti] LT",nextWeek:"dddd [ti] LT",lastDay:"[ikte ti] LT",lastWeek:"[ovddit] dddd [ti] LT",sameElse:"L"},relativeTime:{future:"%s geažes",past:"maŋit %s",s:"moadde sekunddat",m:"okta minuhta",mm:"%d minuhtat",h:"okta diimmu",hh:"%d diimmut",d:"okta beaivi",dd:"%d beaivvit",M:"okta mánnu",MM:"%d mánut",y:"okta jahki",yy:"%d jagit"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Sinhalese [si]
//! author : Sampath Sitinamaluwa : https://github.com/sampathsris
a.defineLocale("si",{months:"ජනවාරි_පෙබරවාරි_මාර්තු_අප්‍රේල්_මැයි_ජූනි_ජූලි_අගෝස්තු_සැප්තැම්බර්_ඔක්තෝබර්_නොවැම්බර්_දෙසැම්බර්".split("_"),monthsShort:"ජන_පෙබ_මාර්_අප්_මැයි_ජූනි_ජූලි_අගෝ_සැප්_ඔක්_නොවැ_දෙසැ".split("_"),weekdays:"ඉරිදා_සඳුදා_අඟහරුවාදා_බදාදා_බ්‍රහස්පතින්දා_සිකුරාදා_සෙනසුරාදා".split("_"),weekdaysShort:"ඉරි_සඳු_අඟ_බදා_බ්‍රහ_සිකු_සෙන".split("_"),weekdaysMin:"ඉ_ස_අ_බ_බ්‍ර_සි_සෙ".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"a h:mm",LTS:"a h:mm:ss",L:"YYYY/MM/DD",LL:"YYYY MMMM D",LLL:"YYYY MMMM D, a h:mm",LLLL:"YYYY MMMM D [වැනි] dddd, a h:mm:ss"},calendar:{sameDay:"[අද] LT[ට]",nextDay:"[හෙට] LT[ට]",nextWeek:"dddd LT[ට]",lastDay:"[ඊයේ] LT[ට]",lastWeek:"[පසුගිය] dddd LT[ට]",sameElse:"L"},relativeTime:{future:"%sකින්",past:"%sකට පෙර",s:"තත්පර කිහිපය",m:"මිනිත්තුව",mm:"මිනිත්තු %d",h:"පැය",hh:"පැය %d",d:"දිනය",dd:"දින %d",M:"මාසය",MM:"මාස %d",y:"වසර",yy:"වසර %d"},dayOfMonthOrdinalParse:/\d{1,2} වැනි/,ordinal:function(a){return a+" වැනි"},meridiemParse:/පෙර වරු|පස් වරු|පෙ.ව|ප.ව./,isPM:function(a){return"ප.ව."===a||"පස් වරු"===a},meridiem:function(a,b,c){return a>11?c?"ප.ව.":"පස් වරු":c?"පෙ.ව.":"පෙර වරු"}});
//! moment.js locale configuration
//! locale : Slovak [sk]
//! author : Martin Minka : https://github.com/k2s
//! based on work of petrbela : https://github.com/petrbela
var Lh="január_február_marec_apríl_máj_jún_júl_august_september_október_november_december".split("_"),Mh="jan_feb_mar_apr_máj_jún_júl_aug_sep_okt_nov_dec".split("_");a.defineLocale("sk",{months:Lh,monthsShort:Mh,weekdays:"nedeľa_pondelok_utorok_streda_štvrtok_piatok_sobota".split("_"),weekdaysShort:"ne_po_ut_st_št_pi_so".split("_"),weekdaysMin:"ne_po_ut_st_št_pi_so".split("_"),longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd D. MMMM YYYY H:mm"},calendar:{sameDay:"[dnes o] LT",nextDay:"[zajtra o] LT",nextWeek:function(){switch(this.day()){case 0:return"[v nedeľu o] LT";case 1:case 2:return"[v] dddd [o] LT";case 3:return"[v stredu o] LT";case 4:return"[vo štvrtok o] LT";case 5:return"[v piatok o] LT";case 6:return"[v sobotu o] LT"}},lastDay:"[včera o] LT",lastWeek:function(){switch(this.day()){case 0:return"[minulú nedeľu o] LT";case 1:case 2:return"[minulý] dddd [o] LT";case 3:return"[minulú stredu o] LT";case 4:case 5:return"[minulý] dddd [o] LT";case 6:return"[minulú sobotu o] LT"}},sameElse:"L"},relativeTime:{future:"za %s",past:"pred %s",s:ge,m:ge,mm:ge,h:ge,hh:ge,d:ge,dd:ge,M:ge,MM:ge,y:ge,yy:ge},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),a.defineLocale("sl",{months:"januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december".split("_"),monthsShort:"jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),monthsParseExact:!0,weekdays:"nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota".split("_"),weekdaysShort:"ned._pon._tor._sre._čet._pet._sob.".split("_"),weekdaysMin:"ne_po_to_sr_če_pe_so".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd, D. MMMM YYYY H:mm"},calendar:{sameDay:"[danes ob] LT",nextDay:"[jutri ob] LT",nextWeek:function(){switch(this.day()){case 0:return"[v] [nedeljo] [ob] LT";case 3:return"[v] [sredo] [ob] LT";case 6:return"[v] [soboto] [ob] LT";case 1:case 2:case 4:case 5:return"[v] dddd [ob] LT"}},lastDay:"[včeraj ob] LT",lastWeek:function(){switch(this.day()){case 0:return"[prejšnjo] [nedeljo] [ob] LT";case 3:return"[prejšnjo] [sredo] [ob] LT";case 6:return"[prejšnjo] [soboto] [ob] LT";case 1:case 2:case 4:case 5:return"[prejšnji] dddd [ob] LT"}},sameElse:"L"},relativeTime:{future:"čez %s",past:"pred %s",s:he,m:he,mm:he,h:he,hh:he,d:he,dd:he,M:he,MM:he,y:he,yy:he},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Albanian [sq]
//! author : Flakërim Ismani : https://github.com/flakerimi
//! author : Menelion Elensúle : https://github.com/Oire
//! author : Oerd Cukalla : https://github.com/oerd
a.defineLocale("sq",{months:"Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_Nëntor_Dhjetor".split("_"),monthsShort:"Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_Nën_Dhj".split("_"),weekdays:"E Diel_E Hënë_E Martë_E Mërkurë_E Enjte_E Premte_E Shtunë".split("_"),weekdaysShort:"Die_Hën_Mar_Mër_Enj_Pre_Sht".split("_"),weekdaysMin:"D_H_Ma_Më_E_P_Sh".split("_"),weekdaysParseExact:!0,meridiemParse:/PD|MD/,isPM:function(a){return"M"===a.charAt(0)},meridiem:function(a,b,c){return a<12?"PD":"MD"},longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Sot në] LT",nextDay:"[Nesër në] LT",nextWeek:"dddd [në] LT",lastDay:"[Dje në] LT",lastWeek:"dddd [e kaluar në] LT",sameElse:"L"},relativeTime:{future:"në %s",past:"%s më parë",s:"disa sekonda",m:"një minutë",mm:"%d minuta",h:"një orë",hh:"%d orë",d:"një ditë",dd:"%d ditë",M:"një muaj",MM:"%d muaj",y:"një vit",yy:"%d vite"},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Serbian Cyrillic [sr-cyrl]
//! author : Milan Janačković<milanjanackovic@gmail.com> : https://github.com/milan-j
var Nh={words:{m:["један минут","једне минуте"],mm:["минут","минуте","минута"],h:["један сат","једног сата"],hh:["сат","сата","сати"],dd:["дан","дана","дана"],MM:["месец","месеца","месеци"],yy:["година","године","година"]},correctGrammaticalCase:function(a,b){return 1===a?b[0]:a>=2&&a<=4?b[1]:b[2]},translate:function(a,b,c){var d=Nh.words[c];return 1===c.length?b?d[0]:d[1]:a+" "+Nh.correctGrammaticalCase(a,d)}};a.defineLocale("sr-cyrl",{months:"јануар_фебруар_март_април_мај_јун_јул_август_септембар_октобар_новембар_децембар".split("_"),monthsShort:"јан._феб._мар._апр._мај_јун_јул_авг._сеп._окт._нов._дец.".split("_"),monthsParseExact:!0,weekdays:"недеља_понедељак_уторак_среда_четвртак_петак_субота".split("_"),weekdaysShort:"нед._пон._уто._сре._чет._пет._суб.".split("_"),weekdaysMin:"не_по_ут_ср_че_пе_су".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd, D. MMMM YYYY H:mm"},calendar:{sameDay:"[данас у] LT",nextDay:"[сутра у] LT",nextWeek:function(){switch(this.day()){case 0:return"[у] [недељу] [у] LT";case 3:return"[у] [среду] [у] LT";case 6:return"[у] [суботу] [у] LT";case 1:case 2:case 4:case 5:return"[у] dddd [у] LT"}},lastDay:"[јуче у] LT",lastWeek:function(){var a=["[прошле] [недеље] [у] LT","[прошлог] [понедељка] [у] LT","[прошлог] [уторка] [у] LT","[прошле] [среде] [у] LT","[прошлог] [четвртка] [у] LT","[прошлог] [петка] [у] LT","[прошле] [суботе] [у] LT"];return a[this.day()]},sameElse:"L"},relativeTime:{future:"за %s",past:"пре %s",s:"неколико секунди",m:Nh.translate,mm:Nh.translate,h:Nh.translate,hh:Nh.translate,d:"дан",dd:Nh.translate,M:"месец",MM:Nh.translate,y:"годину",yy:Nh.translate},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Serbian [sr]
//! author : Milan Janačković<milanjanackovic@gmail.com> : https://github.com/milan-j
var Oh={words:{m:["jedan minut","jedne minute"],mm:["minut","minute","minuta"],h:["jedan sat","jednog sata"],hh:["sat","sata","sati"],dd:["dan","dana","dana"],MM:["mesec","meseca","meseci"],yy:["godina","godine","godina"]},correctGrammaticalCase:function(a,b){return 1===a?b[0]:a>=2&&a<=4?b[1]:b[2]},translate:function(a,b,c){var d=Oh.words[c];return 1===c.length?b?d[0]:d[1]:a+" "+Oh.correctGrammaticalCase(a,d)}};a.defineLocale("sr",{months:"januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar".split("_"),monthsShort:"jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.".split("_"),monthsParseExact:!0,weekdays:"nedelja_ponedeljak_utorak_sreda_četvrtak_petak_subota".split("_"),weekdaysShort:"ned._pon._uto._sre._čet._pet._sub.".split("_"),weekdaysMin:"ne_po_ut_sr_če_pe_su".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY H:mm",LLLL:"dddd, D. MMMM YYYY H:mm"},calendar:{sameDay:"[danas u] LT",nextDay:"[sutra u] LT",nextWeek:function(){switch(this.day()){case 0:return"[u] [nedelju] [u] LT";case 3:return"[u] [sredu] [u] LT";case 6:return"[u] [subotu] [u] LT";case 1:case 2:case 4:case 5:return"[u] dddd [u] LT"}},lastDay:"[juče u] LT",lastWeek:function(){var a=["[prošle] [nedelje] [u] LT","[prošlog] [ponedeljka] [u] LT","[prošlog] [utorka] [u] LT","[prošle] [srede] [u] LT","[prošlog] [četvrtka] [u] LT","[prošlog] [petka] [u] LT","[prošle] [subote] [u] LT"];return a[this.day()]},sameElse:"L"},relativeTime:{future:"za %s",past:"pre %s",s:"nekoliko sekundi",m:Oh.translate,mm:Oh.translate,h:Oh.translate,hh:Oh.translate,d:"dan",dd:Oh.translate,M:"mesec",MM:Oh.translate,y:"godinu",yy:Oh.translate},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : siSwati [ss]
//! author : Nicolai Davies<mail@nicolai.io> : https://github.com/nicolaidavies
a.defineLocale("ss",{months:"Bhimbidvwane_Indlovana_Indlov'lenkhulu_Mabasa_Inkhwekhweti_Inhlaba_Kholwane_Ingci_Inyoni_Imphala_Lweti_Ingongoni".split("_"),monthsShort:"Bhi_Ina_Inu_Mab_Ink_Inh_Kho_Igc_Iny_Imp_Lwe_Igo".split("_"),weekdays:"Lisontfo_Umsombuluko_Lesibili_Lesitsatfu_Lesine_Lesihlanu_Umgcibelo".split("_"),weekdaysShort:"Lis_Umb_Lsb_Les_Lsi_Lsh_Umg".split("_"),weekdaysMin:"Li_Us_Lb_Lt_Ls_Lh_Ug".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY h:mm A",LLLL:"dddd, D MMMM YYYY h:mm A"},calendar:{sameDay:"[Namuhla nga] LT",nextDay:"[Kusasa nga] LT",nextWeek:"dddd [nga] LT",lastDay:"[Itolo nga] LT",lastWeek:"dddd [leliphelile] [nga] LT",sameElse:"L"},relativeTime:{future:"nga %s",past:"wenteka nga %s",s:"emizuzwana lomcane",m:"umzuzu",mm:"%d emizuzu",h:"lihora",hh:"%d emahora",d:"lilanga",dd:"%d emalanga",M:"inyanga",MM:"%d tinyanga",y:"umnyaka",yy:"%d iminyaka"},meridiemParse:/ekuseni|emini|entsambama|ebusuku/,meridiem:function(a,b,c){return a<11?"ekuseni":a<15?"emini":a<19?"entsambama":"ebusuku"},meridiemHour:function(a,b){return 12===a&&(a=0),"ekuseni"===b?a:"emini"===b?a>=11?a:a+12:"entsambama"===b||"ebusuku"===b?0===a?0:a+12:void 0},dayOfMonthOrdinalParse:/\d{1,2}/,ordinal:"%d",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Swedish [sv]
//! author : Jens Alm : https://github.com/ulmus
a.defineLocale("sv",{months:"januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december".split("_"),monthsShort:"jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),weekdays:"söndag_måndag_tisdag_onsdag_torsdag_fredag_lördag".split("_"),weekdaysShort:"sön_mån_tis_ons_tor_fre_lör".split("_"),weekdaysMin:"sö_må_ti_on_to_fr_lö".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY-MM-DD",LL:"D MMMM YYYY",LLL:"D MMMM YYYY [kl.] HH:mm",LLLL:"dddd D MMMM YYYY [kl.] HH:mm",lll:"D MMM YYYY HH:mm",llll:"ddd D MMM YYYY HH:mm"},calendar:{sameDay:"[Idag] LT",nextDay:"[Imorgon] LT",lastDay:"[Igår] LT",nextWeek:"[På] dddd LT",lastWeek:"[I] dddd[s] LT",sameElse:"L"},relativeTime:{future:"om %s",past:"för %s sedan",s:"några sekunder",m:"en minut",mm:"%d minuter",h:"en timme",hh:"%d timmar",d:"en dag",dd:"%d dagar",M:"en månad",MM:"%d månader",y:"ett år",yy:"%d år"},dayOfMonthOrdinalParse:/\d{1,2}(e|a)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"e":1===b?"a":2===b?"a":"e";return a+c},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Swahili [sw]
//! author : Fahad Kassim : https://github.com/fadsel
a.defineLocale("sw",{months:"Januari_Februari_Machi_Aprili_Mei_Juni_Julai_Agosti_Septemba_Oktoba_Novemba_Desemba".split("_"),monthsShort:"Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ago_Sep_Okt_Nov_Des".split("_"),weekdays:"Jumapili_Jumatatu_Jumanne_Jumatano_Alhamisi_Ijumaa_Jumamosi".split("_"),weekdaysShort:"Jpl_Jtat_Jnne_Jtan_Alh_Ijm_Jmos".split("_"),weekdaysMin:"J2_J3_J4_J5_Al_Ij_J1".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[leo saa] LT",nextDay:"[kesho saa] LT",nextWeek:"[wiki ijayo] dddd [saat] LT",lastDay:"[jana] LT",lastWeek:"[wiki iliyopita] dddd [saat] LT",sameElse:"L"},relativeTime:{future:"%s baadaye",past:"tokea %s",s:"hivi punde",m:"dakika moja",mm:"dakika %d",h:"saa limoja",hh:"masaa %d",d:"siku moja",dd:"masiku %d",M:"mwezi mmoja",MM:"miezi %d",y:"mwaka mmoja",yy:"miaka %d"},week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Tamil [ta]
//! author : Arjunkumar Krishnamoorthy : https://github.com/tk120404
var Ph={1:"௧",2:"௨",3:"௩",4:"௪",5:"௫",6:"௬",7:"௭",8:"௮",9:"௯",0:"௦"},Qh={"௧":"1","௨":"2","௩":"3","௪":"4","௫":"5","௬":"6","௭":"7","௮":"8","௯":"9","௦":"0"};a.defineLocale("ta",{months:"ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்".split("_"),monthsShort:"ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்".split("_"),weekdays:"ஞாயிற்றுக்கிழமை_திங்கட்கிழமை_செவ்வாய்கிழமை_புதன்கிழமை_வியாழக்கிழமை_வெள்ளிக்கிழமை_சனிக்கிழமை".split("_"),weekdaysShort:"ஞாயிறு_திங்கள்_செவ்வாய்_புதன்_வியாழன்_வெள்ளி_சனி".split("_"),weekdaysMin:"ஞா_தி_செ_பு_வி_வெ_ச".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, HH:mm",LLLL:"dddd, D MMMM YYYY, HH:mm"},calendar:{sameDay:"[இன்று] LT",nextDay:"[நாளை] LT",nextWeek:"dddd, LT",lastDay:"[நேற்று] LT",lastWeek:"[கடந்த வாரம்] dddd, LT",sameElse:"L"},relativeTime:{future:"%s இல்",past:"%s முன்",s:"ஒரு சில விநாடிகள்",m:"ஒரு நிமிடம்",mm:"%d நிமிடங்கள்",h:"ஒரு மணி நேரம்",hh:"%d மணி நேரம்",d:"ஒரு நாள்",dd:"%d நாட்கள்",M:"ஒரு மாதம்",MM:"%d மாதங்கள்",y:"ஒரு வருடம்",yy:"%d ஆண்டுகள்"},dayOfMonthOrdinalParse:/\d{1,2}வது/,ordinal:function(a){return a+"வது"},preparse:function(a){return a.replace(/[௧௨௩௪௫௬௭௮௯௦]/g,function(a){return Qh[a]})},postformat:function(a){return a.replace(/\d/g,function(a){return Ph[a]})},meridiemParse:/யாமம்|வைகறை|காலை|நண்பகல்|எற்பாடு|மாலை/,meridiem:function(a,b,c){return a<2?" யாமம்":a<6?" வைகறை":a<10?" காலை":a<14?" நண்பகல்":a<18?" எற்பாடு":a<22?" மாலை":" யாமம்"},meridiemHour:function(a,b){return 12===a&&(a=0),"யாமம்"===b?a<2?a:a+12:"வைகறை"===b||"காலை"===b?a:"நண்பகல்"===b&&a>=10?a:a+12},week:{dow:0,doy:6}}),
//! moment.js locale configuration
//! locale : Telugu [te]
//! author : Krishna Chaitanya Thota : https://github.com/kcthota
a.defineLocale("te",{months:"జనవరి_ఫిబ్రవరి_మార్చి_ఏప్రిల్_మే_జూన్_జూలై_ఆగస్టు_సెప్టెంబర్_అక్టోబర్_నవంబర్_డిసెంబర్".split("_"),monthsShort:"జన._ఫిబ్ర._మార్చి_ఏప్రి._మే_జూన్_జూలై_ఆగ._సెప్._అక్టో._నవ._డిసె.".split("_"),monthsParseExact:!0,weekdays:"ఆదివారం_సోమవారం_మంగళవారం_బుధవారం_గురువారం_శుక్రవారం_శనివారం".split("_"),weekdaysShort:"ఆది_సోమ_మంగళ_బుధ_గురు_శుక్ర_శని".split("_"),weekdaysMin:"ఆ_సో_మం_బు_గు_శు_శ".split("_"),longDateFormat:{LT:"A h:mm",LTS:"A h:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY, A h:mm",LLLL:"dddd, D MMMM YYYY, A h:mm"},calendar:{sameDay:"[నేడు] LT",nextDay:"[రేపు] LT",nextWeek:"dddd, LT",lastDay:"[నిన్న] LT",lastWeek:"[గత] dddd, LT",sameElse:"L"},relativeTime:{future:"%s లో",past:"%s క్రితం",s:"కొన్ని క్షణాలు",m:"ఒక నిమిషం",mm:"%d నిమిషాలు",h:"ఒక గంట",hh:"%d గంటలు",d:"ఒక రోజు",dd:"%d రోజులు",M:"ఒక నెల",MM:"%d నెలలు",y:"ఒక సంవత్సరం",yy:"%d సంవత్సరాలు"},dayOfMonthOrdinalParse:/\d{1,2}వ/,ordinal:"%dవ",meridiemParse:/రాత్రి|ఉదయం|మధ్యాహ్నం|సాయంత్రం/,meridiemHour:function(a,b){return 12===a&&(a=0),"రాత్రి"===b?a<4?a:a+12:"ఉదయం"===b?a:"మధ్యాహ్నం"===b?a>=10?a:a+12:"సాయంత్రం"===b?a+12:void 0},meridiem:function(a,b,c){return a<4?"రాత్రి":a<10?"ఉదయం":a<17?"మధ్యాహ్నం":a<20?"సాయంత్రం":"రాత్రి"},week:{dow:0,doy:6}}),
//! moment.js locale configuration
//! locale : Tetun Dili (East Timor) [tet]
//! author : Joshua Brooks : https://github.com/joshbrooks
//! author : Onorio De J. Afonso : https://github.com/marobo
a.defineLocale("tet",{months:"Janeiru_Fevereiru_Marsu_Abril_Maiu_Juniu_Juliu_Augustu_Setembru_Outubru_Novembru_Dezembru".split("_"),monthsShort:"Jan_Fev_Mar_Abr_Mai_Jun_Jul_Aug_Set_Out_Nov_Dez".split("_"),weekdays:"Domingu_Segunda_Tersa_Kuarta_Kinta_Sexta_Sabadu".split("_"),weekdaysShort:"Dom_Seg_Ters_Kua_Kint_Sext_Sab".split("_"),weekdaysMin:"Do_Seg_Te_Ku_Ki_Sex_Sa".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Ohin iha] LT",nextDay:"[Aban iha] LT",nextWeek:"dddd [iha] LT",lastDay:"[Horiseik iha] LT",lastWeek:"dddd [semana kotuk] [iha] LT",sameElse:"L"},relativeTime:{future:"iha %s",past:"%s liuba",s:"minutu balun",m:"minutu ida",mm:"minutus %d",h:"horas ida",hh:"horas %d",d:"loron ida",dd:"loron %d",M:"fulan ida",MM:"fulan %d",y:"tinan ida",yy:"tinan %d"},dayOfMonthOrdinalParse:/\d{1,2}(st|nd|rd|th)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c},week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Thai [th]
//! author : Kridsada Thanabulpong : https://github.com/sirn
a.defineLocale("th",{months:"มกราคม_กุมภาพันธ์_มีนาคม_เมษายน_พฤษภาคม_มิถุนายน_กรกฎาคม_สิงหาคม_กันยายน_ตุลาคม_พฤศจิกายน_ธันวาคม".split("_"),monthsShort:"ม.ค._ก.พ._มี.ค._เม.ย._พ.ค._มิ.ย._ก.ค._ส.ค._ก.ย._ต.ค._พ.ย._ธ.ค.".split("_"),monthsParseExact:!0,weekdays:"อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัสบดี_ศุกร์_เสาร์".split("_"),weekdaysShort:"อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัส_ศุกร์_เสาร์".split("_"),weekdaysMin:"อา._จ._อ._พ._พฤ._ศ._ส.".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY เวลา H:mm",LLLL:"วันddddที่ D MMMM YYYY เวลา H:mm"},meridiemParse:/ก่อนเที่ยง|หลังเที่ยง/,isPM:function(a){return"หลังเที่ยง"===a},meridiem:function(a,b,c){return a<12?"ก่อนเที่ยง":"หลังเที่ยง"},calendar:{sameDay:"[วันนี้ เวลา] LT",nextDay:"[พรุ่งนี้ เวลา] LT",nextWeek:"dddd[หน้า เวลา] LT",lastDay:"[เมื่อวานนี้ เวลา] LT",lastWeek:"[วัน]dddd[ที่แล้ว เวลา] LT",sameElse:"L"},relativeTime:{future:"อีก %s",past:"%sที่แล้ว",s:"ไม่กี่วินาที",m:"1 นาที",mm:"%d นาที",h:"1 ชั่วโมง",hh:"%d ชั่วโมง",d:"1 วัน",dd:"%d วัน",M:"1 เดือน",MM:"%d เดือน",y:"1 ปี",yy:"%d ปี"}}),
//! moment.js locale configuration
//! locale : Tagalog (Philippines) [tl-ph]
//! author : Dan Hagman : https://github.com/hagmandan
a.defineLocale("tl-ph",{months:"Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre".split("_"),monthsShort:"Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis".split("_"),weekdays:"Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado".split("_"),weekdaysShort:"Lin_Lun_Mar_Miy_Huw_Biy_Sab".split("_"),weekdaysMin:"Li_Lu_Ma_Mi_Hu_Bi_Sab".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"MM/D/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY HH:mm",LLLL:"dddd, MMMM DD, YYYY HH:mm"},calendar:{sameDay:"LT [ngayong araw]",nextDay:"[Bukas ng] LT",nextWeek:"LT [sa susunod na] dddd",lastDay:"LT [kahapon]",lastWeek:"LT [noong nakaraang] dddd",sameElse:"L"},relativeTime:{future:"sa loob ng %s",past:"%s ang nakalipas",s:"ilang segundo",m:"isang minuto",mm:"%d minuto",h:"isang oras",hh:"%d oras",d:"isang araw",dd:"%d araw",M:"isang buwan",MM:"%d buwan",y:"isang taon",yy:"%d taon"},dayOfMonthOrdinalParse:/\d{1,2}/,ordinal:function(a){return a},week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Klingon [tlh]
//! author : Dominika Kruk : https://github.com/amaranthrose
var Rh="pagh_wa’_cha’_wej_loS_vagh_jav_Soch_chorgh_Hut".split("_");a.defineLocale("tlh",{months:"tera’ jar wa’_tera’ jar cha’_tera’ jar wej_tera’ jar loS_tera’ jar vagh_tera’ jar jav_tera’ jar Soch_tera’ jar chorgh_tera’ jar Hut_tera’ jar wa’maH_tera’ jar wa’maH wa’_tera’ jar wa’maH cha’".split("_"),monthsShort:"jar wa’_jar cha’_jar wej_jar loS_jar vagh_jar jav_jar Soch_jar chorgh_jar Hut_jar wa’maH_jar wa’maH wa’_jar wa’maH cha’".split("_"),monthsParseExact:!0,weekdays:"lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj".split("_"),weekdaysShort:"lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj".split("_"),weekdaysMin:"lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[DaHjaj] LT",nextDay:"[wa’leS] LT",nextWeek:"LLL",lastDay:"[wa’Hu’] LT",lastWeek:"LLL",sameElse:"L"},relativeTime:{future:ie,past:je,s:"puS lup",m:"wa’ tup",mm:ke,h:"wa’ rep",hh:ke,d:"wa’ jaj",dd:ke,M:"wa’ jar",MM:ke,y:"wa’ DIS",yy:ke},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}});
//! moment.js locale configuration
//! locale : Turkish [tr]
//! authors : Erhan Gundogan : https://github.com/erhangundogan,
//!           Burak Yiğit Kaya: https://github.com/BYK
var Sh={1:"'inci",5:"'inci",8:"'inci",70:"'inci",80:"'inci",2:"'nci",7:"'nci",20:"'nci",50:"'nci",3:"'üncü",4:"'üncü",100:"'üncü",6:"'ncı",9:"'uncu",10:"'uncu",30:"'uncu",60:"'ıncı",90:"'ıncı"};a.defineLocale("tr",{months:"Ocak_Şubat_Mart_Nisan_Mayıs_Haziran_Temmuz_Ağustos_Eylül_Ekim_Kasım_Aralık".split("_"),monthsShort:"Oca_Şub_Mar_Nis_May_Haz_Tem_Ağu_Eyl_Eki_Kas_Ara".split("_"),weekdays:"Pazar_Pazartesi_Salı_Çarşamba_Perşembe_Cuma_Cumartesi".split("_"),weekdaysShort:"Paz_Pts_Sal_Çar_Per_Cum_Cts".split("_"),weekdaysMin:"Pz_Pt_Sa_Ça_Pe_Cu_Ct".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[bugün saat] LT",nextDay:"[yarın saat] LT",nextWeek:"[haftaya] dddd [saat] LT",lastDay:"[dün] LT",lastWeek:"[geçen hafta] dddd [saat] LT",sameElse:"L"},relativeTime:{future:"%s sonra",past:"%s önce",s:"birkaç saniye",m:"bir dakika",mm:"%d dakika",h:"bir saat",hh:"%d saat",d:"bir gün",dd:"%d gün",M:"bir ay",MM:"%d ay",y:"bir yıl",yy:"%d yıl"},dayOfMonthOrdinalParse:/\d{1,2}'(inci|nci|üncü|ncı|uncu|ıncı)/,ordinal:function(a){if(0===a)return a+"'ıncı";var b=a%10,c=a%100-b,d=a>=100?100:null;return a+(Sh[b]||Sh[c]||Sh[d])},week:{dow:1,doy:7}}),
//! moment.js locale configuration
//! locale : Talossan [tzl]
//! author : Robin van der Vliet : https://github.com/robin0van0der0v
//! author : Iustì Canun
a.defineLocale("tzl",{months:"Januar_Fevraglh_Març_Avrïu_Mai_Gün_Julia_Guscht_Setemvar_Listopäts_Noemvar_Zecemvar".split("_"),monthsShort:"Jan_Fev_Mar_Avr_Mai_Gün_Jul_Gus_Set_Lis_Noe_Zec".split("_"),weekdays:"Súladi_Lúneçi_Maitzi_Márcuri_Xhúadi_Viénerçi_Sáturi".split("_"),weekdaysShort:"Súl_Lún_Mai_Már_Xhú_Vié_Sát".split("_"),weekdaysMin:"Sú_Lú_Ma_Má_Xh_Vi_Sá".split("_"),longDateFormat:{LT:"HH.mm",LTS:"HH.mm.ss",L:"DD.MM.YYYY",LL:"D. MMMM [dallas] YYYY",LLL:"D. MMMM [dallas] YYYY HH.mm",LLLL:"dddd, [li] D. MMMM [dallas] YYYY HH.mm"},meridiemParse:/d\'o|d\'a/i,isPM:function(a){return"d'o"===a.toLowerCase()},meridiem:function(a,b,c){return a>11?c?"d'o":"D'O":c?"d'a":"D'A"},calendar:{sameDay:"[oxhi à] LT",nextDay:"[demà à] LT",nextWeek:"dddd [à] LT",lastDay:"[ieiri à] LT",lastWeek:"[sür el] dddd [lasteu à] LT",sameElse:"L"},relativeTime:{future:"osprei %s",past:"ja%s",s:me,m:me,mm:me,h:me,hh:me,d:me,dd:me,M:me,MM:me,y:me,yy:me},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}),
//! moment.js locale configuration
//! locale : Central Atlas Tamazight Latin [tzm-latn]
//! author : Abdel Said : https://github.com/abdelsaid
a.defineLocale("tzm-latn",{months:"innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir".split("_"),monthsShort:"innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir".split("_"),weekdays:"asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),weekdaysShort:"asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),weekdaysMin:"asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[asdkh g] LT",nextDay:"[aska g] LT",nextWeek:"dddd [g] LT",lastDay:"[assant g] LT",lastWeek:"dddd [g] LT",sameElse:"L"},relativeTime:{future:"dadkh s yan %s",past:"yan %s",s:"imik",m:"minuḍ",mm:"%d minuḍ",h:"saɛa",hh:"%d tassaɛin",d:"ass",dd:"%d ossan",M:"ayowr",MM:"%d iyyirn",y:"asgas",yy:"%d isgasn"},week:{dow:6,doy:12}}),
//! moment.js locale configuration
//! locale : Central Atlas Tamazight [tzm]
//! author : Abdel Said : https://github.com/abdelsaid
a.defineLocale("tzm",{months:"ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ".split("_"),monthsShort:"ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ".split("_"),weekdays:"ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),weekdaysShort:"ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),weekdaysMin:"ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[ⴰⵙⴷⵅ ⴴ] LT",nextDay:"[ⴰⵙⴽⴰ ⴴ] LT",nextWeek:"dddd [ⴴ] LT",lastDay:"[ⴰⵚⴰⵏⵜ ⴴ] LT",lastWeek:"dddd [ⴴ] LT",sameElse:"L"},relativeTime:{future:"ⴷⴰⴷⵅ ⵙ ⵢⴰⵏ %s",past:"ⵢⴰⵏ %s",s:"ⵉⵎⵉⴽ",m:"ⵎⵉⵏⵓⴺ",mm:"%d ⵎⵉⵏⵓⴺ",h:"ⵙⴰⵄⴰ",hh:"%d ⵜⴰⵙⵙⴰⵄⵉⵏ",d:"ⴰⵙⵙ",dd:"%d oⵙⵙⴰⵏ",M:"ⴰⵢoⵓⵔ",MM:"%d ⵉⵢⵢⵉⵔⵏ",y:"ⴰⵙⴳⴰⵙ",yy:"%d ⵉⵙⴳⴰⵙⵏ"},week:{dow:6,doy:12}}),a.defineLocale("uk",{months:{format:"січня_лютого_березня_квітня_травня_червня_липня_серпня_вересня_жовтня_листопада_грудня".split("_"),standalone:"січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень".split("_")},monthsShort:"січ_лют_бер_квіт_трав_черв_лип_серп_вер_жовт_лист_груд".split("_"),weekdays:pe,weekdaysShort:"нд_пн_вт_ср_чт_пт_сб".split("_"),weekdaysMin:"нд_пн_вт_ср_чт_пт_сб".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY р.",LLL:"D MMMM YYYY р., HH:mm",LLLL:"dddd, D MMMM YYYY р., HH:mm"},calendar:{sameDay:qe("[Сьогодні "),nextDay:qe("[Завтра "),lastDay:qe("[Вчора "),nextWeek:qe("[У] dddd ["),lastWeek:function(){switch(this.day()){case 0:case 3:case 5:case 6:return qe("[Минулої] dddd [").call(this);case 1:case 2:case 4:return qe("[Минулого] dddd [").call(this)}},sameElse:"L"},relativeTime:{future:"за %s",past:"%s тому",s:"декілька секунд",m:oe,mm:oe,h:"годину",hh:oe,d:"день",dd:oe,M:"місяць",MM:oe,y:"рік",yy:oe},meridiemParse:/ночі|ранку|дня|вечора/,isPM:function(a){return/^(дня|вечора)$/.test(a)},meridiem:function(a,b,c){return a<4?"ночі":a<12?"ранку":a<17?"дня":"вечора"},dayOfMonthOrdinalParse:/\d{1,2}-(й|го)/,ordinal:function(a,b){switch(b){case"M":case"d":case"DDD":case"w":case"W":return a+"-й";case"D":return a+"-го";default:return a}},week:{dow:1,doy:7}});
//! moment.js locale configuration
//! locale : Urdu [ur]
//! author : Sawood Alam : https://github.com/ibnesayeed
//! author : Zack : https://github.com/ZackVision
var Th=["جنوری","فروری","مارچ","اپریل","مئی","جون","جولائی","اگست","ستمبر","اکتوبر","نومبر","دسمبر"],Uh=["اتوار","پیر","منگل","بدھ","جمعرات","جمعہ","ہفتہ"];
//! moment.js locale configuration
//! locale : Uzbek Latin [uz-latn]
//! author : Rasulbek Mirzayev : github.com/Rasulbeeek
//! moment.js locale configuration
//! locale : Uzbek [uz]
//! author : Sardor Muminov : https://github.com/muminoff
//! moment.js locale configuration
//! locale : Vietnamese [vi]
//! author : Bang Nguyen : https://github.com/bangnk
//! moment.js locale configuration
//! locale : Pseudo [x-pseudo]
//! author : Andrew Hood : https://github.com/andrewhood125
//! moment.js locale configuration
//! locale : Yoruba Nigeria [yo]
//! author : Atolagbe Abisoye : https://github.com/andela-batolagbe
//! moment.js locale configuration
//! locale : Chinese (China) [zh-cn]
//! author : suupic : https://github.com/suupic
//! author : Zeno Zeng : https://github.com/zenozeng
//! moment.js locale configuration
//! locale : Chinese (Hong Kong) [zh-hk]
//! author : Ben : https://github.com/ben-lin
//! author : Chris Lam : https://github.com/hehachris
//! author : Konstantin : https://github.com/skfd
//! moment.js locale configuration
//! locale : Chinese (Taiwan) [zh-tw]
//! author : Ben : https://github.com/ben-lin
//! author : Chris Lam : https://github.com/hehachris
return a.defineLocale("ur",{months:Th,monthsShort:Th,weekdays:Uh,weekdaysShort:Uh,weekdaysMin:Uh,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd، D MMMM YYYY HH:mm"},meridiemParse:/صبح|شام/,isPM:function(a){return"شام"===a},meridiem:function(a,b,c){return a<12?"صبح":"شام"},calendar:{sameDay:"[آج بوقت] LT",nextDay:"[کل بوقت] LT",nextWeek:"dddd [بوقت] LT",lastDay:"[گذشتہ روز بوقت] LT",lastWeek:"[گذشتہ] dddd [بوقت] LT",sameElse:"L"},relativeTime:{future:"%s بعد",past:"%s قبل",s:"چند سیکنڈ",m:"ایک منٹ",mm:"%d منٹ",h:"ایک گھنٹہ",hh:"%d گھنٹے",d:"ایک دن",dd:"%d دن",M:"ایک ماہ",MM:"%d ماہ",y:"ایک سال",yy:"%d سال"},preparse:function(a){return a.replace(/،/g,",")},postformat:function(a){return a.replace(/,/g,"،")},week:{dow:1,doy:4}}),a.defineLocale("uz-latn",{months:"Yanvar_Fevral_Mart_Aprel_May_Iyun_Iyul_Avgust_Sentabr_Oktabr_Noyabr_Dekabr".split("_"),monthsShort:"Yan_Fev_Mar_Apr_May_Iyun_Iyul_Avg_Sen_Okt_Noy_Dek".split("_"),weekdays:"Yakshanba_Dushanba_Seshanba_Chorshanba_Payshanba_Juma_Shanba".split("_"),weekdaysShort:"Yak_Dush_Sesh_Chor_Pay_Jum_Shan".split("_"),weekdaysMin:"Ya_Du_Se_Cho_Pa_Ju_Sha".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"D MMMM YYYY, dddd HH:mm"},calendar:{sameDay:"[Bugun soat] LT [da]",nextDay:"[Ertaga] LT [da]",nextWeek:"dddd [kuni soat] LT [da]",lastDay:"[Kecha soat] LT [da]",lastWeek:"[O'tgan] dddd [kuni soat] LT [da]",sameElse:"L"},relativeTime:{future:"Yaqin %s ichida",past:"Bir necha %s oldin",s:"soniya",m:"bir daqiqa",mm:"%d daqiqa",h:"bir soat",hh:"%d soat",d:"bir kun",dd:"%d kun",M:"bir oy",MM:"%d oy",y:"bir yil",yy:"%d yil"},week:{dow:1,doy:7}}),a.defineLocale("uz",{months:"январ_феврал_март_апрел_май_июн_июл_август_сентябр_октябр_ноябр_декабр".split("_"),monthsShort:"янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек".split("_"),weekdays:"Якшанба_Душанба_Сешанба_Чоршанба_Пайшанба_Жума_Шанба".split("_"),weekdaysShort:"Якш_Душ_Сеш_Чор_Пай_Жум_Шан".split("_"),weekdaysMin:"Як_Ду_Се_Чо_Па_Жу_Ша".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"D MMMM YYYY, dddd HH:mm"},calendar:{sameDay:"[Бугун соат] LT [да]",nextDay:"[Эртага] LT [да]",nextWeek:"dddd [куни соат] LT [да]",lastDay:"[Кеча соат] LT [да]",lastWeek:"[Утган] dddd [куни соат] LT [да]",sameElse:"L"},relativeTime:{future:"Якин %s ичида",past:"Бир неча %s олдин",s:"фурсат",m:"бир дакика",mm:"%d дакика",h:"бир соат",hh:"%d соат",d:"бир кун",dd:"%d кун",M:"бир ой",MM:"%d ой",y:"бир йил",yy:"%d йил"},week:{dow:1,doy:7}}),a.defineLocale("vi",{months:"tháng 1_tháng 2_tháng 3_tháng 4_tháng 5_tháng 6_tháng 7_tháng 8_tháng 9_tháng 10_tháng 11_tháng 12".split("_"),monthsShort:"Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"),monthsParseExact:!0,weekdays:"chủ nhật_thứ hai_thứ ba_thứ tư_thứ năm_thứ sáu_thứ bảy".split("_"),weekdaysShort:"CN_T2_T3_T4_T5_T6_T7".split("_"),weekdaysMin:"CN_T2_T3_T4_T5_T6_T7".split("_"),weekdaysParseExact:!0,meridiemParse:/sa|ch/i,isPM:function(a){return/^ch$/i.test(a)},meridiem:function(a,b,c){return a<12?c?"sa":"SA":c?"ch":"CH"},longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM [năm] YYYY",LLL:"D MMMM [năm] YYYY HH:mm",LLLL:"dddd, D MMMM [năm] YYYY HH:mm",l:"DD/M/YYYY",ll:"D MMM YYYY",lll:"D MMM YYYY HH:mm",llll:"ddd, D MMM YYYY HH:mm"},calendar:{sameDay:"[Hôm nay lúc] LT",nextDay:"[Ngày mai lúc] LT",nextWeek:"dddd [tuần tới lúc] LT",lastDay:"[Hôm qua lúc] LT",lastWeek:"dddd [tuần rồi lúc] LT",sameElse:"L"},relativeTime:{future:"%s tới",past:"%s trước",s:"vài giây",m:"một phút",mm:"%d phút",h:"một giờ",hh:"%d giờ",d:"một ngày",dd:"%d ngày",M:"một tháng",MM:"%d tháng",y:"một năm",yy:"%d năm"},dayOfMonthOrdinalParse:/\d{1,2}/,ordinal:function(a){return a},week:{dow:1,doy:4}}),a.defineLocale("x-pseudo",{months:"J~áñúá~rý_F~ébrú~árý_~Márc~h_Áp~ríl_~Máý_~Júñé~_Júl~ý_Áú~gúst~_Sép~témb~ér_Ó~ctób~ér_Ñ~óvém~bér_~Décé~mbér".split("_"),monthsShort:"J~áñ_~Féb_~Már_~Ápr_~Máý_~Júñ_~Júl_~Áúg_~Sép_~Óct_~Ñóv_~Déc".split("_"),monthsParseExact:!0,weekdays:"S~úñdá~ý_Mó~ñdáý~_Túé~sdáý~_Wéd~ñésd~áý_T~húrs~dáý_~Fríd~áý_S~átúr~dáý".split("_"),weekdaysShort:"S~úñ_~Móñ_~Túé_~Wéd_~Thú_~Frí_~Sát".split("_"),weekdaysMin:"S~ú_Mó~_Tú_~Wé_T~h_Fr~_Sá".split("_"),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[T~ódá~ý át] LT",nextDay:"[T~ómó~rró~w át] LT",nextWeek:"dddd [át] LT",lastDay:"[Ý~ést~érdá~ý át] LT",lastWeek:"[L~ást] dddd [át] LT",sameElse:"L"},relativeTime:{future:"í~ñ %s",past:"%s á~gó",s:"á ~féw ~sécó~ñds",m:"á ~míñ~úté",mm:"%d m~íñú~tés",h:"á~ñ hó~úr",hh:"%d h~óúrs",d:"á ~dáý",dd:"%d d~áýs",M:"á ~móñ~th",MM:"%d m~óñt~hs",y:"á ~ýéár",yy:"%d ý~éárs"},dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(a){var b=a%10,c=1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c},week:{dow:1,doy:4}}),a.defineLocale("yo",{months:"Sẹ́rẹ́_Èrèlè_Ẹrẹ̀nà_Ìgbé_Èbibi_Òkùdu_Agẹmo_Ògún_Owewe_Ọ̀wàrà_Bélú_Ọ̀pẹ̀̀".split("_"),monthsShort:"Sẹ́r_Èrl_Ẹrn_Ìgb_Èbi_Òkù_Agẹ_Ògú_Owe_Ọ̀wà_Bél_Ọ̀pẹ̀̀".split("_"),weekdays:"Àìkú_Ajé_Ìsẹ́gun_Ọjọ́rú_Ọjọ́bọ_Ẹtì_Àbámẹ́ta".split("_"),weekdaysShort:"Àìk_Ajé_Ìsẹ́_Ọjr_Ọjb_Ẹtì_Àbá".split("_"),weekdaysMin:"Àì_Aj_Ìs_Ọr_Ọb_Ẹt_Àb".split("_"),longDateFormat:{LT:"h:mm A",LTS:"h:mm:ss A",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY h:mm A",LLLL:"dddd, D MMMM YYYY h:mm A"},calendar:{sameDay:"[Ònì ni] LT",nextDay:"[Ọ̀la ni] LT",nextWeek:"dddd [Ọsẹ̀ tón'bọ] [ni] LT",lastDay:"[Àna ni] LT",lastWeek:"dddd [Ọsẹ̀ tólọ́] [ni] LT",sameElse:"L"},relativeTime:{future:"ní %s",past:"%s kọjá",s:"ìsẹjú aayá die",m:"ìsẹjú kan",mm:"ìsẹjú %d",h:"wákati kan",hh:"wákati %d",d:"ọjọ́ kan",dd:"ọjọ́ %d",M:"osù kan",MM:"osù %d",y:"ọdún kan",yy:"ọdún %d"},dayOfMonthOrdinalParse:/ọjọ́\s\d{1,2}/,ordinal:"ọjọ́ %d",week:{dow:1,doy:4}}),a.defineLocale("zh-cn",{months:"一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),monthsShort:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),weekdays:"星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),weekdaysShort:"周日_周一_周二_周三_周四_周五_周六".split("_"),weekdaysMin:"日_一_二_三_四_五_六".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY年MMMD日",LL:"YYYY年MMMD日",LLL:"YYYY年MMMD日Ah点mm分",LLLL:"YYYY年MMMD日ddddAh点mm分",l:"YYYY年MMMD日",ll:"YYYY年MMMD日",lll:"YYYY年MMMD日 HH:mm",llll:"YYYY年MMMD日dddd HH:mm"},meridiemParse:/凌晨|早上|上午|中午|下午|晚上/,meridiemHour:function(a,b){return 12===a&&(a=0),"凌晨"===b||"早上"===b||"上午"===b?a:"下午"===b||"晚上"===b?a+12:a>=11?a:a+12},meridiem:function(a,b,c){var d=100*a+b;return d<600?"凌晨":d<900?"早上":d<1130?"上午":d<1230?"中午":d<1800?"下午":"晚上"},calendar:{sameDay:"[今天]LT",nextDay:"[明天]LT",nextWeek:"[下]ddddLT",lastDay:"[昨天]LT",lastWeek:"[上]ddddLT",sameElse:"L"},dayOfMonthOrdinalParse:/\d{1,2}(日|月|周)/,ordinal:function(a,b){switch(b){case"d":case"D":case"DDD":return a+"日";case"M":return a+"月";case"w":case"W":return a+"周";default:return a}},relativeTime:{future:"%s内",past:"%s前",s:"几秒",m:"1 分钟",mm:"%d 分钟",h:"1 小时",hh:"%d 小时",d:"1 天",dd:"%d 天",M:"1 个月",MM:"%d 个月",y:"1 年",yy:"%d 年"},week:{dow:1,doy:4}}),a.defineLocale("zh-hk",{months:"一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),monthsShort:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),weekdays:"星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),weekdaysShort:"週日_週一_週二_週三_週四_週五_週六".split("_"),weekdaysMin:"日_一_二_三_四_五_六".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY年MMMD日",LL:"YYYY年MMMD日",LLL:"YYYY年MMMD日 HH:mm",LLLL:"YYYY年MMMD日dddd HH:mm",l:"YYYY年MMMD日",ll:"YYYY年MMMD日",lll:"YYYY年MMMD日 HH:mm",llll:"YYYY年MMMD日dddd HH:mm"},meridiemParse:/凌晨|早上|上午|中午|下午|晚上/,meridiemHour:function(a,b){return 12===a&&(a=0),"凌晨"===b||"早上"===b||"上午"===b?a:"中午"===b?a>=11?a:a+12:"下午"===b||"晚上"===b?a+12:void 0},meridiem:function(a,b,c){var d=100*a+b;return d<600?"凌晨":d<900?"早上":d<1130?"上午":d<1230?"中午":d<1800?"下午":"晚上"},calendar:{sameDay:"[今天]LT",nextDay:"[明天]LT",nextWeek:"[下]ddddLT",lastDay:"[昨天]LT",lastWeek:"[上]ddddLT",sameElse:"L"},dayOfMonthOrdinalParse:/\d{1,2}(日|月|週)/,ordinal:function(a,b){switch(b){case"d":case"D":case"DDD":return a+"日";case"M":return a+"月";case"w":case"W":return a+"週";default:return a}},relativeTime:{future:"%s內",past:"%s前",s:"幾秒",m:"1 分鐘",mm:"%d 分鐘",h:"1 小時",hh:"%d 小時",d:"1 天",dd:"%d 天",M:"1 個月",MM:"%d 個月",y:"1 年",yy:"%d 年"}}),a.defineLocale("zh-tw",{months:"一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),monthsShort:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),weekdays:"星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),weekdaysShort:"週日_週一_週二_週三_週四_週五_週六".split("_"),weekdaysMin:"日_一_二_三_四_五_六".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY年MMMD日",LL:"YYYY年MMMD日",LLL:"YYYY年MMMD日 HH:mm",LLLL:"YYYY年MMMD日dddd HH:mm",l:"YYYY年MMMD日",ll:"YYYY年MMMD日",lll:"YYYY年MMMD日 HH:mm",llll:"YYYY年MMMD日dddd HH:mm"},meridiemParse:/凌晨|早上|上午|中午|下午|晚上/,meridiemHour:function(a,b){return 12===a&&(a=0),"凌晨"===b||"早上"===b||"上午"===b?a:"中午"===b?a>=11?a:a+12:"下午"===b||"晚上"===b?a+12:void 0},meridiem:function(a,b,c){var d=100*a+b;return d<600?"凌晨":d<900?"早上":d<1130?"上午":d<1230?"中午":d<1800?"下午":"晚上"},calendar:{sameDay:"[今天]LT",nextDay:"[明天]LT",nextWeek:"[下]ddddLT",lastDay:"[昨天]LT",lastWeek:"[上]ddddLT",sameElse:"L"},dayOfMonthOrdinalParse:/\d{1,2}(日|月|週)/,ordinal:function(a,b){switch(b){case"d":case"D":case"DDD":return a+"日";case"M":return a+"月";case"w":case"W":return a+"週";default:return a}},relativeTime:{future:"%s內",past:"%s前",s:"幾秒",m:"1 分鐘",mm:"%d 分鐘",h:"1 小時",hh:"%d 小時",d:"1 天",dd:"%d 天",M:"1 個月",MM:"%d 個月",y:"1 年",yy:"%d 年"}}),a.locale("en"),a});
/**
 * jVectorMap version 1.2.2
 *
 * Copyright 2011-2013, Kirill Lebedev
 * Licensed under the MIT license.
 *
 */
(function(e){var t={set:{colors:1,values:1,backgroundColor:1,scaleColors:1,normalizeFunction:1,focus:1},get:{selectedRegions:1,selectedMarkers:1,mapObject:1,regionName:1}};e.fn.vectorMap=function(e){var n,r,i,n=this.children(".jvectormap-container").data("mapObject");if(e==="addMap")jvm.WorldMap.maps[arguments[1]]=arguments[2];else{if(!(e!=="set"&&e!=="get"||!t[e][arguments[1]]))return r=arguments[1].charAt(0).toUpperCase()+arguments[1].substr(1),n[e+r].apply(n,Array.prototype.slice.call(arguments,2));e=e||{},e.container=this,n=new jvm.WorldMap(e)}return this}})(jQuery),function(e){function r(t){var n=t||window.event,r=[].slice.call(arguments,1),i=0,s=!0,o=0,u=0;return t=e.event.fix(n),t.type="mousewheel",n.wheelDelta&&(i=n.wheelDelta/120),n.detail&&(i=-n.detail/3),u=i,n.axis!==undefined&&n.axis===n.HORIZONTAL_AXIS&&(u=0,o=-1*i),n.wheelDeltaY!==undefined&&(u=n.wheelDeltaY/120),n.wheelDeltaX!==undefined&&(o=-1*n.wheelDeltaX/120),r.unshift(t,i,o,u),(e.event.dispatch||e.event.handle).apply(this,r)}var t=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks)for(var n=t.length;n;)e.event.fixHooks[t[--n]]=e.event.mouseHooks;e.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var e=t.length;e;)this.addEventListener(t[--e],r,!1);else this.onmousewheel=r},teardown:function(){if(this.removeEventListener)for(var e=t.length;e;)this.removeEventListener(t[--e],r,!1);else this.onmousewheel=null}},e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})}(jQuery);var jvm={inherits:function(e,t){function n(){}n.prototype=t.prototype,e.prototype=new n,e.prototype.constructor=e,e.parentClass=t},mixin:function(e,t){var n;for(n in t.prototype)t.prototype.hasOwnProperty(n)&&(e.prototype[n]=t.prototype[n])},min:function(e){var t=Number.MAX_VALUE,n;if(e instanceof Array)for(n=0;n<e.length;n++)e[n]<t&&(t=e[n]);else for(n in e)e[n]<t&&(t=e[n]);return t},max:function(e){var t=Number.MIN_VALUE,n;if(e instanceof Array)for(n=0;n<e.length;n++)e[n]>t&&(t=e[n]);else for(n in e)e[n]>t&&(t=e[n]);return t},keys:function(e){var t=[],n;for(n in e)t.push(n);return t},values:function(e){var t=[],n,r;for(r=0;r<arguments.length;r++){e=arguments[r];for(n in e)t.push(e[n])}return t}};jvm.$=jQuery,jvm.AbstractElement=function(e,t){this.node=this.createElement(e),this.name=e,this.properties={},t&&this.set(t)},jvm.AbstractElement.prototype.set=function(e,t){var n;if(typeof e=="object")for(n in e)this.properties[n]=e[n],this.applyAttr(n,e[n]);else this.properties[e]=t,this.applyAttr(e,t)},jvm.AbstractElement.prototype.get=function(e){return this.properties[e]},jvm.AbstractElement.prototype.applyAttr=function(e,t){this.node.setAttribute(e,t)},jvm.AbstractElement.prototype.remove=function(){jvm.$(this.node).remove()},jvm.AbstractCanvasElement=function(e,t,n){this.container=e,this.setSize(t,n),this.rootElement=new jvm[this.classPrefix+"GroupElement"],this.node.appendChild(this.rootElement.node),this.container.appendChild(this.node)},jvm.AbstractCanvasElement.prototype.add=function(e,t){t=t||this.rootElement,t.add(e),e.canvas=this},jvm.AbstractCanvasElement.prototype.addPath=function(e,t,n){var r=new jvm[this.classPrefix+"PathElement"](e,t);return this.add(r,n),r},jvm.AbstractCanvasElement.prototype.addCircle=function(e,t,n){var r=new jvm[this.classPrefix+"CircleElement"](e,t);return this.add(r,n),r},jvm.AbstractCanvasElement.prototype.addGroup=function(e){var t=new jvm[this.classPrefix+"GroupElement"];return e?e.node.appendChild(t.node):this.node.appendChild(t.node),t.canvas=this,t},jvm.AbstractShapeElement=function(e,t,n){this.style=n||{},this.style.current={},this.isHovered=!1,this.isSelected=!1,this.updateStyle()},jvm.AbstractShapeElement.prototype.setHovered=function(e){this.isHovered!==e&&(this.isHovered=e,this.updateStyle())},jvm.AbstractShapeElement.prototype.setSelected=function(e){this.isSelected!==e&&(this.isSelected=e,this.updateStyle(),jvm.$(this.node).trigger("selected",[e]))},jvm.AbstractShapeElement.prototype.setStyle=function(e,t){var n={};typeof e=="object"?n=e:n[e]=t,jvm.$.extend(this.style.current,n),this.updateStyle()},jvm.AbstractShapeElement.prototype.updateStyle=function(){var e={};jvm.AbstractShapeElement.mergeStyles(e,this.style.initial),jvm.AbstractShapeElement.mergeStyles(e,this.style.current),this.isHovered&&jvm.AbstractShapeElement.mergeStyles(e,this.style.hover),this.isSelected&&(jvm.AbstractShapeElement.mergeStyles(e,this.style.selected),this.isHovered&&jvm.AbstractShapeElement.mergeStyles(e,this.style.selectedHover)),this.set(e)},jvm.AbstractShapeElement.mergeStyles=function(e,t){var n;t=t||{};for(n in t)t[n]===null?delete e[n]:e[n]=t[n]},jvm.SVGElement=function(e,t){jvm.SVGElement.parentClass.apply(this,arguments)},jvm.inherits(jvm.SVGElement,jvm.AbstractElement),jvm.SVGElement.svgns="http://www.w3.org/2000/svg",jvm.SVGElement.prototype.createElement=function(e){return document.createElementNS(jvm.SVGElement.svgns,e)},jvm.SVGElement.prototype.addClass=function(e){this.node.setAttribute("class",e)},jvm.SVGElement.prototype.getElementCtr=function(e){return jvm["SVG"+e]},jvm.SVGElement.prototype.getBBox=function(){return this.node.getBBox()},jvm.SVGGroupElement=function(){jvm.SVGGroupElement.parentClass.call(this,"g")},jvm.inherits(jvm.SVGGroupElement,jvm.SVGElement),jvm.SVGGroupElement.prototype.add=function(e){this.node.appendChild(e.node)},jvm.SVGCanvasElement=function(e,t,n){this.classPrefix="SVG",jvm.SVGCanvasElement.parentClass.call(this,"svg"),jvm.AbstractCanvasElement.apply(this,arguments)},jvm.inherits(jvm.SVGCanvasElement,jvm.SVGElement),jvm.mixin(jvm.SVGCanvasElement,jvm.AbstractCanvasElement),jvm.SVGCanvasElement.prototype.setSize=function(e,t){this.width=e,this.height=t,this.node.setAttribute("width",e),this.node.setAttribute("height",t)},jvm.SVGCanvasElement.prototype.applyTransformParams=function(e,t,n){this.scale=e,this.transX=t,this.transY=n,this.rootElement.node.setAttribute("transform","scale("+e+") translate("+t+", "+n+")")},jvm.SVGShapeElement=function(e,t,n){jvm.SVGShapeElement.parentClass.call(this,e,t),jvm.AbstractShapeElement.apply(this,arguments)},jvm.inherits(jvm.SVGShapeElement,jvm.SVGElement),jvm.mixin(jvm.SVGShapeElement,jvm.AbstractShapeElement),jvm.SVGPathElement=function(e,t){jvm.SVGPathElement.parentClass.call(this,"path",e,t),this.node.setAttribute("fill-rule","evenodd")},jvm.inherits(jvm.SVGPathElement,jvm.SVGShapeElement),jvm.SVGCircleElement=function(e,t){jvm.SVGCircleElement.parentClass.call(this,"circle",e,t)},jvm.inherits(jvm.SVGCircleElement,jvm.SVGShapeElement),jvm.VMLElement=function(e,t){jvm.VMLElement.VMLInitialized||jvm.VMLElement.initializeVML(),jvm.VMLElement.parentClass.apply(this,arguments)},jvm.inherits(jvm.VMLElement,jvm.AbstractElement),jvm.VMLElement.VMLInitialized=!1,jvm.VMLElement.initializeVML=function(){try{document.namespaces.rvml||document.namespaces.add("rvml","urn:schemas-microsoft-com:vml"),jvm.VMLElement.prototype.createElement=function(e){return document.createElement("<rvml:"+e+' class="rvml">')}}catch(e){jvm.VMLElement.prototype.createElement=function(e){return document.createElement("<"+e+' xmlns="urn:schemas-microsoft.com:vml" class="rvml">')}}document.createStyleSheet().addRule(".rvml","behavior:url(#default#VML)"),jvm.VMLElement.VMLInitialized=!0},jvm.VMLElement.prototype.getElementCtr=function(e){return jvm["VML"+e]},jvm.VMLElement.prototype.addClass=function(e){jvm.$(this.node).addClass(e)},jvm.VMLElement.prototype.applyAttr=function(e,t){this.node[e]=t},jvm.VMLElement.prototype.getBBox=function(){var e=jvm.$(this.node);return{x:e.position().left/this.canvas.scale,y:e.position().top/this.canvas.scale,width:e.width()/this.canvas.scale,height:e.height()/this.canvas.scale}},jvm.VMLGroupElement=function(){jvm.VMLGroupElement.parentClass.call(this,"group"),this.node.style.left="0px",this.node.style.top="0px",this.node.coordorigin="0 0"},jvm.inherits(jvm.VMLGroupElement,jvm.VMLElement),jvm.VMLGroupElement.prototype.add=function(e){this.node.appendChild(e.node)},jvm.VMLCanvasElement=function(e,t,n){this.classPrefix="VML",jvm.VMLCanvasElement.parentClass.call(this,"group"),jvm.AbstractCanvasElement.apply(this,arguments),this.node.style.position="absolute"},jvm.inherits(jvm.VMLCanvasElement,jvm.VMLElement),jvm.mixin(jvm.VMLCanvasElement,jvm.AbstractCanvasElement),jvm.VMLCanvasElement.prototype.setSize=function(e,t){var n,r,i,s;this.width=e,this.height=t,this.node.style.width=e+"px",this.node.style.height=t+"px",this.node.coordsize=e+" "+t,this.node.coordorigin="0 0";if(this.rootElement){n=this.rootElement.node.getElementsByTagName("shape");for(i=0,s=n.length;i<s;i++)n[i].coordsize=e+" "+t,n[i].style.width=e+"px",n[i].style.height=t+"px";r=this.node.getElementsByTagName("group");for(i=0,s=r.length;i<s;i++)r[i].coordsize=e+" "+t,r[i].style.width=e+"px",r[i].style.height=t+"px"}},jvm.VMLCanvasElement.prototype.applyTransformParams=function(e,t,n){this.scale=e,this.transX=t,this.transY=n,this.rootElement.node.coordorigin=this.width-t-this.width/100+","+(this.height-n-this.height/100),this.rootElement.node.coordsize=this.width/e+","+this.height/e},jvm.VMLShapeElement=function(e,t){jvm.VMLShapeElement.parentClass.call(this,e,t),this.fillElement=new jvm.VMLElement("fill"),this.strokeElement=new jvm.VMLElement("stroke"),this.node.appendChild(this.fillElement.node),this.node.appendChild(this.strokeElement.node),this.node.stroked=!1,jvm.AbstractShapeElement.apply(this,arguments)},jvm.inherits(jvm.VMLShapeElement,jvm.VMLElement),jvm.mixin(jvm.VMLShapeElement,jvm.AbstractShapeElement),jvm.VMLShapeElement.prototype.applyAttr=function(e,t){switch(e){case"fill":this.node.fillcolor=t;break;case"fill-opacity":this.fillElement.node.opacity=Math.round(t*100)+"%";break;case"stroke":t==="none"?this.node.stroked=!1:this.node.stroked=!0,this.node.strokecolor=t;break;case"stroke-opacity":this.strokeElement.node.opacity=Math.round(t*100)+"%";break;case"stroke-width":parseInt(t,10)===0?this.node.stroked=!1:this.node.stroked=!0,this.node.strokeweight=t;break;case"d":this.node.path=jvm.VMLPathElement.pathSvgToVml(t);break;default:jvm.VMLShapeElement.parentClass.prototype.applyAttr.apply(this,arguments)}},jvm.VMLPathElement=function(e,t){var n=new jvm.VMLElement("skew");jvm.VMLPathElement.parentClass.call(this,"shape",e,t),this.node.coordorigin="0 0",n.node.on=!0,n.node.matrix="0.01,0,0,0.01,0,0",n.node.offset="0,0",this.node.appendChild(n.node)},jvm.inherits(jvm.VMLPathElement,jvm.VMLShapeElement),jvm.VMLPathElement.prototype.applyAttr=function(e,t){e==="d"?this.node.path=jvm.VMLPathElement.pathSvgToVml(t):jvm.VMLShapeElement.prototype.applyAttr.call(this,e,t)},jvm.VMLPathElement.pathSvgToVml=function(e){var t="",n=0,r=0,i,s;return e=e.replace(/(-?\d+)e(-?\d+)/g,"0"),e.replace(/([MmLlHhVvCcSs])\s*((?:-?\d*(?:\.\d+)?\s*,?\s*)+)/g,function(e,t,o,u){o=o.replace(/(\d)-/g,"$1,-").replace(/^\s+/g,"").replace(/\s+$/g,"").replace(/\s+/g,",").split(","),o[0]||o.shift();for(var a=0,f=o.length;a<f;a++)o[a]=Math.round(100*o[a]);switch(t){case"m":return n+=o[0],r+=o[1],"t"+o.join(",");case"M":return n=o[0],r=o[1],"m"+o.join(",");case"l":return n+=o[0],r+=o[1],"r"+o.join(",");case"L":return n=o[0],r=o[1],"l"+o.join(",");case"h":return n+=o[0],"r"+o[0]+",0";case"H":return n=o[0],"l"+n+","+r;case"v":return r+=o[0],"r0,"+o[0];case"V":return r=o[0],"l"+n+","+r;case"c":return i=n+o[o.length-4],s=r+o[o.length-3],n+=o[o.length-2],r+=o[o.length-1],"v"+o.join(",");case"C":return i=o[o.length-4],s=o[o.length-3],n=o[o.length-2],r=o[o.length-1],"c"+o.join(",");case"s":return o.unshift(r-s),o.unshift(n-i),i=n+o[o.length-4],s=r+o[o.length-3],n+=o[o.length-2],r+=o[o.length-1],"v"+o.join(",");case"S":return o.unshift(r+r-s),o.unshift(n+n-i),i=o[o.length-4],s=o[o.length-3],n=o[o.length-2],r=o[o.length-1],"c"+o.join(",")}return""}).replace(/z/g,"e")},jvm.VMLCircleElement=function(e,t){jvm.VMLCircleElement.parentClass.call(this,"oval",e,t)},jvm.inherits(jvm.VMLCircleElement,jvm.VMLShapeElement),jvm.VMLCircleElement.prototype.applyAttr=function(e,t){switch(e){case"r":this.node.style.width=t*2+"px",this.node.style.height=t*2+"px",this.applyAttr("cx",this.get("cx")||0),this.applyAttr("cy",this.get("cy")||0);break;case"cx":if(!t)return;this.node.style.left=t-(this.get("r")||0)+"px";break;case"cy":if(!t)return;this.node.style.top=t-(this.get("r")||0)+"px";break;default:jvm.VMLCircleElement.parentClass.prototype.applyAttr.call(this,e,t)}},jvm.VectorCanvas=function(e,t,n){return this.mode=window.SVGAngle?"svg":"vml",this.mode=="svg"?this.impl=new jvm.SVGCanvasElement(e,t,n):this.impl=new jvm.VMLCanvasElement(e,t,n),this.impl},jvm.SimpleScale=function(e){this.scale=e},jvm.SimpleScale.prototype.getValue=function(e){return e},jvm.OrdinalScale=function(e){this.scale=e},jvm.OrdinalScale.prototype.getValue=function(e){return this.scale[e]},jvm.NumericScale=function(e,t,n,r){this.scale=[],t=t||"linear",e&&this.setScale(e),t&&this.setNormalizeFunction(t),n&&this.setMin(n),r&&this.setMax(r)},jvm.NumericScale.prototype={setMin:function(e){this.clearMinValue=e,typeof this.normalize=="function"?this.minValue=this.normalize(e):this.minValue=e},setMax:function(e){this.clearMaxValue=e,typeof this.normalize=="function"?this.maxValue=this.normalize(e):this.maxValue=e},setScale:function(e){var t;for(t=0;t<e.length;t++)this.scale[t]=[e[t]]},setNormalizeFunction:function(e){e==="polynomial"?this.normalize=function(e){return Math.pow(e,.2)}:e==="linear"?delete this.normalize:this.normalize=e,this.setMin(this.clearMinValue),this.setMax(this.clearMaxValue)},getValue:function(e){var t=[],n=0,r,i=0,s;typeof this.normalize=="function"&&(e=this.normalize(e));for(i=0;i<this.scale.length-1;i++)r=this.vectorLength(this.vectorSubtract(this.scale[i+1],this.scale[i])),t.push(r),n+=r;s=(this.maxValue-this.minValue)/n;for(i=0;i<t.length;i++)t[i]*=s;i=0,e-=this.minValue;while(e-t[i]>=0)e-=t[i],i++;return i==this.scale.length-1?e=this.vectorToNum(this.scale[i]):e=this.vectorToNum(this.vectorAdd(this.scale[i],this.vectorMult(this.vectorSubtract(this.scale[i+1],this.scale[i]),e/t[i]))),e},vectorToNum:function(e){var t=0,n;for(n=0;n<e.length;n++)t+=Math.round(e[n])*Math.pow(256,e.length-n-1);return t},vectorSubtract:function(e,t){var n=[],r;for(r=0;r<e.length;r++)n[r]=e[r]-t[r];return n},vectorAdd:function(e,t){var n=[],r;for(r=0;r<e.length;r++)n[r]=e[r]+t[r];return n},vectorMult:function(e,t){var n=[],r;for(r=0;r<e.length;r++)n[r]=e[r]*t;return n},vectorLength:function(e){var t=0,n;for(n=0;n<e.length;n++)t+=e[n]*e[n];return Math.sqrt(t)}},jvm.ColorScale=function(e,t,n,r){jvm.ColorScale.parentClass.apply(this,arguments)},jvm.inherits(jvm.ColorScale,jvm.NumericScale),jvm.ColorScale.prototype.setScale=function(e){var t;for(t=0;t<e.length;t++)this.scale[t]=jvm.ColorScale.rgbToArray(e[t])},jvm.ColorScale.prototype.getValue=function(e){return jvm.ColorScale.numToRgb(jvm.ColorScale.parentClass.prototype.getValue.call(this,e))},jvm.ColorScale.arrayToRgb=function(e){var t="#",n,r;for(r=0;r<e.length;r++)n=e[r].toString(16),t+=n.length==1?"0"+n:n;return t},jvm.ColorScale.numToRgb=function(e){e=e.toString(16);while(e.length<6)e="0"+e;return"#"+e},jvm.ColorScale.rgbToArray=function(e){return e=e.substr(1),[parseInt(e.substr(0,2),16),parseInt(e.substr(2,2),16),parseInt(e.substr(4,2),16)]},jvm.DataSeries=function(e,t){var n;e=e||{},e.attribute=e.attribute||"fill",this.elements=t,this.params=e,e.attributes&&this.setAttributes(e.attributes),jvm.$.isArray(e.scale)?(n=e.attribute==="fill"||e.attribute==="stroke"?jvm.ColorScale:jvm.NumericScale,this.scale=new n(e.scale,e.normalizeFunction,e.min,e.max)):e.scale?this.scale=new jvm.OrdinalScale(e.scale):this.scale=new jvm.SimpleScale(e.scale),this.values=e.values||{},this.setValues(this.values)},jvm.DataSeries.prototype={setAttributes:function(e,t){var n=e,r;if(typeof e=="string")this.elements[e]&&this.elements[e].setStyle(this.params.attribute,t);else for(r in n)this.elements[r]&&this.elements[r].element.setStyle(this.params.attribute,n[r])},setValues:function(e){var t=Number.MIN_VALUE,n=Number.MAX_VALUE,r,i,s={};if(this.scale instanceof jvm.OrdinalScale||this.scale instanceof jvm.SimpleScale)for(i in e)e[i]?s[i]=this.scale.getValue(e[i]):s[i]=this.elements[i].element.style.initial[this.params.attribute];else{if(!this.params.min||!this.params.max){for(i in e)r=parseFloat(e[i]),r>t&&(t=e[i]),r<n&&(n=r);this.params.min||this.scale.setMin(n),this.params.max||this.scale.setMax(t),this.params.min=n,this.params.max=t}for(i in e)r=parseFloat(e[i]),isNaN(r)?s[i]=this.elements[i].element.style.initial[this.params.attribute]:s[i]=this.scale.getValue(r)}this.setAttributes(s),jvm.$.extend(this.values,e)},clear:function(){var e,t={};for(e in this.values)this.elements[e]&&(t[e]=this.elements[e].element.style.initial[this.params.attribute]);this.setAttributes(t),this.values={}},setScale:function(e){this.scale.setScale(e),this.values&&this.setValues(this.values)},setNormalizeFunction:function(e){this.scale.setNormalizeFunction(e),this.values&&this.setValues(this.values)}},jvm.Proj={degRad:180/Math.PI,radDeg:Math.PI/180,radius:6381372,sgn:function(e){return e>0?1:e<0?-1:e},mill:function(e,t,n){return{x:this.radius*(t-n)*this.radDeg,y:-this.radius*Math.log(Math.tan((45+.4*e)*this.radDeg))/.8}},mill_inv:function(e,t,n){return{lat:(2.5*Math.atan(Math.exp(.8*t/this.radius))-5*Math.PI/8)*this.degRad,lng:(n*this.radDeg+e/this.radius)*this.degRad}},merc:function(e,t,n){return{x:this.radius*(t-n)*this.radDeg,y:-this.radius*Math.log(Math.tan(Math.PI/4+e*Math.PI/360))}},merc_inv:function(e,t,n){return{lat:(2*Math.atan(Math.exp(t/this.radius))-Math.PI/2)*this.degRad,lng:(n*this.radDeg+e/this.radius)*this.degRad}},aea:function(e,t,n){var r=0,i=n*this.radDeg,s=29.5*this.radDeg,o=45.5*this.radDeg,u=e*this.radDeg,a=t*this.radDeg,f=(Math.sin(s)+Math.sin(o))/2,l=Math.cos(s)*Math.cos(s)+2*f*Math.sin(s),c=f*(a-i),h=Math.sqrt(l-2*f*Math.sin(u))/f,p=Math.sqrt(l-2*f*Math.sin(r))/f;return{x:h*Math.sin(c)*this.radius,y:-(p-h*Math.cos(c))*this.radius}},aea_inv:function(e,t,n){var r=e/this.radius,i=t/this.radius,s=0,o=n*this.radDeg,u=29.5*this.radDeg,a=45.5*this.radDeg,f=(Math.sin(u)+Math.sin(a))/2,l=Math.cos(u)*Math.cos(u)+2*f*Math.sin(u),c=Math.sqrt(l-2*f*Math.sin(s))/f,h=Math.sqrt(r*r+(c-i)*(c-i)),p=Math.atan(r/(c-i));return{lat:Math.asin((l-h*h*f*f)/(2*f))*this.degRad,lng:(o+p/f)*this.degRad}},lcc:function(e,t,n){var r=0,i=n*this.radDeg,s=t*this.radDeg,o=33*this.radDeg,u=45*this.radDeg,a=e*this.radDeg,f=Math.log(Math.cos(o)*(1/Math.cos(u)))/Math.log(Math.tan(Math.PI/4+u/2)*(1/Math.tan(Math.PI/4+o/2))),l=Math.cos(o)*Math.pow(Math.tan(Math.PI/4+o/2),f)/f,c=l*Math.pow(1/Math.tan(Math.PI/4+a/2),f),h=l*Math.pow(1/Math.tan(Math.PI/4+r/2),f);return{x:c*Math.sin(f*(s-i))*this.radius,y:-(h-c*Math.cos(f*(s-i)))*this.radius}},lcc_inv:function(e,t,n){var r=e/this.radius,i=t/this.radius,s=0,o=n*this.radDeg,u=33*this.radDeg,a=45*this.radDeg,f=Math.log(Math.cos(u)*(1/Math.cos(a)))/Math.log(Math.tan(Math.PI/4+a/2)*(1/Math.tan(Math.PI/4+u/2))),l=Math.cos(u)*Math.pow(Math.tan(Math.PI/4+u/2),f)/f,c=l*Math.pow(1/Math.tan(Math.PI/4+s/2),f),h=this.sgn(f)*Math.sqrt(r*r+(c-i)*(c-i)),p=Math.atan(r/(c-i));return{lat:(2*Math.atan(Math.pow(l/h,1/f))-Math.PI/2)*this.degRad,lng:(o+p/f)*this.degRad}}},jvm.WorldMap=function(e){var t=this,n;this.params=jvm.$.extend(!0,{},jvm.WorldMap.defaultParams,e);if(!jvm.WorldMap.maps[this.params.map])throw new Error("Attempt to use map which was not loaded: "+this.params.map);this.mapData=jvm.WorldMap.maps[this.params.map],this.markers={},this.regions={},this.regionsColors={},this.regionsData={},this.container=jvm.$("<div>").css({width:"100%",height:"100%"}).addClass("jvectormap-container"),this.params.container.append(this.container),this.container.data("mapObject",this),this.container.css({position:"relative",overflow:"hidden"}),this.defaultWidth=this.mapData.width,this.defaultHeight=this.mapData.height,this.setBackgroundColor(this.params.backgroundColor),this.onResize=function(){t.setSize()},jvm.$(window).resize(this.onResize);for(n in jvm.WorldMap.apiEvents)this.params[n]&&this.container.bind(jvm.WorldMap.apiEvents[n]+".jvectormap",this.params[n]);this.canvas=new jvm.VectorCanvas(this.container[0],this.width,this.height),"ontouchstart"in window||window.DocumentTouch&&document instanceof DocumentTouch?this.params.bindTouchEvents&&this.bindContainerTouchEvents():this.bindContainerEvents(),this.bindElementEvents(),this.createLabel(),this.params.zoomButtons&&this.bindZoomButtons(),this.createRegions(),this.createMarkers(this.params.markers||{}),this.setSize(),this.params.focusOn&&(typeof this.params.focusOn=="object"?this.setFocus.call(this,this.params.focusOn.scale,this.params.focusOn.x,this.params.focusOn.y):this.setFocus.call(this,this.params.focusOn)),this.params.selectedRegions&&this.setSelectedRegions(this.params.selectedRegions),this.params.selectedMarkers&&this.setSelectedMarkers(this.params.selectedMarkers),this.params.series&&this.createSeries()},jvm.WorldMap.prototype={transX:0,transY:0,scale:1,baseTransX:0,baseTransY:0,baseScale:1,width:0,height:0,setBackgroundColor:function(e){this.container.css("background-color",e)},resize:function(){var e=this.baseScale;this.width/this.height>this.defaultWidth/this.defaultHeight?(this.baseScale=this.height/this.defaultHeight,this.baseTransX=Math.abs(this.width-this.defaultWidth*this.baseScale)/(2*this.baseScale)):(this.baseScale=this.width/this.defaultWidth,this.baseTransY=Math.abs(this.height-this.defaultHeight*this.baseScale)/(2*this.baseScale)),this.scale*=this.baseScale/e,this.transX*=this.baseScale/e,this.transY*=this.baseScale/e},setSize:function(){this.width=this.container.width(),this.height=this.container.height(),this.resize(),this.canvas.setSize(this.width,this.height),this.applyTransform()},reset:function(){var e,t;for(e in this.series)for(t=0;t<this.series[e].length;t++)this.series[e][t].clear();this.scale=this.baseScale,this.transX=this.baseTransX,this.transY=this.baseTransY,this.applyTransform()},applyTransform:function(){var e,t,n,r;this.defaultWidth*this.scale<=this.width?(e=(this.width-this.defaultWidth*this.scale)/(2*this.scale),n=(this.width-this.defaultWidth*this.scale)/(2*this.scale)):(e=0,n=(this.width-this.defaultWidth*this.scale)/this.scale),this.defaultHeight*this.scale<=this.height?(t=(this.height-this.defaultHeight*this.scale)/(2*this.scale),r=(this.height-this.defaultHeight*this.scale)/(2*this.scale)):(t=0,r=(this.height-this.defaultHeight*this.scale)/this.scale),this.transY>t?this.transY=t:this.transY<r&&(this.transY=r),this.transX>e?this.transX=e:this.transX<n&&(this.transX=n),this.canvas.applyTransformParams(this.scale,this.transX,this.transY),this.markers&&this.repositionMarkers(),this.container.trigger("viewportChange",[this.scale/this.baseScale,this.transX,this.transY])},bindContainerEvents:function(){var e=!1,t,n,r=this;this.container.mousemove(function(i){return e&&(r.transX-=(t-i.pageX)/r.scale,r.transY-=(n-i.pageY)/r.scale,r.applyTransform(),t=i.pageX,n=i.pageY),!1}).mousedown(function(r){return e=!0,t=r.pageX,n=r.pageY,!1}),jvm.$("body").mouseup(function(){e=!1}),this.params.zoomOnScroll&&this.container.mousewheel(function(e,t,n,i){var s=jvm.$(r.container).offset(),o=e.pageX-s.left,u=e.pageY-s.top,a=Math.pow(1.3,i);r.label.hide(),r.setScale(r.scale*a,o,u),e.preventDefault()})},bindContainerTouchEvents:function(){var e,t,n=this,r,i,s,o,u,a=function(a){var f=a.originalEvent.touches,l,c,h,p;a.type=="touchstart"&&(u=0),f.length==1?(u==1&&(h=n.transX,p=n.transY,n.transX-=(r-f[0].pageX)/n.scale,n.transY-=(i-f[0].pageY)/n.scale,n.applyTransform(),n.label.hide(),(h!=n.transX||p!=n.transY)&&a.preventDefault()),r=f[0].pageX,i=f[0].pageY):f.length==2&&(u==2?(c=Math.sqrt(Math.pow(f[0].pageX-f[1].pageX,2)+Math.pow(f[0].pageY-f[1].pageY,2))/t,n.setScale(e*c,s,o),n.label.hide(),a.preventDefault()):(l=jvm.$(n.container).offset(),f[0].pageX>f[1].pageX?s=f[1].pageX+(f[0].pageX-f[1].pageX)/2:s=f[0].pageX+(f[1].pageX-f[0].pageX)/2,f[0].pageY>f[1].pageY?o=f[1].pageY+(f[0].pageY-f[1].pageY)/2:o=f[0].pageY+(f[1].pageY-f[0].pageY)/2,s-=l.left,o-=l.top,e=n.scale,t=Math.sqrt(Math.pow(f[0].pageX-f[1].pageX,2)+Math.pow(f[0].pageY-f[1].pageY,2)))),u=f.length};jvm.$(this.container).bind("touchstart",a),jvm.$(this.container).bind("touchmove",a)},bindElementEvents:function(){var e=this,t;this.container.mousemove(function(){t=!0}),this.container.delegate("[class~='jvectormap-element']","mouseover mouseout",function(t){var n=this,r=jvm.$(this).attr("class").baseVal?jvm.$(this).attr("class").baseVal:jvm.$(this).attr("class"),i=r.indexOf("jvectormap-region")===-1?"marker":"region",s=i=="region"?jvm.$(this).attr("data-code"):jvm.$(this).attr("data-index"),o=i=="region"?e.regions[s].element:e.markers[s].element,u=i=="region"?e.mapData.paths[s].name:e.markers[s].config.name||"",a=jvm.$.Event(i+"LabelShow.jvectormap"),f=jvm.$.Event(i+"Over.jvectormap");t.type=="mouseover"?(e.container.trigger(f,[s]),f.isDefaultPrevented()||o.setHovered(!0),e.label.text(u),e.container.trigger(a,[e.label,s]),a.isDefaultPrevented()||(e.label.show(),e.labelWidth=e.label.width(),e.labelHeight=e.label.height())):(o.setHovered(!1),e.label.hide(),e.container.trigger(i+"Out.jvectormap",[s]))}),this.container.delegate("[class~='jvectormap-element']","mousedown",function(e){t=!1}),this.container.delegate("[class~='jvectormap-element']","mouseup",function(n){var r=this,i=jvm.$(this).attr("class").baseVal?jvm.$(this).attr("class").baseVal:jvm.$(this).attr("class"),s=i.indexOf("jvectormap-region")===-1?"marker":"region",o=s=="region"?jvm.$(this).attr("data-code"):jvm.$(this).attr("data-index"),u=jvm.$.Event(s+"Click.jvectormap"),a=s=="region"?e.regions[o].element:e.markers[o].element;if(!t){e.container.trigger(u,[o]);if(s==="region"&&e.params.regionsSelectable||s==="marker"&&e.params.markersSelectable)u.isDefaultPrevented()||(e.params[s+"sSelectableOne"]&&e.clearSelected(s+"s"),a.setSelected(!a.isSelected))}})},bindZoomButtons:function(){var e=this;jvm.$("<div/>").addClass("jvectormap-zoomin").text("+").appendTo(this.container),jvm.$("<div/>").addClass("jvectormap-zoomout").html("&#x2212;").appendTo(this.container),this.container.find(".jvectormap-zoomin").click(function(){e.setScale(e.scale*e.params.zoomStep,e.width/2,e.height/2)}),this.container.find(".jvectormap-zoomout").click(function(){e.setScale(e.scale/e.params.zoomStep,e.width/2,e.height/2)})},createLabel:function(){var e=this;this.label=jvm.$("<div/>").addClass("jvectormap-label").appendTo(jvm.$("body")),this.container.mousemove(function(t){var n=t.pageX-15-e.labelWidth,r=t.pageY-15-e.labelHeight;n<5&&(n=t.pageX+15),r<5&&(r=t.pageY+15),e.label.is(":visible")&&e.label.css({left:n,top:r})})},setScale:function(e,t,n,r){var i,s=jvm.$.Event("zoom.jvectormap");e>this.params.zoomMax*this.baseScale?e=this.params.zoomMax*this.baseScale:e<this.params.zoomMin*this.baseScale&&(e=this.params.zoomMin*this.baseScale),typeof t!="undefined"&&typeof n!="undefined"&&(i=e/this.scale,r?(this.transX=t+this.defaultWidth*(this.width/(this.defaultWidth*e))/2,this.transY=n+this.defaultHeight*(this.height/(this.defaultHeight*e))/2):(this.transX-=(i-1)/e*t,this.transY-=(i-1)/e*n)),this.scale=e,this.applyTransform(),this.container.trigger(s,[e/this.baseScale])},setFocus:function(e,t,n){var r,i,s,o,u;if(jvm.$.isArray(e)||this.regions[e]){jvm.$.isArray(e)?o=e:o=[e];for(u=0;u<o.length;u++)this.regions[o[u]]&&(i=this.regions[o[u]].element.getBBox(),i&&(typeof r=="undefined"?r=i:(s={x:Math.min(r.x,i.x),y:Math.min(r.y,i.y),width:Math.max(r.x+r.width,i.x+i.width)-Math.min(r.x,i.x),height:Math.max(r.y+r.height,i.y+i.height)-Math.min(r.y,i.y)},r=s)));this.setScale(Math.min(this.width/r.width,this.height/r.height),-(r.x+r.width/2),-(r.y+r.height/2),!0)}else e*=this.baseScale,this.setScale(e,-t*this.defaultWidth,-n*this.defaultHeight,!0)},getSelected:function(e){var t,n=[];for(t in this[e])this[e][t].element.isSelected&&n.push(t);return n},getSelectedRegions:function(){return this.getSelected("regions")},getSelectedMarkers:function(){return this.getSelected("markers")},setSelected:function(e,t){var n;typeof t!="object"&&(t=[t]);if(jvm.$.isArray(t))for(n=0;n<t.length;n++)this[e][t[n]].element.setSelected(!0);else for(n in t)this[e][n].element.setSelected(!!t[n])},setSelectedRegions:function(e){this.setSelected("regions",e)},setSelectedMarkers:function(e){this.setSelected("markers",e)},clearSelected:function(e){var t={},n=this.getSelected(e),r;for(r=0;r<n.length;r++)t[n[r]]=!1;this.setSelected(e,t)},clearSelectedRegions:function(){this.clearSelected("regions")},clearSelectedMarkers:function(){this.clearSelected("markers")},getMapObject:function(){return this},getRegionName:function(e){return this.mapData.paths[e].name},createRegions:function(){var e,t,n=this;for(e in this.mapData.paths)t=this.canvas.addPath({d:this.mapData.paths[e].path,"data-code":e},jvm.$.extend(!0,{},this.params.regionStyle)),jvm.$(t.node).bind("selected",function(e,t){n.container.trigger("regionSelected.jvectormap",[jvm.$(this).attr("data-code"),t,n.getSelectedRegions()])}),t.addClass("jvectormap-region jvectormap-element"),this.regions[e]={element:t,config:this.mapData.paths[e]}},createMarkers:function(e){var t,n,r,i,s,o=this;this.markersGroup=this.markersGroup||this.canvas.addGroup();if(jvm.$.isArray(e)){s=e.slice(),e={};for(t=0;t<s.length;t++)e[t]=s[t]}for(t in e)i=e[t]instanceof Array?{latLng:e[t]}:e[t],r=this.getMarkerPosition(i),r!==!1&&(n=this.canvas.addCircle({"data-index":t,cx:r.x,cy:r.y},jvm.$.extend(!0,{},this.params.markerStyle,{initial:i.style||{}}),this.markersGroup),n.addClass("jvectormap-marker jvectormap-element"),jvm.$(n.node).bind("selected",function(e,t){o.container.trigger("markerSelected.jvectormap",[jvm.$(this).attr("data-index"),t,o.getSelectedMarkers()])}),this.markers[t]&&this.removeMarkers([t]),this.markers[t]={element:n,config:i})},repositionMarkers:function(){var e,t;for(e in this.markers)t=this.getMarkerPosition(this.markers[e].config),t!==!1&&this.markers[e].element.setStyle({cx:t.x,cy:t.y})},getMarkerPosition:function(e){return jvm.WorldMap.maps[this.params.map].projection?this.latLngToPoint.apply(this,e.latLng||[0,0]):{x:e.coords[0]*this.scale+this.transX*this.scale,y:e.coords[1]*this.scale+this.transY*this.scale}},addMarker:function(e,t,n){var r={},i=[],s,o,n=n||[];r[e]=t;for(o=0;o<n.length;o++)s={},s[e]=n[o],i.push(s);this.addMarkers(r,i)},addMarkers:function(e,t){var n;t=t||[],this.createMarkers(e);for(n=0;n<t.length;n++)this.series.markers[n].setValues(t[n]||{})},removeMarkers:function(e){var t;for(t=0;t<e.length;t++)this.markers[e[t]].element.remove(),delete this.markers[e[t]]},removeAllMarkers:function(){var e,t=[];for(e in this.markers)t.push(e);this.removeMarkers(t)},latLngToPoint:function(e,t){var n,r=jvm.WorldMap.maps[this.params.map].projection,i=r.centralMeridian,s=this.width-this.baseTransX*2*this.baseScale,o=this.height-this.baseTransY*2*this.baseScale,u,a,f=this.scale/this.baseScale;return t<-180+i&&(t+=360),n=jvm.Proj[r.type](e,t,i),u=this.getInsetForPoint(n.x,n.y),u?(a=u.bbox,n.x=(n.x-a[0].x)/(a[1].x-a[0].x)*u.width*this.scale,n.y=(n.y-a[0].y)/(a[1].y-a[0].y)*u.height*this.scale,{x:n.x+this.transX*this.scale+u.left*this.scale,y:n.y+this.transY*this.scale+u.top*this.scale}):!1},pointToLatLng:function(e,t){var n=jvm.WorldMap.maps[this.params.map].projection,r=n.centralMeridian,i=jvm.WorldMap.maps[this.params.map].insets,s,o,u,a,f;for(s=0;s<i.length;s++){o=i[s],u=o.bbox,a=e-(this.transX*this.scale+o.left*this.scale),f=t-(this.transY*this.scale+o.top*this.scale),a=a/(o.width*this.scale)*(u[1].x-u[0].x)+u[0].x,f=f/(o.height*this.scale)*(u[1].y-u[0].y)+u[0].y;if(a>u[0].x&&a<u[1].x&&f>u[0].y&&f<u[1].y)return jvm.Proj[n.type+"_inv"](a,-f,r)}return!1},getInsetForPoint:function(e,t){var n=jvm.WorldMap.maps[this.params.map].insets,r,i;for(r=0;r<n.length;r++){i=n[r].bbox;if(e>i[0].x&&e<i[1].x&&t>i[0].y&&t<i[1].y)return n[r]}},createSeries:function(){var e,t;this.series={markers:[],regions:[]};for(t in this.params.series)for(e=0;e<this.params.series[t].length;e++)this.series[t][e]=new jvm.DataSeries(this.params.series[t][e],this[t])},remove:function(){this.label.remove(),this.container.remove(),jvm.$(window).unbind("resize",this.onResize)}},jvm.WorldMap.maps={},jvm.WorldMap.defaultParams={map:"world_mill_en",backgroundColor:"#505050",zoomButtons:!0,zoomOnScroll:!0,zoomMax:8,zoomMin:1,zoomStep:1.6,regionsSelectable:!1,markersSelectable:!1,bindTouchEvents:!0,regionStyle:{initial:{fill:"white","fill-opacity":1,stroke:"none","stroke-width":0,"stroke-opacity":1},hover:{"fill-opacity":.8},selected:{fill:"yellow"},selectedHover
:{}},markerStyle:{initial:{fill:"grey",stroke:"#505050","fill-opacity":1,"stroke-width":1,"stroke-opacity":1,r:5},hover:{stroke:"black","stroke-width":2},selected:{fill:"blue"},selectedHover:{}}},jvm.WorldMap.apiEvents={onRegionLabelShow:"regionLabelShow",onRegionOver:"regionOver",onRegionOut:"regionOut",onRegionClick:"regionClick",onRegionSelected:"regionSelected",onMarkerLabelShow:"markerLabelShow",onMarkerOver:"markerOver",onMarkerOut:"markerOut",onMarkerClick:"markerClick",onMarkerSelected:"markerSelected",onViewportChange:"viewportChange"};
$.fn.vectorMap('addMap', 'world_mill_en',{"insets": [{"width": 900.0, "top": 0, "height": 440.7063107441331, "bbox": [{"y": -12671671.123330014, "x": -20004297.151525836}, {"y": 6930392.02513512, "x": 20026572.394749384}], "left": 0}], "paths": {"BD": {"path": "M652.71,228.85l-0.04,1.38l-0.46,-0.21l-0.42,0.3l0.05,0.65l-0.17,-1.37l-0.48,-1.26l-1.08,-1.6l-0.23,-0.13l-2.31,-0.11l-0.31,0.36l0.21,0.98l-0.6,1.11l-0.8,-0.4l-0.37,0.09l-0.23,0.3l-0.54,-0.21l-0.78,-0.19l-0.38,-2.04l-0.83,-1.89l0.4,-1.5l-0.16,-0.35l-1.24,-0.57l0.36,-0.62l1.5,-0.95l0.02,-0.49l-1.62,-1.26l0.64,-1.31l1.7,1.0l0.12,0.04l0.96,0.11l0.19,1.62l0.25,0.26l2.38,0.37l2.32,-0.04l1.06,0.33l-0.92,1.79l-0.97,0.13l-0.23,0.16l-0.77,1.51l0.05,0.35l1.37,1.37l0.5,-0.14l0.35,-1.46l0.24,-0.0l1.24,3.92Z", "name": "Bangladesh"}, "BE": {"path": "M429.28,143.95l1.76,0.25l0.13,-0.01l2.16,-0.64l1.46,1.34l1.26,0.71l-0.23,1.8l-0.44,0.08l-0.24,0.25l-0.2,1.36l-1.8,-1.22l-0.23,-0.05l-1.14,0.23l-1.62,-1.43l-1.15,-1.31l-0.21,-0.1l-0.95,-0.04l-0.21,-0.68l1.66,-0.54Z", "name": "Belgium"}, "BF": {"path": "M413.48,260.21l-1.22,-0.46l-0.13,-0.02l-1.17,0.1l-0.15,0.06l-0.73,0.53l-0.87,-0.41l-0.39,-0.75l-0.13,-0.13l-0.98,-0.48l-0.14,-1.2l0.63,-0.99l0.05,-0.18l-0.05,-0.73l1.9,-2.01l0.08,-0.14l0.35,-1.65l0.49,-0.44l1.05,0.3l0.21,-0.02l1.05,-0.52l0.13,-0.13l0.3,-0.58l1.87,-1.1l0.11,-0.1l0.43,-0.72l2.23,-1.01l1.21,-0.32l0.51,0.4l0.19,0.06l1.25,-0.01l-0.14,0.89l0.01,0.13l0.34,1.16l0.06,0.11l1.35,1.59l0.07,1.13l0.24,0.28l2.64,0.53l-0.05,1.39l-0.42,0.59l-1.11,0.21l-0.22,0.17l-0.46,0.99l-0.69,0.23l-2.12,-0.05l-1.14,-0.2l-0.19,0.03l-0.72,0.36l-1.07,-0.17l-4.35,0.12l-0.29,0.29l-0.06,1.44l0.25,1.45Z", "name": "Burkina Faso"}, "BG": {"path": "M477.63,166.84l0.51,0.9l0.33,0.14l0.9,-0.21l1.91,0.47l3.68,0.16l0.17,-0.05l1.2,-0.75l2.78,-0.67l1.72,1.05l1.02,0.24l-0.97,0.97l-0.91,2.17l0.0,0.24l0.56,1.19l-1.58,-0.3l-0.16,0.01l-2.55,0.95l-0.2,0.28l-0.02,1.23l-1.92,0.24l-1.68,-0.99l-0.27,-0.02l-1.94,0.8l-1.52,-0.07l-0.15,-1.72l-0.12,-0.21l-0.99,-0.76l0.18,-0.18l0.02,-0.39l-0.17,-0.22l0.33,-0.75l0.91,-0.91l0.01,-0.42l-1.16,-1.25l-0.18,-0.89l0.24,-0.27Z", "name": "Bulgaria"}, "BA": {"path": "M468.39,164.66l0.16,0.04l0.43,-0.0l-0.43,0.93l0.06,0.34l1.08,1.06l-0.28,1.09l-0.5,0.13l-0.47,0.28l-0.86,0.74l-0.1,0.16l-0.28,1.29l-1.81,-0.94l-0.9,-1.22l-1.0,-0.73l-1.1,-1.1l-0.55,-0.96l-1.11,-1.3l0.3,-0.75l0.59,0.46l0.42,-0.04l0.46,-0.54l1.0,-0.06l2.11,0.5l1.72,-0.03l1.06,0.64Z", "name": "Bosnia and Herzegovina"}, "BN": {"path": "M707.34,273.57l0.76,-0.72l1.59,-1.03l-0.18,1.93l-0.9,-0.06l-0.28,0.14l-0.31,0.51l-0.68,-0.78Z", "name": "Brunei"}, "BO": {"path": "M263.83,340.79l-0.23,-0.12l-2.86,-0.11l-0.28,0.17l-0.77,1.67l-1.17,-1.51l-0.18,-0.11l-3.28,-0.64l-0.28,0.1l-2.02,2.3l-1.43,0.29l-0.91,-3.35l-1.31,-2.88l0.75,-2.41l-0.09,-0.32l-1.23,-1.03l-0.31,-1.76l-0.05,-0.12l-1.12,-1.6l1.49,-2.62l0.01,-0.28l-1.0,-2.0l0.48,-0.72l0.02,-0.29l-0.37,-0.78l0.87,-1.13l0.06,-0.18l0.05,-2.17l0.12,-1.71l0.5,-0.8l0.01,-0.3l-1.9,-3.58l1.3,0.15l1.34,-0.05l0.23,-0.12l0.51,-0.7l2.12,-0.99l1.31,-0.93l2.81,-0.37l-0.21,1.51l0.01,0.13l0.29,0.91l-0.19,1.64l0.11,0.27l2.72,2.27l0.15,0.07l2.71,0.41l0.92,0.88l0.12,0.07l1.64,0.49l1.0,0.71l0.18,0.06l1.5,-0.02l1.24,0.64l0.1,1.31l0.05,0.14l0.44,0.68l0.02,0.73l-0.44,0.03l-0.27,0.39l0.96,2.99l0.28,0.21l4.43,0.1l-0.28,1.12l0.0,0.15l0.27,1.02l0.15,0.19l1.27,0.67l0.52,1.42l-0.42,1.91l-0.66,1.1l-0.04,0.2l0.21,1.3l-0.19,0.13l-0.01,-0.27l-0.15,-0.24l-2.33,-1.33l-0.14,-0.04l-2.38,-0.03l-4.36,0.76l-0.21,0.16l-1.2,2.29l-0.03,0.13l-0.06,1.37l-0.79,2.53l-0.05,-0.08Z", "name": "Bolivia"}, "JP": {"path": "M781.17,166.78l1.8,0.67l0.28,-0.04l1.38,-1.01l0.43,2.67l-3.44,0.77l-0.18,0.12l-2.04,2.79l-3.71,-1.94l-0.42,0.15l-1.29,3.11l-2.32,0.04l-0.3,-2.63l1.12,-2.1l2.51,-0.16l0.28,-0.25l0.73,-4.22l0.58,-1.9l2.59,2.84l2.0,1.1ZM773.66,187.36l-0.92,2.24l-0.01,0.2l0.4,1.3l-1.18,1.81l-3.06,1.28l-4.35,0.17l-0.19,0.08l-3.4,3.06l-1.36,-0.87l-0.1,-1.95l-0.34,-0.28l-4.35,0.62l-2.99,1.33l-2.87,0.05l-0.28,0.2l0.09,0.33l2.37,1.93l-1.57,4.44l-1.35,0.97l-0.9,-0.79l0.57,-2.32l-0.15,-0.34l-1.5,-0.77l-0.81,-1.53l2.04,-0.75l0.14,-0.1l1.28,-1.72l2.47,-1.43l1.84,-1.92l4.83,-0.82l2.62,0.57l0.33,-0.16l2.45,-4.77l1.38,1.14l0.38,0.0l5.1,-4.02l0.09,-0.11l1.57,-3.57l0.02,-0.16l-0.42,-3.22l0.94,-1.67l2.27,-0.47l1.26,3.82l-0.07,2.23l-2.26,2.86l-0.06,0.19l0.04,2.93ZM757.85,196.18l0.22,0.66l-1.11,1.33l-0.8,-0.7l-0.33,-0.04l-1.28,0.65l-0.14,0.15l-0.54,1.34l-1.17,-0.57l0.02,-1.03l1.2,-1.45l1.24,0.28l0.29,-0.1l0.9,-1.03l1.51,0.5Z", "name": "Japan"}, "BI": {"path": "M494.7,295.83l-0.14,-2.71l-0.04,-0.13l-0.34,-0.62l0.93,0.12l0.3,-0.16l0.67,-1.25l0.9,0.11l0.11,0.76l0.08,0.16l0.46,0.48l0.02,0.56l-0.55,0.48l-0.96,1.29l-0.82,0.82l-0.61,0.07Z", "name": "Burundi"}, "BJ": {"path": "M427.4,268.94l-1.58,0.22l-0.52,-1.45l0.11,-5.73l-0.08,-0.21l-0.43,-0.44l-0.09,-1.13l-0.09,-0.19l-1.52,-1.52l0.24,-1.01l0.7,-0.23l0.18,-0.16l0.45,-0.97l1.07,-0.21l0.19,-0.12l0.53,-0.73l0.73,-0.65l0.68,-0.0l1.69,1.3l-0.08,0.67l0.02,0.14l0.52,1.38l-0.44,0.9l-0.01,0.24l0.2,0.52l-1.1,1.42l-0.76,0.76l-0.08,0.13l-0.47,1.59l0.05,1.69l-0.13,3.79Z", "name": "Benin"}, "BT": {"path": "M650.38,213.78l0.88,0.75l-0.13,1.24l-1.77,0.07l-2.1,-0.18l-1.57,0.4l-2.02,-0.91l-0.02,-0.24l1.54,-1.87l1.18,-0.6l1.67,0.59l1.32,0.08l1.01,0.67Z", "name": "Bhutan"}, "JM": {"path": "M226.67,238.37l1.64,0.23l1.2,0.56l0.11,0.19l-1.25,0.03l-0.14,0.04l-0.65,0.37l-1.24,-0.37l-1.17,-0.77l0.11,-0.22l0.86,-0.15l0.52,0.08Z", "name": "Jamaica"}, "BW": {"path": "M484.91,331.96l0.53,0.52l0.82,1.53l2.83,2.86l0.14,0.08l0.85,0.22l0.03,0.81l0.74,1.66l0.21,0.17l1.87,0.39l1.17,0.87l-3.13,1.71l-2.3,2.01l-0.07,0.1l-0.82,1.74l-0.66,0.88l-1.24,0.19l-0.24,0.2l-0.65,1.98l-1.4,0.55l-1.9,-0.12l-1.2,-0.74l-1.06,-0.32l-0.22,0.02l-1.22,0.62l-0.14,0.14l-0.58,1.21l-1.16,0.79l-1.18,1.13l-1.5,0.23l-0.4,-0.68l0.22,-1.53l-0.04,-0.19l-1.48,-2.54l-0.11,-0.11l-0.53,-0.31l-0.0,-7.25l2.18,-0.08l0.29,-0.3l0.07,-9.0l1.63,-0.08l3.69,-0.86l0.84,0.93l0.38,0.05l1.53,-0.97l0.79,-0.03l1.3,-0.53l0.23,0.1l0.92,1.96Z", "name": "Botswana"}, "BR": {"path": "M259.49,274.87l1.42,0.25l1.97,0.62l0.28,-0.05l0.67,-0.55l1.76,-0.38l2.8,-0.94l0.12,-0.08l0.92,-0.96l0.05,-0.33l-0.15,-0.32l0.73,-0.06l0.36,0.35l-0.27,0.93l0.17,0.36l0.76,0.34l0.44,0.9l-0.58,0.73l-0.06,0.13l-0.4,2.13l0.03,0.19l0.62,1.22l0.17,1.11l0.11,0.19l1.54,1.18l0.15,0.06l1.23,0.12l0.29,-0.15l0.2,-0.36l0.71,-0.11l1.13,-0.44l0.79,-0.63l1.25,0.19l0.65,-0.08l1.32,0.2l0.32,-0.18l0.23,-0.51l-0.05,-0.31l-0.31,-0.37l0.11,-0.31l0.75,0.17l0.13,0.0l1.1,-0.24l1.34,0.5l1.08,0.51l0.33,-0.05l0.67,-0.58l0.27,0.05l0.28,0.57l0.31,0.17l1.2,-0.18l0.17,-0.08l1.03,-1.05l0.76,-1.82l1.39,-2.16l0.49,-0.07l0.52,1.17l1.4,4.37l0.2,0.2l1.14,0.35l0.05,1.39l-1.8,1.97l0.01,0.42l0.78,0.75l0.18,0.08l4.16,0.37l0.08,2.25l0.5,0.22l1.78,-1.54l2.98,0.85l4.07,1.5l1.07,1.28l-0.37,1.23l0.36,0.38l2.83,-0.75l4.8,1.3l3.75,-0.09l3.6,2.02l3.27,2.84l1.93,0.72l2.13,0.11l0.76,0.66l1.22,4.56l-0.96,4.03l-1.22,1.58l-3.52,3.51l-1.63,2.91l-1.75,2.09l-0.5,0.04l-0.26,0.19l-0.72,1.99l0.18,4.76l-0.95,5.56l-0.74,0.96l-0.06,0.15l-0.43,3.39l-2.49,3.34l-0.06,0.13l-0.4,2.56l-1.9,1.07l-0.13,0.16l-0.51,1.38l-2.59,0.0l-3.94,1.01l-1.82,1.19l-2.85,0.81l-3.01,2.17l-2.12,2.65l-0.06,0.13l-0.36,2.0l0.01,0.13l0.4,1.42l-0.45,2.63l-0.53,1.23l-1.76,1.53l-2.76,4.79l-2.16,2.15l-1.69,1.29l-0.09,0.12l-1.12,2.6l-1.3,1.26l-0.45,-1.02l0.99,-1.18l0.01,-0.37l-1.5,-1.95l-1.98,-1.54l-2.58,-1.77l-0.2,-0.05l-0.81,0.07l-2.42,-2.05l-0.25,-0.07l-0.77,0.14l2.75,-3.07l2.8,-2.61l1.67,-1.09l2.11,-1.49l0.13,-0.24l0.05,-2.15l-0.07,-0.2l-1.26,-1.54l-0.35,-0.09l-0.64,0.27l0.3,-0.95l0.34,-1.57l0.01,-1.52l-0.16,-0.26l-0.9,-0.48l-0.27,-0.01l-0.86,0.39l-0.65,-0.08l-0.23,-0.8l-0.23,-2.39l-0.04,-0.12l-0.47,-0.79l-0.14,-0.12l-1.69,-0.71l-0.25,0.01l-0.93,0.47l-2.29,-0.44l0.15,-3.3l-0.03,-0.15l-0.62,-1.22l0.57,-0.39l0.13,-0.3l-0.22,-1.37l0.67,-1.13l0.44,-2.04l-0.01,-0.17l-0.59,-1.61l-0.14,-0.16l-1.25,-0.66l-0.22,-0.82l0.35,-1.41l-0.28,-0.37l-4.59,-0.1l-0.78,-2.41l0.34,-0.02l0.28,-0.31l-0.03,-1.1l-0.05,-0.16l-0.45,-0.68l-0.1,-1.4l-0.16,-0.24l-1.45,-0.76l-0.14,-0.03l-1.48,0.02l-1.04,-0.73l-1.62,-0.48l-0.93,-0.9l-0.16,-0.08l-2.72,-0.41l-2.53,-2.12l0.18,-1.54l-0.01,-0.13l-0.29,-0.91l0.26,-1.83l-0.34,-0.34l-3.28,0.43l-0.14,0.05l-1.3,0.93l-2.16,1.01l-0.12,0.09l-0.47,0.65l-1.12,0.05l-1.84,-0.21l-0.12,0.01l-1.33,0.41l-0.82,-0.21l0.16,-3.6l-0.48,-0.26l-1.97,1.43l-1.96,-0.06l-0.86,-1.23l-0.22,-0.13l-1.23,-0.11l0.34,-0.69l-0.05,-0.33l-1.36,-1.5l-0.92,-2.0l0.45,-0.32l0.13,-0.25l-0.0,-0.87l1.34,-0.64l0.17,-0.32l-0.23,-1.23l0.56,-0.77l0.05,-0.13l0.16,-1.03l2.7,-1.61l2.01,-0.47l0.16,-0.09l0.24,-0.27l2.11,0.11l0.31,-0.25l1.13,-6.87l0.06,-1.12l-0.4,-1.53l-0.1,-0.15l-1.0,-0.82l0.01,-1.45l1.08,-0.32l0.39,0.2l0.44,-0.24l0.08,-0.96l-0.25,-0.32l-1.22,-0.22l-0.02,-1.01l4.57,0.05l0.22,-0.09l0.6,-0.63l0.44,0.5l0.47,1.42l0.45,0.16l0.27,-0.18l1.21,1.16l0.23,0.08l1.95,-0.16l0.23,-0.14l0.43,-0.67l1.76,-0.55l1.05,-0.42l0.18,-0.2l0.25,-0.92l1.65,-0.66l0.18,-0.35l-0.14,-0.53l-0.26,-0.22l-1.91,-0.19l-0.29,-1.33l0.1,-1.64l-0.15,-0.28l-0.44,-0.25Z", "name": "Brazil"}, "BS": {"path": "M227.51,216.69l0.3,0.18l-0.24,1.07l0.03,-1.04l-0.09,-0.21ZM226.5,224.03l-0.13,0.03l-0.54,-1.3l-0.09,-0.12l-0.78,-0.64l0.4,-1.26l0.33,0.05l0.79,2.0l0.01,1.24ZM225.76,216.5l-2.16,0.34l-0.07,-0.41l0.85,-0.16l1.36,0.07l0.02,0.16Z", "name": "The Bahamas"}, "BY": {"path": "M480.08,135.28l2.09,0.02l0.13,-0.03l2.72,-1.3l0.16,-0.19l0.55,-1.83l1.94,-1.06l0.15,-0.31l-0.2,-1.33l1.33,-0.52l2.58,-1.3l2.39,0.8l0.3,0.75l0.37,0.17l1.22,-0.39l2.18,0.75l0.2,1.36l-0.48,0.85l0.01,0.32l1.57,2.26l0.92,0.6l-0.1,0.41l0.19,0.35l1.61,0.57l0.48,0.6l-0.64,0.49l-1.91,-0.11l-0.18,0.05l-0.48,0.32l-0.1,0.39l0.57,1.1l0.51,1.78l-1.79,0.17l-0.18,0.08l-0.77,0.73l-0.09,0.19l-0.13,1.31l-0.75,-0.22l-2.11,0.15l-0.56,-0.66l-0.39,-0.06l-0.8,0.49l-0.79,-0.4l-0.13,-0.03l-1.94,-0.07l-2.76,-0.79l-2.58,-0.27l-1.98,0.07l-0.15,0.05l-1.31,0.86l-0.8,0.09l-0.04,-1.16l-0.03,-0.12l-0.63,-1.28l1.22,-0.56l0.17,-0.27l0.01,-1.35l-0.04,-0.15l-0.66,-1.24l-0.08,-1.12Z", "name": "Belarus"}, "BZ": {"path": "M198.03,239.7l0.28,0.19l0.43,-0.1l0.82,-1.42l0.0,0.07l0.29,0.29l0.16,0.0l-0.02,0.35l-0.39,1.08l0.02,0.25l0.16,0.29l-0.23,0.8l0.04,0.24l0.09,0.14l-0.25,1.12l-0.38,0.53l-0.33,0.06l-0.21,0.15l-0.41,0.74l-0.25,0.0l0.17,-2.58l0.01,-2.2Z", "name": "Belize"}, "RU": {"path": "M688.57,38.85l0.63,2.39l0.44,0.19l2.22,-1.23l7.18,0.07l5.54,2.49l1.85,1.77l-0.55,2.34l-2.64,1.42l-6.57,2.76l-1.95,1.5l0.12,0.53l3.09,0.68l3.69,1.23l0.21,-0.01l1.98,-0.81l1.16,2.84l0.5,0.08l1.03,-1.18l3.86,-0.74l7.79,0.78l0.56,2.05l0.27,0.22l10.47,0.71l0.32,-0.29l0.13,-3.34l4.98,0.8l3.96,-0.02l3.88,2.43l1.06,2.79l-1.38,1.83l0.01,0.38l3.15,3.64l0.1,0.08l3.94,1.86l0.4,-0.14l2.28,-4.56l3.75,1.94l0.22,0.02l4.18,-1.22l4.76,1.4l0.26,-0.04l1.74,-1.23l3.98,0.63l0.32,-0.41l-1.71,-4.1l3.0,-1.86l22.39,3.04l2.06,2.67l0.1,0.08l6.55,3.51l0.17,0.03l10.08,-0.86l4.86,0.73l1.91,1.72l-0.29,3.13l0.18,0.31l3.08,1.26l0.19,0.01l3.32,-0.9l4.37,-0.11l4.78,0.87l4.61,-0.48l4.26,3.82l0.32,0.05l3.1,-1.4l0.12,-0.45l-1.91,-2.67l0.92,-1.64l7.78,1.22l5.22,-0.26l7.12,2.1l9.6,5.22l6.4,4.15l-0.2,2.44l0.14,0.28l1.69,1.04l0.45,-0.31l-0.51,-2.66l6.31,0.58l4.52,3.61l-2.1,1.52l-4.02,0.42l-0.27,0.29l-0.06,3.83l-0.81,0.67l-2.14,-0.11l-1.91,-1.39l-3.19,-1.13l-0.51,-1.63l-0.21,-0.2l-2.54,-0.67l-0.13,-0.0l-2.69,0.5l-1.12,-1.19l0.48,-1.36l-0.38,-0.39l-3.0,0.98l-0.17,0.44l1.02,1.76l-1.27,1.55l-3.09,1.71l-3.15,-0.29l-0.3,0.18l0.07,0.34l2.22,2.1l1.47,3.22l1.15,1.09l0.25,1.41l-0.48,0.76l-4.47,-0.81l-0.17,0.02l-6.97,2.9l-2.2,0.44l-0.11,0.05l-3.83,2.68l-3.63,2.32l-0.1,0.11l-0.76,1.4l-3.3,-2.4l-0.3,-0.03l-6.31,2.85l-0.99,-1.21l-0.4,-0.06l-2.32,1.54l-3.23,-0.49l-0.33,0.2l-0.79,2.39l-2.97,3.51l-0.07,0.21l0.09,1.47l0.22,0.27l2.62,0.74l-0.3,4.7l-2.06,0.12l-0.26,0.2l-1.07,2.94l0.04,0.27l0.83,1.19l-4.03,1.63l-0.18,0.21l-0.83,3.72l-3.55,0.79l-0.23,0.23l-0.73,3.32l-3.22,2.76l-0.76,-1.88l-1.07,-4.88l-1.39,-7.59l1.17,-4.76l2.05,-2.08l0.09,-0.19l0.11,-1.46l3.67,-0.77l0.15,-0.08l4.47,-4.61l4.29,-3.82l4.48,-3.01l0.11,-0.14l2.01,-5.43l-0.31,-0.4l-3.04,0.33l-0.24,0.17l-1.47,3.11l-5.98,3.94l-1.91,-4.36l-0.33,-0.17l-6.46,1.3l-0.15,0.08l-6.27,6.33l-0.01,0.41l1.7,1.87l-5.04,0.87l-3.51,0.34l0.16,-2.32l-0.26,-0.32l-3.89,-0.56l-0.19,0.04l-3.02,1.77l-7.63,-0.63l-8.24,1.1l-0.16,0.07l-8.11,7.09l-9.6,8.31l0.16,0.52l3.79,0.42l1.16,2.03l0.17,0.14l2.43,0.76l0.31,-0.08l1.5,-1.61l2.49,0.2l3.46,3.6l0.08,2.67l-1.91,3.26l-0.04,0.14l-0.21,3.91l-1.11,5.09l-3.73,4.55l-0.87,2.21l-6.73,7.14l-1.59,1.77l-3.23,1.72l-1.38,0.03l-1.48,-1.39l-0.37,-0.03l-3.36,2.22l-0.11,0.14l-0.16,0.42l-0.01,-1.09l1.0,-0.06l0.28,-0.27l0.36,-3.6l-0.61,-2.51l1.85,-0.94l2.94,0.53l0.32,-0.15l1.71,-3.1l0.84,-3.38l0.97,-1.18l1.32,-2.88l-0.34,-0.42l-4.14,0.95l-2.18,1.25l-3.51,-0.0l-0.95,-2.81l-0.1,-0.14l-2.97,-2.3l-0.11,-0.05l-4.19,-1.0l-0.89,-3.08l-0.87,-2.03l-0.95,-1.46l-1.54,-3.37l-0.12,-0.14l-2.27,-1.28l-3.83,-1.02l-3.37,0.1l-3.11,0.61l-0.13,0.06l-2.07,1.69l0.04,0.49l1.23,0.72l0.03,1.53l-1.34,1.05l-2.26,3.51l-0.05,0.17l0.02,1.27l-3.25,1.9l-2.87,-1.17l-0.14,-0.02l-2.86,0.26l-1.22,-1.02l-0.12,-0.06l-1.5,-0.35l-0.23,0.04l-3.62,2.27l-3.24,0.53l-2.28,0.79l-3.08,-0.51l-2.24,0.03l-1.49,-1.61l-2.45,-1.57l-0.11,-0.04l-2.6,-0.43l-3.17,0.43l-2.31,0.59l-3.31,-1.28l-0.45,-2.31l-0.21,-0.23l-2.94,-0.85l-2.26,-0.39l-2.77,-1.36l-0.37,0.09l-2.59,3.45l-0.03,0.32l0.91,1.74l-2.15,2.01l-3.47,-0.79l-2.44,-0.12l-1.59,-1.46l-0.2,-0.08l-2.55,-0.05l-2.12,-0.98l-0.24,-0.01l-3.85,1.57l-4.74,2.79l-2.59,0.55l-0.79,0.21l-1.21,-1.81l-0.29,-0.13l-3.05,0.41l-0.96,-1.25l-0.14,-0.1l-1.65,-0.6l-1.15,-1.82l-0.13,-0.12l-1.38,-0.6l-0.19,-0.02l-3.49,0.82l-3.35,-1.85l-0.38,0.08l-1.08,1.4l-5.36,-8.17l-3.02,-2.52l0.72,-0.85l0.01,-0.38l-0.37,-0.08l-6.22,3.21l-1.98,0.16l0.17,-1.51l-0.2,-0.31l-3.22,-1.17l-0.19,-0.0l-2.3,0.74l-0.72,-3.27l-0.24,-0.23l-4.5,-0.75l-0.21,0.04l-2.2,1.42l-6.21,1.27l-0.11,0.05l-1.16,0.81l-9.3,1.19l-0.18,0.09l-1.15,1.17l-0.02,0.39l1.56,2.01l-2.02,0.74l-0.16,0.42l0.35,0.68l-2.18,1.49l0.02,0.51l3.83,2.16l-0.45,1.13l-3.31,-0.13l-0.25,0.12l-0.57,0.77l-2.97,-1.59l-0.15,-0.04l-3.97,0.07l-0.13,0.03l-2.53,1.32l-2.84,-1.28l-5.52,-2.3l-0.12,-0.02l-3.91,0.09l-0.16,0.05l-5.17,3.6l-0.13,0.21l-0.25,1.89l-2.17,-1.6l-0.44,0.1l-2.0,3.59l0.06,0.37l0.55,0.5l-1.32,2.23l0.04,0.36l2.13,2.17l0.23,0.09l1.7,-0.08l1.42,1.89l-0.23,1.5l0.19,0.32l0.94,0.38l-0.89,1.44l-2.3,0.49l-0.17,0.11l-2.49,3.2l0.0,0.37l2.2,2.81l-0.23,1.93l0.06,0.22l2.56,3.32l-1.27,1.02l-0.4,0.66l-0.8,-0.15l-1.65,-1.75l-0.18,-0.09l-0.66,-0.09l-1.45,-0.64l-0.72,-1.16l-0.18,-0.13l-2.34,-0.63l-0.17,0.0l-1.32,0.41l-0.31,-0.4l-0.12,-0.09l-3.49,-1.48l-3.67,-0.49l-2.1,-0.52l-0.3,0.1l-0.12,0.14l-2.96,-2.4l-2.89,-1.19l-1.69,-1.42l1.27,-0.35l0.16,-0.1l2.08,-2.61l-0.04,-0.41l-1.02,-0.9l3.21,-1.12l0.2,-0.31l-0.07,-0.69l-0.37,-0.26l-1.86,0.42l0.05,-0.86l1.11,-0.76l2.35,-0.23l0.25,-0.19l0.39,-1.07l0.0,-0.19l-0.51,-1.64l0.95,-1.58l0.04,-0.16l-0.03,-0.95l-0.22,-0.28l-3.69,-1.06l-1.43,0.02l-1.45,-1.44l-0.29,-0.08l-1.83,0.49l-2.88,-1.04l0.04,-0.42l-0.04,-0.18l-0.89,-1.43l-0.23,-0.14l-1.77,-0.14l-0.13,-0.66l0.52,-0.56l0.01,-0.4l-1.6,-1.9l-0.27,-0.1l-2.55,0.32l-0.71,-0.16l-0.3,0.1l-0.53,0.63l-0.58,-0.08l-0.56,-1.97l-0.48,-0.94l0.17,-0.11l1.92,0.11l0.2,-0.06l0.97,-0.74l0.05,-0.42l-0.72,-0.91l-0.13,-0.1l-1.43,-0.51l0.09,-0.36l-0.13,-0.33l-0.97,-0.59l-1.43,-2.06l0.44,-0.77l0.04,-0.19l-0.25,-1.64l-0.2,-0.24l-2.45,-0.84l-0.19,-0.0l-1.05,0.34l-0.25,-0.62l-0.18,-0.17l-2.5,-0.84l-0.74,-1.93l-0.21,-1.7l-0.13,-0.21l-0.92,-0.63l0.83,-0.89l0.07,-0.27l-0.71,-3.26l1.69,-2.01l0.03,-0.34l-0.24,-0.41l2.63,-1.9l-0.01,-0.49l-2.31,-1.57l5.08,-4.61l2.33,-2.24l1.01,-2.08l-0.09,-0.37l-3.52,-2.56l0.94,-2.38l-0.04,-0.29l-2.14,-2.86l1.61,-3.35l-0.01,-0.29l-2.81,-4.58l2.19,-3.04l-0.06,-0.42l-3.7,-2.76l0.32,-2.67l1.87,-0.38l4.26,-1.77l2.46,-1.47l3.96,2.58l0.12,0.05l6.81,1.04l9.37,4.87l1.81,1.92l0.15,2.55l-2.61,2.06l-3.95,1.07l-11.1,-3.15l-0.17,0.0l-1.84,0.53l-0.1,0.53l3.97,2.97l0.15,1.77l0.16,4.14l0.19,0.27l3.21,1.22l1.94,1.03l0.44,-0.22l0.32,-1.94l-0.07,-0.25l-1.32,-1.52l1.25,-1.2l5.87,2.45l0.24,-0.01l2.11,-0.98l0.13,-0.42l-1.55,-2.75l5.52,-3.84l2.13,0.22l2.28,1.42l0.43,-0.12l1.46,-2.87l-0.04,-0.33l-1.97,-2.37l1.14,-2.38l-0.02,-0.3l-1.42,-2.07l6.15,1.22l1.14,1.92l-2.74,0.46l-0.25,0.3l0.02,2.36l0.12,0.24l1.97,1.44l0.25,0.05l3.87,-0.91l0.22,-0.23l0.58,-2.55l5.09,-1.98l8.67,-3.69l1.22,0.14l-2.06,2.2l0.18,0.5l3.11,0.45l0.23,-0.07l1.71,-1.41l4.59,-0.12l0.12,-0.03l3.53,-1.72l2.7,2.48l0.42,-0.01l2.85,-2.88l-0.0,-0.43l-2.42,-2.35l1.0,-1.13l7.2,1.31l3.42,1.36l9.06,4.97l0.39,-0.08l1.67,-2.27l-0.04,-0.4l-2.46,-2.23l-0.06,-0.82l-0.26,-0.27l-2.64,-0.38l0.69,-1.76l0.0,-0.22l-1.32,-3.47l-0.07,-1.27l4.52,-4.09l0.08,-0.11l1.6,-4.18l1.67,-0.84l6.33,1.2l0.46,2.31l-2.31,3.67l0.05,0.38l1.49,1.41l0.77,3.04l-0.56,6.05l0.09,0.24l2.62,2.54l-0.99,2.65l-4.87,5.96l0.17,0.48l2.86,0.61l0.31,-0.13l0.94,-1.42l2.67,-1.04l0.18,-0.19l0.64,-2.01l2.11,-1.98l0.05,-0.37l-1.38,-2.32l1.11,-2.74l-0.24,-0.41l-2.53,-0.33l-0.53,-2.16l1.96,-4.42l-0.05,-0.32l-3.03,-3.48l4.21,-2.94l0.12,-0.3l-0.52,-3.04l0.72,-0.06l1.18,2.35l-0.97,4.39l0.2,0.35l2.68,0.84l0.37,-0.38l-1.05,-3.07l3.89,-1.71l5.05,-0.24l4.55,2.62l0.36,-0.05l0.05,-0.36l-2.19,-3.84l-0.23,-4.78l4.07,-0.92l5.98,0.21l5.47,-0.64l0.2,-0.48l-1.88,-2.37l2.65,-2.99l2.75,-0.13l0.12,-0.03l4.82,-2.48l6.56,-0.67l0.23,-0.14l0.76,-1.27l6.33,-0.46l1.97,1.11l0.28,0.01l5.55,-2.71l4.53,0.08l0.29,-0.21l0.67,-2.18l2.29,-2.15l5.75,-2.13l3.48,1.4l-2.7,1.03l-0.19,0.31l0.26,0.26l5.47,0.78ZM871.83,65.73l0.25,-0.15l1.99,0.01l3.3,1.2l-0.08,0.22l-2.41,1.03l-5.73,0.49l-0.31,-1.0l2.99,-1.8ZM797.64,48.44l-2.22,1.51l-3.85,-0.43l-4.35,-1.85l0.42,-1.13l4.42,0.72l5.59,1.17ZM783.82,46.06l-1.71,3.25l-9.05,-0.14l-4.11,1.15l-4.64,-3.04l1.21,-3.13l3.11,-0.91l6.53,0.22l8.66,2.59ZM780.37,145.71l2.28,5.23l-3.09,-0.89l-0.37,0.19l-1.54,4.65l0.04,0.27l2.38,3.17l-0.05,1.4l-1.41,-1.41l-0.46,0.04l-1.23,1.81l-0.33,-1.86l0.28,-3.1l-0.28,-3.41l0.58,-2.46l0.11,-4.39l-0.03,-0.13l-1.44,-3.2l0.21,-4.39l2.19,-1.49l0.09,-0.41l-0.81,-1.3l0.48,-0.21l0.56,1.94l0.86,3.23l-0.05,3.36l1.03,3.35ZM780.16,57.18l-3.4,0.03l-5.06,-0.53l1.97,-1.59l2.95,-0.42l3.35,1.75l0.18,0.77ZM683.84,31.18l-13.29,1.97l4.16,-6.56l1.88,-0.58l1.77,0.34l6.08,3.02l-0.6,1.8ZM670.94,28.02l-5.18,0.65l-6.89,-1.58l-4.03,-2.07l-1.88,-3.98l-0.18,-0.16l-2.8,-0.93l5.91,-3.62l5.25,-1.29l4.73,2.88l5.63,5.44l-0.57,4.66ZM564.37,68.98l-0.85,0.23l-7.93,-0.57l-0.6,-1.84l-0.21,-0.2l-4.34,-1.18l-0.3,-2.08l2.34,-0.92l0.19,-0.29l-0.08,-2.43l4.85,-4.0l-0.12,-0.52l-1.68,-0.43l5.47,-3.94l0.11,-0.33l-0.6,-2.02l5.36,-2.55l8.22,-3.27l8.29,-0.96l4.34,-1.94l4.67,-0.65l1.45,1.72l-1.43,1.37l-8.8,2.52l-7.65,2.42l-7.92,4.84l-3.73,4.75l-3.92,4.58l-0.07,0.23l0.51,3.88l0.11,0.2l4.32,3.39ZM548.86,18.57l-3.28,0.75l-2.25,0.44l-0.22,0.19l-0.3,0.81l-2.67,0.86l-2.27,-1.14l1.2,-1.51l-0.23,-0.49l-3.14,-0.1l2.48,-0.54l3.55,-0.07l0.44,1.36l0.49,0.12l1.4,-1.35l2.2,-0.9l3.13,1.08l-0.54,0.49ZM477.5,133.25l-4.21,0.05l-2.69,-0.34l0.39,-1.03l3.24,-1.06l2.51,0.58l0.85,0.43l-0.2,0.71l-0.0,0.15l0.12,0.52Z", "name": "Russia"}, "RW": {"path": "M497.03,288.12l0.78,1.11l-0.12,1.19l-0.49,0.21l-1.25,-0.15l-0.3,0.16l-0.67,1.24l-1.01,-0.13l0.16,-0.92l0.22,-0.12l0.15,-0.24l0.09,-1.37l0.49,-0.48l0.42,0.18l0.25,-0.01l1.26,-0.65Z", "name": "Rwanda"}, "RS": {"path": "M469.75,168.65l0.21,-0.21l0.36,-1.44l-0.08,-0.29l-1.06,-1.03l0.54,-1.16l-0.28,-0.43l-0.26,0.0l0.55,-0.67l-0.01,-0.39l-0.77,-0.86l-0.45,-0.89l1.56,-0.67l1.39,0.12l1.22,1.1l0.26,0.91l0.16,0.19l1.38,0.66l0.17,1.12l0.14,0.21l1.46,0.9l0.35,-0.03l0.62,-0.54l0.09,0.06l-0.28,0.25l-0.03,0.42l0.29,0.34l-0.44,0.5l-0.07,0.26l0.22,1.12l0.07,0.14l1.02,1.1l-0.81,0.84l-0.42,0.96l0.04,0.3l0.12,0.15l-0.15,0.16l-1.04,0.04l-0.39,0.08l0.33,-0.81l-0.29,-0.41l-0.21,0.01l-0.39,-0.45l-0.13,-0.09l-0.32,-0.11l-0.27,-0.4l-0.14,-0.11l-0.4,-0.16l-0.31,-0.37l-0.34,-0.09l-0.45,0.17l-0.18,0.18l-0.29,0.84l-0.96,-0.65l-0.81,-0.33l-0.32,-0.37l-0.22,-0.18Z", "name": "Republic of Serbia"}, "LT": {"path": "M478.13,133.31l-0.14,-0.63l0.25,-0.88l-0.15,-0.35l-1.17,-0.58l-2.43,-0.57l-0.45,-2.51l2.58,-0.97l4.14,0.22l2.3,-0.32l0.26,0.54l0.22,0.17l1.26,0.22l2.25,1.6l0.19,1.23l-1.87,1.01l-0.14,0.18l-0.54,1.83l-2.54,1.21l-2.18,-0.02l-0.52,-0.91l-0.18,-0.14l-1.11,-0.32Z", "name": "Lithuania"}, "LU": {"path": "M435.95,147.99l0.33,0.49l-0.11,1.07l-0.39,0.04l-0.29,-0.15l0.21,-1.4l0.25,-0.05Z", "name": "Luxembourg"}, "LR": {"path": "M401.37,273.67l-0.32,0.01l-2.48,-1.15l-2.24,-1.89l-2.14,-1.38l-1.47,-1.42l0.44,-0.59l0.05,-0.13l0.12,-0.65l1.07,-1.3l1.08,-1.09l0.52,-0.07l0.43,-0.18l0.84,1.24l-0.15,0.89l0.07,0.25l0.49,0.54l0.22,0.1l0.71,0.01l0.27,-0.16l0.42,-0.83l0.19,0.02l-0.06,0.52l0.23,1.12l-0.5,1.03l0.06,0.35l0.73,0.69l0.14,0.08l0.71,0.15l0.92,0.91l0.06,0.76l-0.17,0.22l-0.06,0.15l-0.17,1.8Z", "name": "Liberia"}, "RO": {"path": "M477.94,155.19l1.02,-0.64l1.49,0.33l1.52,0.01l1.09,0.73l0.32,0.01l0.81,-0.46l1.8,-0.3l0.18,-0.1l0.54,-0.64l0.86,0.0l0.64,0.26l0.71,0.87l0.8,1.35l1.39,1.81l0.07,1.25l-0.26,1.3l0.01,0.15l0.45,1.42l0.15,0.18l1.12,0.57l0.25,0.01l1.05,-0.45l0.86,0.4l0.03,0.43l-0.92,0.51l-0.63,-0.24l-0.4,0.22l-0.64,3.41l-1.12,-0.24l-1.78,-1.09l-0.23,-0.04l-2.95,0.71l-1.25,0.77l-3.55,-0.16l-1.89,-0.47l-0.14,-0.0l-0.75,0.17l-0.61,-1.07l-0.3,-0.36l0.36,-0.32l-0.04,-0.48l-0.62,-0.38l-0.36,0.03l-0.62,0.54l-1.15,-0.71l-0.18,-1.14l-0.17,-0.22l-1.4,-0.67l-0.24,-0.86l-0.09,-0.14l-0.96,-0.87l1.49,-0.44l0.16,-0.11l1.51,-2.14l1.15,-2.09l1.44,-0.63Z", "name": "Romania"}, "GW": {"path": "M383.03,256.73l-1.12,-0.88l-0.14,-0.06l-0.94,-0.15l-0.43,-0.54l0.01,-0.27l-0.13,-0.26l-0.68,-0.48l-0.05,-0.16l0.99,-0.31l0.77,0.08l0.15,-0.02l0.61,-0.26l4.25,0.1l-0.02,0.44l-0.19,0.18l-0.08,0.29l0.17,0.66l-0.17,0.14l-0.44,0.0l-0.16,0.05l-0.57,0.37l-0.66,-0.04l-0.24,0.1l-0.92,1.03Z", "name": "Guinea Bissau"}, "GT": {"path": "M195.13,249.89l-1.05,-0.35l-1.5,-0.04l-1.06,-0.47l-1.19,-0.93l0.04,-0.53l0.27,-0.55l-0.03,-0.31l-0.24,-0.32l1.02,-1.77l3.04,-0.01l0.3,-0.28l0.06,-0.88l-0.19,-0.3l-0.3,-0.11l-0.23,-0.45l-0.11,-0.12l-0.9,-0.58l-0.35,-0.33l0.37,-0.0l0.3,-0.3l0.0,-1.15l4.05,0.02l-0.02,1.74l-0.2,2.89l0.3,0.32l0.67,-0.0l0.75,0.42l0.4,-0.11l-0.62,0.53l-1.17,0.7l-0.13,0.16l-0.18,0.49l0.0,0.21l0.14,0.34l-0.35,0.44l-0.49,0.13l-0.2,0.41l0.03,0.06l-0.27,0.16l-0.86,0.64l-0.12,0.22ZM199.35,245.38l0.07,-0.13l0.05,0.02l-0.13,0.11Z", "name": "Guatemala"}, "GR": {"path": "M487.2,174.55l-0.64,1.54l-0.43,0.24l-1.41,-0.08l-1.28,-0.28l-0.14,0.0l-3.03,0.77l-0.13,0.51l1.39,1.34l-0.78,0.29l-1.2,0.0l-1.23,-1.42l-0.47,0.02l-0.47,0.65l-0.04,0.27l0.56,1.76l0.06,0.11l1.02,1.12l-0.66,0.45l-0.04,0.46l1.39,1.35l1.15,0.79l0.02,1.06l-1.91,-0.63l-0.36,0.42l0.56,1.12l-1.2,0.23l-0.22,0.4l0.8,2.14l-1.15,0.02l-1.89,-1.15l-0.89,-2.19l-0.43,-1.91l-0.05,-0.11l-0.98,-1.35l-1.24,-1.62l-0.13,-0.63l1.07,-1.32l0.06,-0.14l0.13,-0.81l0.68,-0.36l0.16,-0.25l0.03,-0.54l1.4,-0.23l0.12,-0.05l0.87,-0.6l1.26,0.05l0.25,-0.11l0.34,-0.43l0.33,-0.07l1.81,0.08l0.13,-0.02l1.87,-0.77l1.64,0.97l0.19,0.04l2.28,-0.28l0.26,-0.29l0.02,-0.95l0.56,0.36ZM480.44,192.0l1.05,0.74l0.01,0.0l-1.26,-0.23l0.2,-0.51ZM481.76,192.79l1.86,-0.15l1.53,0.17l-0.02,0.19l0.34,0.3l-2.28,0.15l0.01,-0.13l-0.25,-0.31l-1.19,-0.22ZM485.65,193.28l0.65,-0.16l-0.05,0.12l-0.6,0.04Z", "name": "Greece"}, "GQ": {"path": "M444.81,282.04l-0.21,-0.17l0.74,-2.4l3.56,0.05l0.02,2.42l-3.34,-0.02l-0.76,0.13Z", "name": "Equatorial Guinea"}, "GY": {"path": "M271.34,264.25l1.43,0.81l1.44,1.53l0.06,1.19l0.28,0.28l0.84,0.05l2.13,1.92l-0.34,1.93l-1.37,0.59l-0.17,0.34l0.12,0.51l-0.43,1.21l0.03,0.26l1.11,1.82l0.26,0.14l0.56,0.0l0.32,1.29l1.25,1.78l-0.08,0.01l-1.34,-0.21l-0.24,0.06l-0.78,0.64l-1.06,0.41l-0.76,0.1l-0.22,0.15l-0.18,0.32l-0.95,-0.1l-1.38,-1.05l-0.19,-1.13l-0.6,-1.18l0.37,-1.96l0.65,-0.83l0.03,-0.32l-0.57,-1.17l-0.15,-0.14l-0.62,-0.27l0.25,-0.85l-0.08,-0.3l-0.58,-0.58l-0.24,-0.09l-1.15,0.1l-1.41,-1.58l0.48,-0.49l0.09,-0.22l-0.04,-0.92l1.31,-0.34l0.73,-0.52l0.04,-0.44l-0.75,-0.82l0.16,-0.66l1.74,-1.3Z", "name": "Guyana"}, "GE": {"path": "M525.41,174.19l0.26,-0.88l-0.0,-0.17l-0.63,-2.06l-0.1,-0.15l-1.45,-1.12l-0.11,-0.05l-1.31,-0.33l-0.66,-0.69l1.97,0.48l3.65,0.49l3.3,1.41l0.39,0.5l0.33,0.1l1.43,-0.45l2.14,0.58l0.7,1.14l0.13,0.12l1.06,0.47l-0.18,0.11l-0.08,0.43l1.08,1.41l-0.06,0.06l-1.16,-0.15l-1.82,-0.84l-0.31,0.04l-0.55,0.44l-3.29,0.44l-2.32,-1.41l-0.17,-0.04l-2.25,0.12Z", "name": "Georgia"}, "GB": {"path": "M412.82,118.6l-2.31,3.4l-0.0,0.33l0.31,0.13l2.52,-0.49l2.34,0.02l-0.56,2.51l-2.22,3.13l0.22,0.47l2.43,0.21l2.35,4.35l0.17,0.14l1.58,0.51l1.49,3.78l0.73,1.37l0.2,0.15l2.76,0.59l-0.25,1.75l-1.18,0.91l-0.08,0.39l0.87,1.49l-1.96,1.51l-3.31,-0.02l-4.15,0.88l-1.07,-0.59l-0.35,0.04l-1.55,1.44l-2.17,-0.35l-0.22,0.05l-1.61,1.15l-0.78,-0.38l3.31,-3.12l2.18,-0.7l0.21,-0.31l-0.26,-0.27l-3.78,-0.54l-0.48,-0.9l2.3,-0.92l0.13,-0.46l-1.29,-1.71l0.39,-1.83l3.46,0.29l0.32,-0.24l0.37,-1.99l-0.06,-0.24l-1.71,-2.17l-0.18,-0.11l-2.91,-0.58l-0.43,-0.68l0.82,-1.4l-0.03,-0.35l-0.82,-0.97l-0.46,0.01l-0.85,1.05l-0.11,-2.6l-0.05,-0.16l-1.19,-1.7l0.86,-3.53l1.81,-2.75l1.88,0.26l2.38,-0.24ZM406.39,132.84l-1.09,1.92l-1.65,-0.62l-1.26,0.02l0.41,-1.46l0.0,-0.16l-0.42,-1.51l1.62,-0.11l2.39,1.92Z", "name": "United Kingdom"}, "GA": {"path": "M448.76,294.47l-2.38,-2.34l-1.63,-2.04l-1.46,-2.48l0.06,-0.66l0.54,-0.81l0.61,-1.82l0.46,-1.69l0.63,-0.11l3.62,0.03l0.3,-0.3l-0.02,-2.75l0.88,-0.12l1.47,0.32l0.13,0.0l1.39,-0.3l-0.13,0.87l0.03,0.19l0.7,1.29l0.3,0.16l1.74,-0.19l0.36,0.29l-1.01,2.7l0.05,0.29l1.13,1.42l0.25,1.82l-0.3,1.56l-0.64,0.99l-1.93,-0.09l-1.26,-1.13l-0.5,0.17l-0.16,0.91l-1.48,0.27l-0.12,0.05l-0.86,0.63l-0.08,0.39l0.81,1.42l-1.48,1.08Z", "name": "Gabon"}, "GN": {"path": "M399.83,265.31l-0.69,-0.06l-0.3,0.16l-0.43,0.85l-0.39,-0.01l-0.3,-0.33l0.14,-0.87l-0.05,-0.22l-1.05,-1.54l-0.37,-0.11l-0.61,0.27l-0.84,0.12l0.02,-0.54l-0.04,-0.17l-0.35,-0.57l0.07,-0.63l-0.03,-0.17l-0.57,-1.11l-0.7,-0.9l-0.24,-0.12l-2.0,-0.0l-0.19,0.07l-0.51,0.42l-0.6,0.05l-0.21,0.11l-0.43,0.55l-0.3,0.7l-1.04,0.86l-0.91,-1.24l-1.0,-1.02l-0.69,-0.37l-0.52,-0.42l-0.3,-1.11l-0.37,-0.56l-0.1,-0.1l-0.4,-0.23l0.77,-0.85l0.62,0.04l0.18,-0.05l0.58,-0.38l0.46,-0.0l0.19,-0.07l0.39,-0.34l0.1,-0.3l-0.17,-0.67l0.15,-0.14l0.09,-0.2l0.03,-0.57l0.87,0.02l1.76,0.6l0.13,0.01l0.55,-0.06l0.22,-0.13l0.08,-0.12l1.18,0.17l0.17,-0.02l0.09,0.56l0.3,0.25l0.4,-0.0l0.14,-0.03l0.56,-0.29l0.23,0.05l0.63,0.59l0.15,0.07l1.07,0.2l0.24,-0.06l0.65,-0.52l0.77,-0.32l0.55,-0.32l0.3,0.04l0.44,0.45l0.34,0.74l0.84,0.87l-0.35,0.45l-0.06,0.15l-0.1,0.82l0.42,0.31l0.35,-0.16l0.05,0.04l-0.1,0.59l0.09,0.27l0.42,0.4l-0.06,0.02l-0.18,0.21l-0.2,0.86l0.03,0.21l0.56,1.02l0.52,1.71l-0.65,0.21l-0.15,0.12l-0.24,0.35l-0.03,0.28l0.16,0.41l-0.1,0.76l-0.12,0.0Z", "name": "Guinea"}, "GM": {"path": "M379.18,251.48l0.15,-0.55l2.51,-0.07l0.21,-0.09l0.48,-0.52l0.58,-0.03l0.91,0.58l0.16,0.05l0.78,0.01l0.14,-0.03l0.59,-0.31l0.16,0.24l-0.71,0.38l-0.94,-0.04l-1.02,-0.51l-0.3,0.01l-0.86,0.55l-0.37,0.02l-0.14,0.04l-0.53,0.31l-1.81,-0.04Z", "name": "Gambia"}, "GL": {"path": "M304.13,6.6l8.19,-3.63l8.72,0.28l0.19,-0.06l3.12,-2.28l8.75,-0.61l19.94,0.8l14.93,4.75l-3.92,2.01l-9.52,0.27l-13.48,0.6l-0.27,0.2l0.09,0.33l1.26,1.09l0.22,0.07l8.81,-0.67l7.49,2.07l0.19,-0.01l4.68,-1.78l1.76,1.84l-2.59,3.26l-0.01,0.36l0.34,0.11l6.35,-2.2l12.09,-2.32l7.31,1.14l1.17,2.13l-9.9,4.05l-1.43,1.32l-7.91,0.98l-0.26,0.31l0.29,0.29l5.25,0.25l-2.63,3.72l-2.02,3.61l-0.04,0.15l0.08,6.05l0.07,0.19l2.61,3.0l-3.4,0.2l-4.12,1.66l-0.04,0.54l4.5,2.67l0.53,3.9l-2.39,0.42l-0.19,0.48l2.91,3.83l-5.0,0.32l-0.27,0.22l0.12,0.33l2.69,1.84l-0.65,1.35l-3.36,0.71l-3.46,0.01l-0.21,0.51l3.05,3.15l0.02,1.53l-4.54,-1.79l-0.32,0.06l-1.29,1.26l0.11,0.5l3.33,1.15l3.17,2.74l0.85,3.29l-4.0,0.78l-1.83,-1.66l-3.1,-2.64l-0.36,-0.02l-0.13,0.33l0.8,2.92l-2.76,2.26l-0.09,0.33l0.28,0.2l6.59,0.19l2.47,0.18l-5.86,3.38l-6.76,3.43l-7.26,1.48l-2.73,0.02l-0.16,0.05l-2.67,1.72l-3.44,4.42l-5.28,2.86l-1.73,0.18l-3.33,1.01l-3.59,0.96l-0.15,0.1l-2.15,2.52l-0.07,0.19l-0.03,2.76l-1.21,2.49l-4.03,3.1l-0.1,0.33l0.98,2.94l-2.31,6.57l-3.21,0.21l-3.6,-3.0l-0.19,-0.07l-4.9,-0.02l-2.29,-1.97l-1.69,-3.78l-4.31,-4.86l-1.23,-2.52l-0.34,-3.58l-0.08,-0.17l-3.35,-3.67l0.85,-2.92l-0.09,-0.31l-1.5,-1.34l2.33,-4.7l3.67,-1.57l0.15,-0.13l1.02,-1.93l0.52,-3.47l-0.44,-0.31l-2.85,1.57l-1.33,0.64l-2.12,0.59l-2.81,-1.32l-0.15,-2.79l0.88,-2.17l2.09,-0.06l5.07,1.2l0.34,-0.17l-0.11,-0.37l-4.3,-2.9l-2.24,-1.58l-0.25,-0.05l-2.38,0.62l-1.7,-0.93l2.62,-4.1l-0.03,-0.36l-1.51,-1.75l-1.97,-3.3l-3.01,-5.21l-0.1,-0.11l-3.04,-1.85l0.03,-1.94l-0.18,-0.28l-6.82,-3.01l-5.35,-0.38l-6.69,0.21l-6.03,0.37l-2.81,-1.59l-3.84,-2.9l5.94,-1.5l5.01,-0.28l0.28,-0.29l-0.26,-0.31l-10.68,-1.38l-5.38,-2.1l0.27,-1.68l9.3,-2.6l9.18,-2.68l0.19,-0.16l0.97,-2.05l-0.18,-0.42l-6.29,-1.91l1.81,-1.9l8.58,-4.05l3.6,-0.63l0.23,-0.4l-0.92,-2.37l5.59,-1.5l7.66,-0.95l7.58,-0.05l2.65,1.84l0.31,0.02l6.52,-3.29l5.85,2.24l3.55,0.49l5.17,1.95l0.38,-0.16l-0.13,-0.39l-5.77,-3.16l0.29,-2.26Z", "name": "Greenland"}, "KW": {"path": "M540.87,207.81l0.41,0.94l-0.18,0.51l0.0,0.21l0.65,1.66l-1.15,0.05l-0.54,-1.12l-0.24,-0.17l-1.73,-0.2l1.44,-2.06l1.33,0.18Z", "name": "Kuwait"}, "GH": {"path": "M423.16,269.88l-3.58,1.34l-1.41,0.87l-2.13,0.69l-1.91,-0.61l0.09,-0.75l-0.03,-0.17l-1.04,-2.07l0.62,-2.7l1.04,-2.08l0.03,-0.19l-1.0,-5.46l0.05,-1.12l4.04,-0.11l1.08,0.18l0.18,-0.03l0.72,-0.36l0.75,0.13l-0.11,0.48l0.06,0.26l0.98,1.22l-0.0,1.77l0.24,1.99l0.05,0.13l0.55,0.81l-0.52,2.14l0.19,1.37l0.69,1.66l0.38,0.62Z", "name": "Ghana"}, "OM": {"path": "M568.16,231.0l-0.08,0.1l-0.84,1.61l-0.93,-0.11l-0.27,0.11l-0.58,0.73l-0.4,1.32l-0.01,0.14l0.29,1.61l-0.07,0.09l-1.0,-0.01l-0.16,0.04l-1.56,0.97l-0.14,0.2l-0.23,1.17l-0.41,0.4l-1.44,-0.02l-0.17,0.05l-0.98,0.65l-0.13,0.25l0.01,0.87l-0.97,0.57l-1.27,-0.22l-0.19,0.03l-1.63,0.84l-0.88,0.11l-2.55,-5.57l7.2,-2.49l0.19,-0.19l1.67,-5.23l-0.03,-0.25l-1.1,-1.78l0.05,-0.89l0.68,-1.03l0.05,-0.16l0.01,-0.89l0.96,-0.44l0.07,-0.5l-0.32,-0.26l0.16,-1.31l0.85,-0.01l1.03,1.67l0.09,0.09l1.4,0.96l0.11,0.05l1.82,0.34l1.37,0.45l1.75,2.32l0.13,0.1l0.7,0.26l-0.0,0.3l-1.25,2.19l-1.01,0.8ZM561.88,218.47l-0.01,0.02l-0.15,-0.29l0.3,-0.38l-0.14,0.65Z", "name": "Oman"}, "_3": {"path": "M543.2,261.06l-1.07,1.46l-1.65,1.99l-1.91,0.01l-8.08,-2.95l-0.89,-0.84l-0.9,-1.19l-0.81,-1.23l0.44,-0.73l0.76,-1.12l0.49,0.28l0.52,1.05l1.13,1.06l0.2,0.08l1.24,0.01l2.42,-0.65l2.77,-0.31l2.17,-0.78l1.31,-0.19l0.84,-0.43l1.03,-0.06l-0.01,4.54Z", "name": "Somaliland"}, "_2": {"path": "M384.23,230.37l0.07,-0.06l0.28,-0.89l0.99,-1.13l0.07,-0.13l0.8,-3.54l3.4,-2.8l0.09,-0.13l0.76,-2.17l0.07,5.5l-2.07,0.21l-0.24,0.17l-0.61,1.36l-0.02,0.16l0.43,3.46l-4.01,-0.01ZM391.82,218.2l0.07,-0.06l0.75,-1.93l1.86,-0.25l0.94,0.34l1.14,0.0l0.18,-0.06l0.73,-0.56l1.41,-0.08l-0.0,2.72l-7.08,-0.12Z", "name": "Western Sahara"}, "_1": {"path": "M472.71,172.84l-0.07,-0.43l-0.16,-0.22l-0.53,-0.27l-0.38,-0.58l0.3,-0.43l0.51,-0.19l0.18,-0.18l0.3,-0.87l0.12,-0.04l0.22,0.26l0.12,0.09l0.38,0.15l0.28,0.41l0.15,0.12l0.34,0.12l0.43,0.5l0.15,0.07l-0.12,0.3l-0.27,0.32l-0.03,0.18l-0.31,0.06l-1.48,0.47l-0.15,0.17Z", "name": "Kosovo"}, "_0": {"path": "M503.54,192.92l0.09,-0.17l0.41,0.01l-0.08,0.01l-0.42,0.15ZM504.23,192.76l1.02,0.02l0.4,-0.13l-0.09,0.29l0.03,0.08l-0.35,0.16l-0.24,-0.04l-0.06,-0.1l-0.18,-0.17l-0.19,-0.08l-0.33,-0.02Z", "name": "Northern Cyprus"}, "JO": {"path": "M510.26,200.93l0.28,-0.57l2.53,1.0l0.27,-0.02l4.57,-2.77l0.84,2.84l-0.28,0.25l-4.95,1.37l-0.14,0.49l2.24,2.48l-0.5,0.28l-0.13,0.14l-0.35,0.78l-1.76,0.35l-0.2,0.14l-0.57,0.94l-0.94,0.73l-2.45,-0.38l-0.03,-0.12l1.23,-4.32l-0.04,-1.1l0.34,-0.75l0.03,-0.12l0.0,-1.63Z", "name": "Jordan"}, "HR": {"path": "M455.49,162.73l1.53,0.09l0.24,-0.1l0.29,-0.34l0.64,0.38l0.14,0.04l0.98,0.06l0.32,-0.3l-0.01,-0.66l0.67,-0.25l0.19,-0.22l0.21,-1.11l1.72,-0.72l0.65,0.32l1.94,1.37l2.07,0.6l0.22,-0.02l0.67,-0.33l0.47,0.94l0.67,0.76l-0.63,0.77l-0.91,-0.55l-0.16,-0.04l-1.69,0.04l-2.2,-0.51l-1.17,0.07l-0.21,0.11l-0.36,0.42l-0.67,-0.53l-0.46,0.12l-0.52,1.29l0.05,0.31l1.21,1.42l0.58,0.99l1.15,1.14l0.95,0.68l0.92,1.23l0.1,0.09l1.75,0.91l-1.87,-0.89l-1.5,-1.11l-2.23,-0.88l-1.77,-1.9l0.12,-0.06l0.1,-0.47l-1.07,-1.22l-0.04,-0.94l-0.21,-0.27l-1.61,-0.49l-0.35,0.14l-0.53,0.93l-0.41,-0.57l0.04,-0.73Z", "name": "Croatia"}, "HT": {"path": "M237.82,234.68l1.35,0.1l1.95,0.37l0.18,1.15l-0.16,0.83l-0.51,0.37l-0.06,0.44l0.57,0.68l-0.02,0.22l-1.31,-0.35l-1.26,0.17l-1.49,-0.18l-0.15,0.02l-1.03,0.43l-1.02,-0.61l0.09,-0.36l2.04,0.32l1.9,0.21l0.19,-0.05l0.9,-0.58l0.05,-0.47l-1.05,-1.03l0.02,-0.86l-0.23,-0.3l-1.13,-0.29l0.18,-0.23Z", "name": "Haiti"}, "HU": {"path": "M461.96,157.92l0.68,-1.66l-0.03,-0.29l-0.15,-0.22l0.84,-0.0l0.3,-0.26l0.12,-0.84l0.88,0.57l0.98,0.38l0.16,0.01l2.1,-0.39l0.23,-0.21l0.14,-0.45l0.88,-0.1l1.06,-0.43l0.13,0.1l0.28,0.04l1.18,-0.4l0.14,-0.1l0.52,-0.67l0.63,-0.15l2.6,0.95l0.26,-0.03l0.38,-0.23l1.12,0.7l0.1,0.49l-1.31,0.57l-0.14,0.13l-1.18,2.14l-1.44,2.04l-1.85,0.55l-1.51,-0.13l-0.14,0.02l-1.92,0.82l-0.85,0.42l-1.91,-0.55l-1.83,-1.31l-0.74,-0.37l-0.44,-0.97l-0.26,-0.18Z", "name": "Hungary"}, "HN": {"path": "M202.48,251.87l-0.33,-0.62l-0.18,-0.14l-0.5,-0.15l0.13,-0.76l-0.11,-0.28l-0.34,-0.28l-0.6,-0.23l-0.18,-0.01l-0.81,0.22l-0.16,-0.24l-0.72,-0.39l-0.51,-0.48l-0.12,-0.07l-0.31,-0.09l0.24,-0.3l0.04,-0.3l-0.16,-0.4l0.1,-0.28l1.14,-0.69l1.0,-0.86l0.09,0.04l0.3,-0.05l0.47,-0.39l0.49,-0.03l0.14,0.13l0.29,0.06l0.31,-0.1l1.16,0.22l1.24,-0.08l0.81,-0.28l0.29,-0.25l0.63,0.1l0.69,0.18l0.65,-0.06l0.49,-0.2l1.04,0.32l0.38,0.06l0.7,0.44l0.71,0.56l0.92,0.41l0.1,0.11l-0.11,-0.01l-0.23,0.09l-0.3,0.3l-0.76,0.29l-0.58,0.0l-0.15,0.04l-0.45,0.26l-0.31,-0.07l-0.37,-0.34l-0.28,-0.07l-0.26,0.07l-0.18,0.15l-0.23,0.43l-0.04,-0.0l-0.33,0.28l-0.03,0.4l-0.76,0.61l-0.45,0.3l-0.15,0.16l-0.51,-0.36l-0.41,0.06l-0.45,0.56l-0.41,-0.01l-0.59,0.06l-0.27,0.31l0.04,0.96l-0.07,0.0l-0.25,0.16l-0.24,0.45l-0.42,0.06Z", "name": "Honduras"}, "PR": {"path": "M254.95,238.31l1.15,0.21l0.2,0.23l-0.36,0.36l-1.76,-0.01l-1.2,0.07l-0.09,-0.69l0.17,-0.18l1.89,0.01Z", "name": "Puerto Rico"}, "PS": {"path": "M509.66,201.06l-0.0,1.44l-0.29,0.63l-0.59,0.19l0.02,-0.11l0.52,-0.31l-0.02,-0.53l-0.41,-0.2l0.36,-1.28l0.41,0.17Z", "name": "West Bank"}, "PT": {"path": "M398.65,173.6l0.75,-0.63l0.7,-0.3l0.51,1.2l0.28,0.18l1.48,-0.0l0.2,-0.08l0.33,-0.3l1.16,0.08l0.52,1.11l-0.95,0.66l-0.13,0.24l-0.03,2.2l-0.33,0.35l-0.08,0.18l-0.08,1.17l-0.86,0.19l-0.2,0.44l0.93,1.64l-0.64,1.79l0.07,0.31l0.72,0.72l-0.24,0.56l-0.9,1.05l-0.07,0.26l0.17,0.77l-0.73,0.54l-1.18,-0.36l-0.16,-0.0l-0.85,0.21l0.31,-1.81l-0.23,-1.87l-0.23,-0.25l-0.99,-0.24l-0.49,-0.91l0.18,-1.72l0.93,-0.99l0.08,-0.16l0.17,-1.17l0.52,-1.76l-0.04,-1.36l-0.51,-1.14l-0.09,-0.8Z", "name": "Portugal"}, "PY": {"path": "M264.33,341.43l0.93,-2.96l0.07,-1.42l1.1,-2.1l4.19,-0.73l2.22,0.04l2.12,1.21l0.07,0.76l0.7,1.38l-0.16,3.48l0.24,0.31l2.64,0.5l0.19,-0.03l0.9,-0.45l1.47,0.62l0.38,0.64l0.23,2.35l0.3,1.07l0.25,0.21l0.93,0.12l0.16,-0.02l0.8,-0.37l0.61,0.33l-0.0,1.25l-0.33,1.53l-0.5,1.57l-0.39,2.26l-2.14,1.94l-1.85,0.4l-2.74,-0.4l-2.13,-0.62l2.26,-3.75l0.03,-0.24l-0.36,-1.18l-0.17,-0.19l-2.55,-1.03l-3.04,-1.95l-2.07,-0.43l-4.4,-4.12Z", "name": "Paraguay"}, "PA": {"path": "M213.65,263.79l0.18,-0.43l0.02,-0.18l-0.06,-0.28l0.23,-0.18l-0.01,-0.48l-0.4,-0.29l-0.01,-0.62l0.57,-0.13l0.68,0.69l-0.04,0.39l0.26,0.33l1.0,0.11l0.27,-0.1l0.49,0.44l0.24,0.07l1.34,-0.22l1.04,-0.62l1.49,-0.5l0.86,-0.73l0.99,0.11l0.18,0.28l1.35,0.08l1.02,0.4l0.78,0.72l0.71,0.53l-0.1,0.12l-0.05,0.3l0.53,1.34l-0.28,0.44l-0.6,-0.13l-0.36,0.22l-0.2,0.76l-0.41,-0.36l-0.44,-1.12l0.49,-0.53l-0.14,-0.49l-0.51,-0.14l-0.41,-0.72l-0.11,-0.11l-1.25,-0.7l-0.19,-0.04l-1.1,0.16l-0.22,0.15l-0.47,0.81l-0.9,0.56l-0.49,0.08l-0.22,0.17l-0.25,0.52l0.05,0.32l0.93,1.07l-0.41,0.21l-0.29,0.3l-0.81,0.09l-0.36,-1.26l-0.53,-0.1l-0.21,0.28l-0.5,-0.09l-0.44,-0.88l-0.22,-0.16l-0.99,-0.16l-0.61,-0.28l-0.13,-0.03l-1.0,0.0Z", "name": "Panama"}, "PG": {"path": "M808.4,298.6l0.62,0.46l1.19,1.56l1.04,0.77l-0.18,0.37l-0.42,0.15l-0.92,-0.82l-1.05,-1.53l-0.27,-0.96ZM804.09,296.06l-0.3,0.26l-0.36,-1.11l-0.66,-1.06l-2.55,-1.89l-1.42,-0.59l0.17,-0.15l1.16,0.6l0.85,0.55l1.01,0.58l0.97,1.02l0.9,0.76l0.24,1.03ZM796.71,297.99l0.15,0.82l0.34,0.24l1.43,-0.19l0.19,-0.11l0.68,-0.82l1.36,-0.87l0.13,-0.31l-0.21,-1.13l1.04,-0.03l0.3,0.25l-0.04,1.17l-0.74,1.34l-1.17,0.18l-0.22,0.15l-0.35,0.62l-2.51,1.13l-1.21,-0.0l-1.99,-0.71l-1.19,-0.58l0.07,-0.28l1.98,0.32l1.46,-0.2l0.24,-0.21l0.25,-0.79ZM789.24,303.52l0.11,0.15l2.19,1.62l1.6,2.62l0.27,0.14l1.09,-0.06l-0.07,0.77l0.23,0.32l1.23,0.27l-0.14,0.09l0.05,0.53l2.39,0.95l-0.11,0.28l-1.33,0.14l-0.51,-0.55l-0.18,-0.09l-4.59,-0.65l-1.87,-1.55l-1.38,-1.35l-1.28,-2.17l-0.16,-0.13l-3.27,-1.1l-0.19,0.0l-2.12,0.72l-1.58,0.85l-0.15,0.31l0.28,1.63l-1.65,0.73l-1.37,-0.4l-2.3,-0.09l-0.08,-15.65l3.95,1.57l4.58,1.42l1.67,1.25l1.32,1.19l0.36,1.39l0.19,0.21l4.06,1.51l0.39,0.85l-1.9,0.22l-0.25,0.39l0.55,1.68Z", "name": "Papua New Guinea"}, "PE": {"path": "M246.44,329.21l-0.63,1.25l-1.05,0.54l-2.25,-1.33l-0.19,-0.93l-0.16,-0.21l-4.95,-2.58l-4.46,-2.79l-1.87,-1.52l-0.94,-1.91l0.33,-0.6l-0.01,-0.31l-2.11,-3.33l-2.46,-4.66l-2.36,-5.02l-1.04,-1.18l-0.77,-1.81l-0.08,-0.11l-1.95,-1.64l-1.54,-0.88l0.61,-0.85l0.02,-0.31l-1.15,-2.27l0.69,-1.56l1.59,-1.26l0.12,0.42l-0.56,0.47l-0.11,0.25l0.07,0.92l0.36,0.27l0.97,-0.19l0.85,0.23l0.99,1.19l0.41,0.05l1.42,-1.03l0.11,-0.16l0.46,-1.64l1.45,-2.06l2.92,-0.96l0.11,-0.07l2.73,-2.62l0.84,-1.72l0.02,-0.18l-0.3,-1.65l0.28,-0.1l1.49,1.06l0.77,1.14l0.1,0.09l1.08,0.6l1.43,2.55l0.21,0.15l1.86,0.31l0.18,-0.03l1.25,-0.6l0.77,0.37l0.17,0.03l1.4,-0.2l1.57,0.96l-1.45,2.29l0.23,0.46l0.63,0.05l0.66,0.7l-1.51,-0.08l-0.24,0.1l-0.27,0.31l-1.96,0.46l-2.95,1.74l-0.14,0.21l-0.17,1.1l-0.6,0.82l-0.05,0.23l0.21,1.13l-1.31,0.63l-0.17,0.27l0.0,0.91l-0.53,0.37l-0.1,0.37l1.04,2.27l1.31,1.46l-0.44,0.9l0.24,0.43l1.52,0.13l0.87,1.23l0.24,0.13l2.21,0.07l0.18,-0.06l1.55,-1.13l-0.14,3.22l0.23,0.3l1.14,0.29l0.16,-0.0l1.18,-0.36l1.97,3.71l-0.45,0.71l-0.04,0.14l-0.12,1.8l-0.05,2.07l-0.92,1.2l-0.03,0.31l0.38,0.8l-0.48,0.72l-0.02,0.3l1.01,2.02l-1.5,2.64Z", "name": "Peru"}, "PK": {"path": "M609.08,187.76l1.66,1.21l0.71,2.11l0.2,0.19l3.62,1.01l-1.98,1.95l-2.65,0.4l-3.75,-0.68l-0.26,0.08l-1.23,1.22l-0.07,0.31l0.89,2.46l0.88,1.92l0.1,0.12l1.67,1.14l-1.8,1.35l-0.12,0.25l0.04,1.85l-2.35,2.67l-1.59,2.79l-2.5,2.72l-2.76,-0.2l-0.24,0.09l-2.76,2.83l0.04,0.45l1.54,1.13l0.27,1.94l0.09,0.17l1.34,1.29l0.4,1.83l-5.14,-0.01l-0.22,0.09l-1.53,1.63l-1.52,-0.56l-0.76,-1.88l-1.93,-2.03l-0.25,-0.09l-4.6,0.5l-4.05,0.05l-3.1,0.33l0.77,-2.53l3.48,-1.33l0.19,-0.33l-0.21,-1.24l-0.19,-0.23l-1.01,-0.37l-0.06,-2.18l-0.17,-0.26l-2.32,-1.16l-0.96,-1.57l-0.56,-0.65l3.16,1.05l0.14,0.01l2.45,-0.4l1.44,0.33l0.3,-0.1l0.4,-0.47l1.58,0.22l0.14,-0.01l3.25,-1.14l0.2,-0.27l0.08,-2.23l1.23,-1.38l1.73,0.0l0.28,-0.2l0.22,-0.61l1.68,-0.32l0.86,0.24l0.27,-0.05l0.98,-0.78l0.11,-0.26l-0.13,-1.57l0.96,-1.52l1.51,-0.67l0.14,-0.41l-0.74,-1.4l1.86,0.07l0.26,-0.13l0.69,-1.01l0.05,-0.2l-0.09,-0.94l1.14,-1.09l0.09,-0.28l-0.29,-1.41l-0.51,-1.07l1.23,-1.05l2.6,-0.58l2.86,-0.33l1.33,-0.54l1.3,-0.29Z", "name": "Pakistan"}, "PH": {"path": "M737.11,263.82l0.25,1.66l0.14,1.34l-0.54,1.46l-0.64,-1.79l-0.5,-0.1l-1.17,1.28l-0.05,0.32l0.74,1.71l-0.49,0.81l-2.6,-1.28l-0.61,-1.57l0.68,-1.07l-0.07,-0.4l-1.59,-1.19l-0.42,0.06l-0.69,0.91l-1.01,-0.08l-0.21,0.06l-1.58,1.2l-0.17,-0.3l0.87,-1.88l1.48,-0.66l1.18,-0.81l0.71,0.92l0.34,0.1l1.9,-0.69l0.18,-0.18l0.34,-0.94l1.57,-0.06l0.29,-0.32l-0.1,-1.38l1.41,0.83l0.36,2.06ZM734.94,254.42l0.56,2.24l-1.41,-0.49l-0.4,0.3l0.07,0.94l0.51,1.3l-0.54,0.26l-0.08,-1.34l-0.25,-0.28l-0.56,-0.1l-0.23,-0.91l1.03,0.14l0.34,-0.31l-0.03,-0.96l-0.06,-0.18l-1.14,-1.44l1.62,0.04l0.57,0.78ZM724.68,238.33l1.48,0.71l0.33,-0.04l0.44,-0.38l0.05,0.13l-0.37,0.97l0.01,0.23l0.81,1.75l-0.59,1.92l-1.37,0.79l-0.14,0.2l-0.39,2.07l0.01,0.14l0.56,2.04l0.23,0.21l1.33,0.28l0.14,-0.0l1.0,-0.27l2.82,1.28l-0.2,1.16l0.12,0.29l0.66,0.5l-0.13,0.56l-1.54,-0.99l-0.89,-1.29l-0.49,0.0l-0.44,0.65l-1.34,-1.28l-0.26,-0.08l-2.18,0.36l-0.96,-0.44l0.09,-0.72l0.69,-0.57l-0.01,-0.47l-0.75,-0.59l-0.47,0.14l-0.15,0.43l-0.86,-1.02l-0.34,-1.02l-0.07,-1.74l0.49,0.41l0.49,-0.21l0.26,-3.99l0.73,-2.1l1.23,0.0ZM731.12,258.92l-0.82,0.75l-0.83,1.64l-0.52,0.5l-1.17,-1.33l0.36,-0.47l0.62,-0.7l0.07,-0.15l0.24,-1.35l0.73,-0.08l-0.31,1.29l0.16,0.34l0.37,-0.09l1.21,-1.6l-0.12,1.24ZM726.66,255.58l0.85,0.45l0.14,0.03l1.28,-0.0l-0.03,0.62l-1.04,0.96l-1.15,0.55l-0.05,-0.71l0.17,-1.26l-0.01,-0.13l-0.16,-0.51ZM724.92,252.06l-0.45,1.5l-0.7,-0.83l-0.95,-1.43l1.44,0.06l0.67,0.7ZM717.48,261.28l-1.87,1.35l0.21,-0.3l1.81,-1.57l1.5,-1.75l0.97,-1.84l0.23,1.08l-1.56,1.33l-1.29,1.7Z", "name": "Philippines"}, "PL": {"path": "M458.8,144.25l-0.96,-1.98l0.18,-1.06l-0.01,-0.15l-0.62,-1.8l-0.82,-1.11l0.56,-0.73l0.05,-0.28l-0.51,-1.51l1.48,-0.87l3.88,-1.58l3.06,-1.14l2.23,0.52l0.15,0.66l0.29,0.23l2.4,0.04l3.11,0.39l4.56,-0.05l1.12,0.32l0.51,0.89l0.1,1.45l0.03,0.12l0.66,1.23l-0.01,1.08l-1.33,0.61l-0.14,0.41l0.74,1.5l0.07,1.53l1.22,2.79l-0.19,0.66l-1.09,0.33l-0.14,0.09l-2.27,2.72l-0.04,0.31l0.35,0.8l-2.22,-1.16l-0.21,-0.02l-1.72,0.44l-1.1,-0.31l-0.21,0.02l-1.3,0.61l-1.11,-1.02l-0.32,-0.05l-0.81,0.35l-1.15,-1.61l-0.21,-0.12l-1.65,-0.17l-0.19,-0.82l-0.23,-0.23l-1.72,-0.37l-0.34,0.17l-0.25,0.56l-0.88,-0.44l0.12,-0.69l-0.25,-0.35l-1.78,-0.27l-1.08,-0.97Z", "name": "Poland"}, "ZM": {"path": "M502.81,308.32l1.09,1.04l0.58,1.94l-0.39,0.66l-0.5,2.05l-0.0,0.14l0.45,1.95l-0.69,0.77l-0.06,0.11l-0.76,2.37l0.15,0.36l0.62,0.31l-6.85,1.9l-0.22,0.33l0.2,1.54l-1.62,0.3l-0.12,0.05l-1.43,1.02l-0.11,0.15l-0.25,0.73l-0.73,0.17l-0.14,0.08l-2.18,2.12l-1.33,1.6l-0.65,0.05l-0.83,-0.29l-2.75,-0.28l-0.24,-0.1l-0.15,-0.27l-0.99,-0.58l-0.12,-0.04l-1.73,-0.14l-1.88,0.54l-1.5,-1.48l-1.61,-2.01l0.11,-7.73l4.92,0.03l0.29,-0.37l-0.19,-0.79l0.34,-0.86l0.0,-0.21l-0.41,-1.11l0.26,-1.14l-0.01,-0.16l-0.12,-0.36l0.18,0.01l0.1,0.56l0.31,0.25l1.14,-0.06l1.44,0.21l0.76,1.05l0.19,0.12l2.01,0.35l0.19,-0.03l1.24,-0.65l0.44,1.03l0.22,0.18l1.81,0.34l0.85,0.99l1.02,1.39l0.24,0.12l1.92,0.02l0.3,-0.32l-0.21,-2.74l-0.47,-0.23l-0.53,0.36l-1.58,-0.89l-0.51,-0.34l0.29,-2.36l0.44,-2.99l-0.03,-0.18l-0.5,-0.99l0.61,-1.38l0.53,-0.24l3.26,-0.41l0.89,0.23l1.01,0.62l1.04,0.44l1.6,0.43l1.35,0.72Z", "name": "Zambia"}, "EE": {"path": "M482.19,120.88l0.23,-1.68l-0.43,-0.31l-0.75,0.37l-1.34,-1.1l-0.18,-1.75l2.92,-0.95l3.07,-0.53l2.66,0.6l2.48,-0.1l0.18,0.31l-1.65,1.96l-0.06,0.26l0.71,3.25l-0.88,0.94l-1.85,-0.01l-2.08,-1.3l-1.14,-0.47l-0.2,-0.01l-1.69,0.51Z", "name": "Estonia"}, "EG": {"path": "M508.07,208.8l-0.66,1.06l-0.53,2.03l-0.64,1.32l-0.32,0.26l-1.74,-1.85l-1.77,-3.86l-0.48,-0.09l-0.26,0.25l-0.07,0.32l1.04,2.88l1.55,2.76l1.89,4.18l0.94,1.48l0.83,1.54l2.08,2.73l-0.3,0.28l-0.1,0.23l0.08,1.72l0.11,0.22l2.91,2.37l-28.78,0.0l0.0,-19.06l-0.73,-2.2l0.61,-1.59l0.0,-0.2l-0.34,-1.04l0.73,-1.08l3.13,-0.04l2.36,0.72l2.48,0.81l1.15,0.43l0.23,-0.01l1.93,-0.87l1.02,-0.78l2.08,-0.21l1.59,0.31l0.62,1.24l0.52,0.03l0.46,-0.71l1.86,0.59l1.95,0.16l0.17,-0.04l0.92,-0.52l1.48,4.24Z", "name": "Egypt"}, "ZA": {"path": "M467.06,373.27l-0.13,-0.29l0.01,-1.58l-0.02,-0.12l-0.71,-1.64l0.59,-0.37l0.14,-0.26l-0.07,-2.13l-0.05,-0.15l-1.63,-2.58l-1.25,-2.31l-1.71,-3.37l0.88,-0.98l0.7,0.52l0.39,1.08l0.23,0.19l1.1,0.19l1.55,0.51l0.14,0.01l1.35,-0.2l0.11,-0.04l2.24,-1.39l0.14,-0.25l0.0,-9.4l0.16,0.09l1.39,2.38l-0.22,1.53l0.04,0.19l0.56,0.94l0.3,0.14l1.79,-0.27l0.16,-0.08l1.23,-1.18l1.17,-0.79l0.1,-0.12l0.57,-1.19l1.02,-0.52l0.9,0.28l1.16,0.73l0.14,0.05l2.04,0.13l0.13,-0.02l1.6,-0.62l0.18,-0.19l0.63,-1.93l1.18,-0.19l0.19,-0.12l0.78,-1.05l0.81,-1.71l2.18,-1.91l3.44,-1.88l0.89,0.02l1.17,0.43l0.21,-0.0l0.76,-0.29l1.07,0.21l1.15,3.55l0.63,1.82l-0.44,2.9l0.1,0.52l-0.74,-0.29l-0.18,-0.01l-0.72,0.19l-0.21,0.2l-0.22,0.74l-0.66,0.97l-0.05,0.18l0.02,0.93l0.09,0.21l1.49,1.46l0.27,0.08l1.47,-0.29l0.22,-0.18l0.43,-1.01l1.29,0.02l-0.51,1.63l-0.29,2.2l-0.59,1.12l-2.2,1.78l-1.06,1.39l-0.72,1.44l-1.39,1.93l-2.81,2.84l-1.75,1.65l-1.85,1.24l-2.55,1.06l-1.23,0.14l-0.24,0.18l-0.22,0.54l-1.27,-0.35l-0.2,0.01l-1.15,0.5l-2.62,-0.52l-0.12,0.0l-1.46,0.33l-0.98,-0.14l-0.16,0.02l-2.55,1.1l-2.11,0.44l-1.59,1.07l-0.93,0.06l-0.97,-0.92l-0.19,-0.08l-0.72,-0.04l-1.0,-1.16l-0.25,0.05ZM493.72,359.24l-1.12,-0.86l-0.31,-0.03l-1.23,0.59l-1.36,1.07l-1.39,1.78l0.01,0.38l1.88,2.11l0.31,0.09l0.9,-0.27l0.18,-0.15l0.4,-0.77l1.28,-0.39l0.18,-0.16l0.42,-0.88l0.76,-1.32l-0.05,-0.37l-0.87,-0.82Z", "name": "South Africa"}, "EC": {"path": "M220.2,293.48l1.25,-1.76l0.02,-0.31l-0.54,-1.09l-0.5,-0.06l-0.78,0.94l-1.03,-0.75l0.33,-0.46l0.05,-0.23l-0.38,-2.04l0.66,-0.28l0.17,-0.19l0.45,-1.52l0.93,-1.58l0.04,-0.2l-0.13,-0.78l1.19,-0.47l1.57,-0.91l2.35,1.34l0.17,0.04l0.28,-0.02l0.52,0.91l0.21,0.15l2.12,0.35l0.2,-0.03l0.55,-0.31l1.08,0.73l0.97,0.54l0.31,1.67l-0.71,1.49l-2.64,2.54l-2.95,0.97l-0.15,0.11l-1.53,2.18l-0.49,1.68l-1.1,0.8l-0.87,-1.05l-0.15,-0.1l-1.01,-0.27l-0.13,-0.0l-0.7,0.14l-0.03,-0.43l0.6,-0.5l0.1,-0.31l-0.26,-0.91Z", "name": "Ecuador"}, "AL": {"path": "M470.27,171.7l0.38,0.19l0.45,-0.18l0.4,0.61l0.11,0.1l0.46,0.24l0.13,0.87l-0.3,0.95l-0.0,0.17l0.36,1.28l0.12,0.17l0.9,0.63l-0.03,0.44l-0.67,0.35l-0.16,0.22l-0.14,0.88l-0.96,1.18l-0.06,-0.03l-0.04,-0.48l-0.12,-0.22l-1.28,-0.92l-0.19,-1.25l0.2,-1.96l0.33,-0.89l-0.06,-0.3l-0.36,-0.41l-0.13,-0.75l0.66,-0.9Z", "name": "Albania"}, "AO": {"path": "M461.62,299.93l0.55,1.67l0.73,1.54l1.56,2.18l0.28,0.12l1.66,-0.2l0.81,-0.34l1.28,0.33l0.33,-0.14l0.39,-0.67l0.56,-1.3l1.37,-0.09l0.27,-0.21l0.07,-0.23l0.67,-0.01l-0.13,0.53l0.29,0.37l2.74,-0.02l0.04,1.29l0.03,0.13l0.46,0.87l-0.35,1.52l0.18,1.55l0.07,0.16l0.75,0.85l-0.13,2.89l0.41,0.29l0.56,-0.21l1.11,0.05l1.5,-0.37l0.9,0.12l0.18,0.53l-0.27,1.15l0.01,0.17l0.4,1.08l-0.33,0.85l-0.01,0.18l0.12,0.51l-4.83,-0.03l-0.3,0.3l-0.12,8.13l0.07,0.19l1.69,2.1l1.27,1.25l-4.03,0.92l-5.93,-0.36l-1.66,-1.19l-0.18,-0.06l-10.15,0.11l-0.34,0.13l-1.35,-1.05l-0.17,-0.06l-1.62,-0.08l-1.6,0.45l-0.88,0.36l-0.17,-1.2l0.34,-2.19l0.85,-2.32l0.14,-1.13l0.79,-2.24l0.57,-1.0l1.42,-1.64l0.82,-1.15l0.05,-0.13l0.26,-1.88l-0.13,-1.51l-0.07,-0.16l-0.72,-0.87l-1.23,-2.91l0.09,-0.37l0.73,-0.95l0.05,-0.27l-1.27,-4.12l-1.19,-1.54l0.1,-0.2l0.86,-0.28l0.78,0.03l0.83,-0.29l7.12,0.03ZM451.81,298.94l-0.17,0.07l-0.5,-1.42l0.85,-0.92l0.53,-0.29l0.48,0.44l-0.56,0.32l-0.1,0.1l-0.41,0.65l-0.05,0.14l-0.07,0.91Z", "name": "Angola"}, "KZ": {"path": "M598.42,172.08l-1.37,0.54l-3.3,2.09l-0.11,0.12l-1.01,1.97l-0.56,0.01l-0.6,-1.24l-0.26,-0.17l-2.95,-0.09l-0.46,-2.22l-0.29,-0.24l-0.91,-0.02l0.17,-2.72l-0.12,-0.26l-3.0,-2.22l-0.2,-0.06l-4.29,0.24l-2.8,0.42l-2.36,-2.7l-6.4,-3.65l-0.23,-0.03l-6.45,1.83l-0.22,0.29l0.1,10.94l-0.84,0.1l-1.65,-2.21l-0.11,-0.09l-1.69,-0.84l-0.2,-0.02l-2.84,0.63l-0.14,0.07l-0.71,0.64l-0.02,-0.11l0.57,-1.17l0.0,-0.26l-0.48,-1.05l-0.17,-0.16l-2.78,-0.99l-1.08,-2.62l-0.13,-0.15l-1.24,-0.7l-0.04,-0.48l2.07,0.25l0.34,-0.29l0.09,-2.03l1.84,-0.44l2.12,0.45l0.36,-0.25l0.45,-3.04l-0.45,-2.06l-0.31,-0.23l-2.44,0.15l-2.07,-0.75l-0.23,0.01l-2.88,1.38l-2.21,0.62l-0.96,-0.38l0.22,-1.39l-0.06,-0.23l-1.6,-2.12l-0.25,-0.12l-1.72,0.08l-1.87,-1.91l1.33,-2.24l-0.06,-0.38l-0.55,-0.5l1.72,-3.08l2.3,1.7l0.48,-0.2l0.29,-2.26l4.99,-3.48l3.76,-0.08l5.46,2.27l2.96,1.33l0.26,-0.01l2.59,-1.36l3.82,-0.06l3.13,1.67l0.38,-0.09l0.63,-0.85l3.36,0.14l0.29,-0.19l0.63,-1.57l-0.13,-0.37l-3.64,-2.05l2.0,-1.36l0.1,-0.38l-0.32,-0.62l2.09,-0.76l0.13,-0.47l-1.65,-2.13l0.89,-0.91l9.27,-1.18l0.13,-0.05l1.17,-0.82l6.2,-1.27l2.26,-1.43l4.19,0.7l0.74,3.39l0.38,0.22l2.52,-0.81l2.9,1.06l-0.18,1.63l0.32,0.33l2.52,-0.23l5.0,-2.58l0.03,0.39l3.16,2.62l5.57,8.48l0.49,0.02l1.18,-1.53l3.22,1.78l0.21,0.03l3.5,-0.83l1.21,0.52l1.16,1.82l0.15,0.12l1.67,0.61l1.01,1.32l0.28,0.11l3.04,-0.41l1.1,1.64l-1.68,1.89l-1.97,0.28l-0.26,0.29l-0.12,3.09l-1.2,1.23l-4.81,-1.01l-0.35,0.2l-1.77,5.51l-1.14,0.62l-4.92,1.23l-0.2,0.41l2.14,5.06l-1.45,0.67l-0.17,0.31l0.15,1.28l-1.05,-0.3l-1.21,-1.04l-0.17,-0.07l-3.73,-0.32l-4.15,-0.08l-0.92,0.31l-3.46,-1.24l-0.22,0.01l-1.42,0.63l-0.17,0.21l-0.32,1.49l-3.82,-0.97l-0.15,0.0l-1.65,0.43l-0.2,0.17l-0.51,1.21Z", "name": "Kazakhstan"}, "ET": {"path": "M516.0,247.63l1.21,0.92l0.3,0.04l1.3,-0.53l0.46,0.41l0.19,0.08l1.65,0.03l2.05,0.96l0.67,0.88l1.07,0.79l1.0,1.45l0.7,0.68l-0.72,0.92l-0.85,1.19l-0.04,0.25l0.19,0.67l0.04,0.74l0.29,0.28l1.4,0.04l0.55,-0.15l0.23,0.19l-0.41,0.67l0.01,0.32l0.92,1.39l0.93,1.23l0.99,0.94l0.1,0.06l8.19,2.99l1.51,0.01l-6.51,6.95l-3.14,0.11l-0.18,0.06l-2.15,1.71l-1.51,0.04l-0.22,0.1l-0.6,0.69l-1.46,-0.0l-0.93,-0.78l-0.32,-0.04l-2.29,1.05l-0.12,0.1l-0.64,0.9l-1.44,-0.17l-0.51,-0.26l-0.17,-0.03l-0.56,0.07l-0.68,-0.02l-3.1,-2.08l-0.17,-0.05l-1.62,0.0l-0.68,-0.65l0.0,-1.28l-0.21,-0.29l-1.19,-0.38l-1.42,-2.63l-0.13,-0.12l-1.05,-0.53l-0.46,-1.0l-1.27,-1.23l-0.17,-0.08l-1.08,-0.13l0.53,-0.9l1.17,-0.05l0.26,-0.17l0.37,-0.77l0.03,-0.14l-0.03,-2.23l0.7,-2.49l1.08,-0.65l0.14,-0.19l0.24,-1.0l1.03,-1.85l1.47,-1.22l0.09,-0.12l1.02,-2.51l0.36,-1.96l2.62,0.48l0.33,-0.18l0.63,-1.55Z", "name": "Ethiopia"}, "ZW": {"path": "M498.95,341.2l-1.16,-0.23l-0.16,0.01l-0.74,0.28l-1.11,-0.41l-1.02,-0.04l-1.52,-1.13l-0.12,-0.05l-1.79,-0.37l-0.65,-1.46l-0.01,-0.86l-0.22,-0.29l-0.99,-0.26l-2.74,-2.77l-0.77,-1.46l-0.52,-0.5l-0.72,-1.54l2.24,0.23l0.78,0.28l0.12,0.02l0.85,-0.06l0.21,-0.11l1.38,-1.66l2.11,-2.05l0.81,-0.18l0.22,-0.2l0.27,-0.8l1.29,-0.93l1.53,-0.28l0.11,0.66l0.3,0.25l2.02,-0.05l1.04,0.48l0.5,0.59l0.18,0.1l1.13,0.18l1.11,0.7l0.01,3.06l-0.49,1.82l-0.11,1.94l0.03,0.16l0.35,0.68l-0.24,1.3l-0.27,0.17l-0.12,0.15l-0.64,1.83l-2.49,2.8Z", "name": "Zimbabwe"}, "ES": {"path": "M398.67,172.8l0.09,-1.45l-0.06,-0.2l-0.82,-1.05l3.16,-1.96l3.01,0.54l3.33,-0.02l2.64,0.52l2.14,-0.15l3.9,0.1l0.91,1.08l0.14,0.09l4.61,1.38l0.26,-0.04l0.77,-0.55l2.66,1.29l0.17,0.03l2.59,-0.35l0.1,1.28l-2.2,1.85l-3.13,0.62l-0.23,0.23l-0.21,0.92l-1.54,1.68l-0.97,2.4l0.02,0.26l0.85,1.46l-1.27,1.14l-0.09,0.14l-0.5,1.73l-1.73,0.53l-0.15,0.1l-1.68,2.1l-3.03,0.04l-2.38,-0.05l-0.17,0.05l-1.57,1.01l-0.9,1.01l-0.96,-0.19l-0.82,-0.86l-0.69,-1.6l-0.22,-0.18l-2.14,-0.41l-0.13,-0.62l0.83,-0.97l0.39,-0.86l-0.06,-0.33l-0.73,-0.73l0.63,-1.74l-0.02,-0.25l-0.8,-1.41l0.69,-0.15l0.23,-0.27l0.09,-1.29l0.33,-0.36l0.08,-0.2l0.03,-2.16l1.03,-0.72l0.1,-0.37l-0.7,-1.5l-0.25,-0.17l-1.46,-0.11l-0.22,0.07l-0.34,0.3l-1.17,0.0l-0.55,-1.29l-0.39,-0.16l-1.02,0.44l-0.45,0.36Z", "name": "Spain"}, "ER": {"path": "M527.15,253.05l-0.77,-0.74l-1.01,-1.47l-1.14,-0.86l-0.62,-0.84l-0.11,-0.09l-2.18,-1.02l-0.12,-0.03l-1.61,-0.03l-0.52,-0.46l-0.31,-0.05l-1.31,0.54l-1.38,-1.06l-0.46,0.12l-0.69,1.68l-2.49,-0.46l-0.2,-0.76l1.06,-3.69l0.24,-1.65l0.66,-0.66l1.76,-0.4l0.16,-0.1l0.97,-1.13l1.24,2.55l0.68,2.34l0.09,0.14l1.4,1.27l3.39,2.4l1.37,1.43l2.14,2.34l0.94,0.6l-0.32,0.26l-0.85,-0.17Z", "name": "Eritrea"}, "ME": {"path": "M469.05,172.9l-0.57,-0.8l-0.1,-0.09l-0.82,-0.46l0.16,-0.33l0.35,-1.57l0.72,-0.62l0.27,-0.16l0.48,0.38l0.35,0.4l0.12,0.08l0.79,0.32l0.66,0.43l-0.43,0.62l-0.28,0.11l-0.07,-0.25l-0.53,-0.1l-1.09,1.49l-0.05,0.23l0.06,0.32Z", "name": "Montenegro"}, "MD": {"path": "M488.2,153.75l0.14,-0.11l1.49,-0.28l1.75,0.95l1.06,0.14l0.92,0.7l-0.15,0.9l0.15,0.31l0.8,0.46l0.33,1.2l0.09,0.14l0.72,0.66l-0.11,0.28l0.1,0.33l-0.06,0.02l-1.25,-0.08l-0.17,-0.29l-0.39,-0.12l-0.52,0.25l-0.16,0.36l0.13,0.42l-0.6,0.88l-0.43,1.03l-0.22,0.12l-0.32,-1.0l0.25,-1.34l-0.08,-1.38l-0.06,-0.17l-1.43,-1.87l-0.81,-1.36l-0.78,-0.95l-0.12,-0.09l-0.29,-0.12Z", "name": "Moldova"}, "MG": {"path": "M544.77,316.45l0.64,1.04l0.6,1.62l0.4,3.04l0.63,1.21l-0.22,1.07l-0.15,0.26l-0.59,-1.05l-0.52,-0.01l-0.47,0.76l-0.04,0.23l0.46,1.84l-0.19,0.92l-0.61,0.53l-0.1,0.21l-0.16,2.15l-0.97,2.98l-1.24,3.59l-1.55,4.97l-0.96,3.67l-1.08,2.93l-1.94,0.61l-2.05,1.06l-3.2,-1.53l-0.62,-1.26l-0.18,-2.39l-0.87,-2.07l-0.22,-1.8l0.4,-1.69l1.01,-0.4l0.19,-0.28l0.01,-0.79l1.15,-1.91l0.04,-0.11l0.23,-1.66l-0.03,-0.17l-0.57,-1.21l-0.46,-1.58l-0.19,-2.25l0.82,-1.36l0.33,-1.51l1.11,-0.1l1.4,-0.53l0.9,-0.45l1.03,-0.03l0.21,-0.09l1.41,-1.45l2.12,-1.65l0.75,-1.29l0.03,-0.24l-0.17,-0.56l0.53,0.15l0.32,-0.1l1.38,-1.77l0.06,-0.18l0.04,-1.44l0.54,-0.74l0.62,0.77Z", "name": "Madagascar"}, "MA": {"path": "M378.66,230.13l0.07,-0.75l0.93,-0.72l0.82,-1.37l0.04,-0.21l-0.14,-0.8l0.8,-1.74l1.33,-1.61l0.79,-0.4l0.14,-0.15l0.66,-1.55l0.08,-1.46l0.83,-1.52l1.6,-0.94l0.11,-0.11l1.56,-2.71l1.2,-0.99l2.24,-0.29l0.17,-0.08l1.95,-1.83l1.3,-0.77l2.09,-2.28l0.07,-0.26l-0.61,-3.34l0.92,-2.3l0.33,-1.44l1.52,-1.79l2.48,-1.27l1.86,-1.16l0.1,-0.11l1.67,-2.93l0.72,-1.59l1.54,0.01l1.43,1.14l0.21,0.06l2.33,-0.19l2.55,0.62l0.97,0.03l0.83,1.6l0.15,1.71l0.86,2.96l0.09,0.14l0.5,0.45l-0.31,0.73l-3.11,0.44l-0.16,0.07l-1.07,0.97l-1.36,0.23l-0.25,0.28l-0.1,1.85l-2.74,1.02l-0.14,0.11l-0.9,1.3l-1.93,0.69l-2.56,0.44l-4.04,2.01l-0.17,0.27l0.02,2.91l-0.08,0.0l-0.3,0.31l0.05,1.15l-1.25,0.07l-0.16,0.06l-0.73,0.55l-0.98,0.0l-0.85,-0.33l-0.15,-0.02l-2.11,0.29l-0.24,0.19l-0.76,1.95l-0.63,0.16l-0.21,0.19l-1.15,3.29l-3.42,2.81l-0.1,0.17l-0.81,3.57l-0.98,1.12l-0.3,0.85l-5.13,0.19Z", "name": "Morocco"}, "UZ": {"path": "M587.83,186.48l0.06,-1.46l-0.19,-0.29l-3.31,-1.24l-2.57,-1.4l-1.63,-1.38l-2.79,-1.98l-1.2,-2.98l-0.12,-0.14l-0.84,-0.54l-0.18,-0.05l-2.61,0.13l-0.76,-0.48l-0.25,-2.25l-0.17,-0.24l-3.37,-1.6l-0.32,0.04l-2.08,1.73l-2.11,1.02l-0.16,0.35l0.31,1.14l-2.14,0.03l-0.09,-10.68l6.1,-1.74l6.25,3.57l2.36,2.72l0.27,0.1l2.92,-0.44l4.17,-0.23l2.78,2.06l-0.18,2.87l0.29,0.32l0.98,0.02l0.46,2.22l0.28,0.24l3.0,0.09l0.61,1.25l0.28,0.17l0.93,-0.02l0.26,-0.16l1.06,-2.06l3.21,-2.03l1.3,-0.5l0.19,0.08l-1.75,1.62l0.05,0.48l1.85,1.12l0.27,0.02l1.65,-0.69l2.4,1.27l-2.69,1.79l-1.79,-0.27l-0.89,0.06l-0.22,-0.52l0.48,-1.26l-0.34,-0.4l-3.35,0.69l-0.22,0.18l-0.78,1.87l-1.07,1.47l-1.93,-0.13l-0.29,0.16l-0.65,1.29l0.16,0.42l1.69,0.64l0.48,1.91l-1.25,2.6l-1.64,-0.53l-1.18,-0.03Z", "name": "Uzbekistan"}, "MM": {"path": "M670.1,233.39l-1.46,1.11l-1.68,0.11l-0.26,0.19l-1.1,2.7l-0.95,0.42l-0.14,0.42l1.21,2.27l1.61,1.92l0.94,1.55l-0.82,1.99l-0.77,0.42l-0.13,0.39l0.64,1.35l1.62,1.97l0.26,1.32l-0.04,1.15l0.02,0.13l0.92,2.18l-1.3,2.23l-0.79,1.69l-0.1,-0.77l0.74,-1.87l-0.02,-0.26l-0.8,-1.42l0.2,-2.68l-0.06,-0.2l-0.98,-1.27l-0.8,-2.98l-0.45,-3.22l-1.11,-2.22l-0.45,-0.1l-1.64,1.28l-2.74,1.76l-1.26,-0.2l-1.27,-0.49l0.79,-2.93l0.0,-0.14l-0.52,-2.42l-1.93,-2.97l0.26,-0.8l-0.22,-0.39l-1.37,-0.31l-1.65,-1.98l-0.12,-1.5l0.41,0.19l0.42,-0.26l0.05,-1.7l1.08,-0.54l0.16,-0.34l-0.24,-1.0l0.5,-0.79l0.05,-0.15l0.08,-2.35l1.58,0.49l0.36,-0.15l1.12,-2.19l0.15,-1.34l1.35,-2.18l0.04,-0.17l-0.07,-1.35l2.97,-1.71l1.67,0.45l0.38,-0.33l-0.18,-1.46l0.7,-0.4l0.15,-0.32l-0.13,-0.72l0.94,-0.13l0.74,1.41l0.11,0.12l0.95,0.56l0.07,1.89l-0.09,2.08l-2.28,2.15l-0.09,0.19l-0.3,3.15l0.35,0.32l2.37,-0.39l0.53,2.17l0.2,0.21l1.3,0.42l-0.63,1.9l0.14,0.36l1.86,0.99l1.1,0.49l0.24,0.0l1.45,-0.6l0.04,0.51l-2.01,1.6l-0.56,0.96l-1.34,0.56Z", "name": "Myanmar"}, "ML": {"path": "M390.79,248.2l0.67,-0.37l0.14,-0.18l0.36,-1.31l0.51,-0.04l1.68,0.69l0.21,0.0l1.34,-0.48l0.89,0.16l0.3,-0.13l0.29,-0.44l9.89,-0.04l0.29,-0.21l0.56,-1.8l-0.11,-0.33l-0.33,-0.24l-2.37,-22.1l3.41,-0.04l8.37,5.73l8.38,5.68l0.56,1.15l0.14,0.14l1.56,0.75l0.99,0.36l0.03,1.45l0.33,0.29l2.45,-0.22l0.01,5.52l-1.3,1.64l-0.06,0.15l-0.18,1.37l-1.99,0.36l-3.4,0.22l-0.19,0.09l-0.85,0.83l-1.48,0.09l-1.49,0.01l-0.54,-0.43l-0.26,-0.05l-1.38,0.36l-2.39,1.08l-0.13,0.12l-0.44,0.73l-1.88,1.11l-0.11,0.12l-0.3,0.57l-0.86,0.42l-1.1,-0.31l-0.28,0.07l-0.69,0.62l-0.09,0.16l-0.35,1.66l-1.93,2.04l-0.08,0.23l0.05,0.76l-0.63,0.99l-0.04,0.19l0.14,1.23l-0.81,0.29l-0.32,0.17l-0.27,-0.75l-0.39,-0.18l-0.65,0.26l-0.36,-0.04l-0.29,0.14l-0.37,0.6l-1.69,-0.02l-0.63,-0.34l-0.32,0.02l-0.12,0.09l-0.47,-0.45l0.1,-0.6l-0.09,-0.27l-0.31,-0.3l-0.33,-0.05l-0.05,0.02l0.02,-0.21l0.46,-0.59l-0.02,-0.39l-0.99,-1.02l-0.34,-0.74l-0.56,-0.56l-0.17,-0.09l-0.5,-0.07l-0.19,0.04l-0.58,0.35l-0.79,0.33l-0.65,0.51l-0.85,-0.16l-0.63,-0.59l-0.14,-0.07l-0.41,-0.08l-0.2,0.03l-0.59,0.31l-0.07,0.0l-0.1,-0.63l0.11,-0.85l-0.21,-0.98l-0.11,-0.17l-0.86,-0.66l-0.45,-1.34l-0.1,-1.36Z", "name": "Mali"}, "MN": {"path": "M641.06,150.59l2.41,-0.53l4.76,-2.8l3.67,-1.49l2.06,0.96l0.12,0.03l2.5,0.05l1.59,1.45l0.19,0.08l2.47,0.12l3.59,0.81l0.27,-0.07l2.43,-2.28l0.06,-0.36l-0.93,-1.77l2.33,-3.1l2.66,1.3l2.26,0.39l2.75,0.8l0.44,2.3l0.19,0.22l3.56,1.38l0.18,0.01l2.35,-0.6l3.1,-0.42l2.4,0.41l2.37,1.52l1.49,1.63l0.23,0.1l2.29,-0.03l3.13,0.52l0.15,-0.01l2.28,-0.79l3.27,-0.53l0.11,-0.04l3.56,-2.23l1.31,0.31l1.26,1.05l0.22,0.07l2.45,-0.22l-0.98,1.96l-1.77,3.21l-0.01,0.28l0.64,1.31l0.35,0.16l1.35,-0.38l2.4,0.48l0.22,-0.04l1.78,-1.09l1.82,0.92l2.11,2.07l-0.17,0.68l-1.79,-0.31l-3.74,0.45l-1.85,0.96l-1.78,2.01l-3.74,1.18l-2.46,1.61l-2.45,-0.6l-1.42,-0.28l-0.31,0.13l-1.31,1.99l0.0,0.33l0.78,1.15l0.3,0.74l-1.58,0.93l-1.75,1.59l-2.83,1.03l-3.77,0.12l-4.05,1.05l-2.81,1.54l-0.95,-0.8l-0.19,-0.07l-2.96,0.0l-3.64,-1.8l-2.55,-0.48l-3.38,0.41l-5.13,-0.67l-2.66,0.06l-1.35,-1.65l-1.12,-2.78l-0.21,-0.18l-1.5,-0.33l-2.98,-1.89l-0.12,-0.04l-3.37,-0.43l-2.84,-0.51l-0.75,-1.13l0.93,-3.54l-0.04,-0.24l-1.73,-2.55l-0.15,-0.12l-3.52,-1.18l-1.99,-1.61l-0.54,-1.85Z", "name": "Mongolia"}, "MK": {"path": "M472.73,173.87l0.08,0.01l0.32,-0.25l0.08,-0.44l1.29,-0.41l1.37,-0.28l1.03,-0.04l1.06,0.82l0.14,1.59l-0.22,0.04l-0.17,0.11l-0.32,0.4l-1.2,-0.05l-0.18,0.05l-0.9,0.61l-1.45,0.23l-0.85,-0.59l-0.3,-1.09l0.22,-0.71Z", "name": "Macedonia"}, "MW": {"path": "M507.18,313.84l-0.67,1.85l-0.01,0.16l0.7,3.31l0.31,0.24l0.75,-0.03l0.78,0.71l0.99,1.75l0.2,3.03l-0.91,0.45l-0.14,0.15l-0.59,1.38l-1.24,-1.21l-0.17,-1.62l0.49,-1.12l0.02,-0.16l-0.15,-1.03l-0.13,-0.21l-0.99,-0.65l-0.26,-0.03l-0.53,0.18l-1.31,-1.12l-1.15,-0.59l0.66,-2.06l0.75,-0.84l0.07,-0.27l-0.47,-2.04l0.48,-1.94l0.4,-0.65l0.03,-0.24l-0.64,-2.15l-0.08,-0.13l-0.44,-0.42l1.34,0.26l1.25,1.73l0.67,3.3Z", "name": "Malawi"}, "MR": {"path": "M390.54,247.66l-1.48,-1.58l-1.51,-1.88l-0.12,-0.09l-1.64,-0.67l-1.17,-0.74l-0.17,-0.05l-1.4,0.03l-0.12,0.03l-1.14,0.52l-1.15,-0.21l-0.26,0.08l-0.44,0.43l-0.11,-0.72l0.68,-1.29l0.31,-2.43l-0.28,-2.63l-0.29,-1.27l0.24,-1.24l-0.03,-0.2l-0.65,-1.24l-1.19,-1.05l0.32,-0.51l9.64,0.02l0.3,-0.34l-0.46,-3.71l0.51,-1.12l2.17,-0.22l0.27,-0.3l-0.08,-6.5l7.91,0.13l0.31,-0.3l0.01,-3.5l8.17,5.63l-2.89,0.04l-0.29,0.33l2.42,22.56l0.12,0.21l0.26,0.19l-0.43,1.38l-9.83,0.04l-0.25,0.13l-0.27,0.41l-0.77,-0.14l-0.15,0.01l-1.3,0.47l-1.64,-0.67l-0.14,-0.02l-0.79,0.06l-0.27,0.22l-0.39,1.39l-0.53,0.29Z", "name": "Mauritania"}, "UG": {"path": "M500.74,287.17l-2.84,-0.02l-0.92,0.32l-1.37,0.71l-0.29,-0.12l0.02,-1.6l0.54,-0.89l0.04,-0.13l0.14,-1.96l0.49,-1.09l0.91,-1.24l0.97,-0.68l0.8,-0.89l-0.13,-0.49l-0.79,-0.27l0.13,-2.55l0.78,-0.52l1.45,0.51l0.18,0.01l1.97,-0.57l1.72,0.01l0.18,-0.06l1.29,-0.97l0.98,1.44l0.29,1.24l1.05,2.75l-0.84,1.68l-1.94,2.66l-0.06,0.18l0.02,2.36l-4.8,0.18Z", "name": "Uganda"}, "MY": {"path": "M717.6,273.52l-1.51,0.7l-2.13,-0.41l-2.88,-0.0l-0.29,0.21l-0.84,2.77l-0.9,0.82l-0.08,0.12l-1.23,3.34l-1.81,0.47l-2.29,-0.68l-0.14,-0.01l-1.2,0.22l-0.14,0.07l-1.36,1.18l-1.47,-0.17l-0.12,0.01l-1.46,0.46l-1.51,-1.25l-0.24,-0.97l1.26,0.59l0.2,0.02l1.93,-0.47l0.22,-0.22l0.47,-1.98l0.9,-0.4l2.97,-0.54l0.17,-0.09l1.8,-1.98l1.02,-1.32l0.9,1.03l0.48,-0.04l0.43,-0.7l1.02,0.07l0.32,-0.27l0.25,-2.72l1.84,-1.67l1.23,-1.89l0.73,-0.01l1.12,1.11l0.1,0.99l0.18,0.24l1.66,0.71l1.85,0.67l-0.09,0.51l-1.45,0.11l-0.26,0.4l0.35,0.97ZM673.78,269.53l0.17,1.14l0.35,0.25l1.65,-0.3l0.18,-0.11l0.68,-0.86l0.31,0.13l1.41,1.45l0.99,1.59l0.13,1.57l-0.26,1.09l0.0,0.15l0.24,0.84l0.18,1.46l0.11,0.2l0.82,0.64l0.92,2.08l-0.03,0.52l-1.4,0.13l-2.29,-1.79l-2.86,-1.92l-0.27,-1.16l-0.07,-0.13l-1.39,-1.61l-0.33,-1.99l-0.05,-0.12l-0.84,-1.27l0.26,-1.72l-0.03,-0.18l-0.45,-0.87l0.13,-0.13l1.71,0.92Z", "name": "Malaysia"}, "MX": {"path": "M133.41,213.83l0.61,0.09l0.27,-0.09l0.93,-1.01l0.08,-0.18l0.09,-1.22l-0.09,-0.23l-1.93,-1.94l-1.46,-0.77l-2.96,-5.62l-0.86,-2.1l2.44,-0.18l2.68,-0.25l-0.03,0.08l0.17,0.4l3.79,1.35l5.81,1.97l6.96,-0.02l0.3,-0.3l0.0,-0.84l3.91,0.0l0.87,0.93l1.27,0.87l1.44,1.17l0.79,1.37l0.62,1.49l0.12,0.14l1.35,0.85l2.08,0.82l0.35,-0.1l1.49,-2.04l1.81,-0.05l1.63,1.01l1.21,1.8l0.86,1.58l1.47,1.55l0.53,1.82l0.73,1.32l0.14,0.13l1.98,0.84l1.78,0.59l0.61,-0.03l-0.78,1.89l-0.45,1.96l-0.19,3.58l-0.24,1.27l0.01,0.14l0.43,1.43l0.78,1.31l0.49,1.98l0.06,0.12l1.63,1.9l0.61,1.51l0.98,1.28l0.16,0.11l2.58,0.67l0.98,1.02l0.31,0.08l2.17,-0.71l1.91,-0.26l1.87,-0.47l1.67,-0.49l1.59,-1.06l0.11,-0.14l0.6,-1.52l0.22,-2.21l0.35,-0.62l1.58,-0.64l2.59,-0.59l2.18,0.09l1.43,-0.2l0.39,0.36l-0.07,1.02l-1.28,1.48l-0.65,1.68l0.07,0.32l0.33,0.32l-0.79,2.49l-0.28,-0.3l-0.24,-0.09l-1.0,0.08l-0.24,0.15l-0.74,1.28l-0.19,-0.13l-0.28,-0.03l-0.3,0.12l-0.19,0.29l0.0,0.06l-4.34,-0.02l-0.3,0.3l-0.0,1.16l-0.83,0.0l-0.28,0.19l0.08,0.33l0.93,0.86l0.9,0.58l0.24,0.48l0.16,0.15l0.2,0.08l-0.03,0.38l-2.94,0.01l-0.26,0.15l-1.21,2.09l0.02,0.33l0.25,0.33l-0.21,0.44l-0.04,0.22l-2.42,-2.35l-1.36,-0.87l-2.04,-0.67l-0.13,-0.01l-1.4,0.19l-2.07,0.98l-1.14,0.23l-1.72,-0.66l-1.85,-0.48l-2.31,-1.16l-1.92,-0.38l-2.79,-1.18l-2.04,-1.2l-0.6,-0.66l-0.19,-0.1l-1.37,-0.15l-2.45,-0.78l-1.07,-1.18l-2.63,-1.44l-1.2,-1.56l-0.44,-0.93l0.5,-0.15l0.2,-0.39l-0.2,-0.58l0.46,-0.55l0.07,-0.19l0.01,-0.91l-0.06,-0.18l-0.81,-1.13l-0.25,-1.08l-0.86,-1.36l-2.21,-2.63l-2.53,-2.09l-1.2,-1.63l-0.11,-0.09l-2.08,-1.06l-0.34,-0.48l0.35,-1.53l-0.16,-0.34l-1.24,-0.61l-1.39,-1.23l-0.6,-1.81l-0.24,-0.2l-1.25,-0.2l-1.38,-1.35l-1.11,-1.25l-0.1,-0.76l-0.05,-0.13l-1.33,-2.04l-0.85,-2.02l0.04,-0.99l-0.14,-0.27l-1.81,-1.1l-0.2,-0.04l-0.74,0.11l-1.34,-0.72l-0.42,0.16l-0.4,1.12l-0.0,0.19l0.41,1.3l0.24,2.04l0.06,0.15l0.88,1.16l1.84,1.86l0.4,0.61l0.12,0.1l0.27,0.14l0.29,0.82l0.31,0.2l0.2,-0.02l0.43,1.51l0.09,0.14l0.72,0.65l0.51,0.91l1.58,1.4l0.8,2.42l0.77,1.23l0.66,1.19l0.13,1.34l0.28,0.27l1.08,0.08l0.92,1.1l0.83,1.08l-0.03,0.24l-0.88,0.81l-0.13,-0.0l-0.59,-1.42l-0.07,-0.11l-1.67,-1.53l-1.81,-1.28l-1.15,-0.61l0.07,-1.85l-0.38,-1.45l-0.12,-0.17l-2.91,-2.03l-0.39,0.04l-0.11,0.11l-0.42,-0.46l-0.11,-0.08l-1.49,-0.63l-1.09,-1.16Z", "name": "Mexico"}, "VU": {"path": "M839.92,325.66l0.78,0.73l-0.18,0.07l-0.6,-0.8ZM839.13,322.74l0.27,1.36l-0.13,-0.06l-0.21,-0.02l-0.29,0.08l-0.22,-0.43l-0.03,-1.32l0.61,0.4Z", "name": "Vanuatu"}, "FR": {"path": "M444.58,172.63l-0.68,1.92l-0.72,-0.38l-0.51,-1.79l0.43,-0.95l1.15,-0.83l0.33,2.04ZM429.71,147.03l1.77,1.57l0.26,0.07l1.16,-0.23l2.12,1.44l0.56,0.28l0.16,0.03l0.61,-0.06l1.09,0.78l0.13,0.05l3.18,0.53l-1.09,1.94l-0.3,2.16l-0.48,0.38l-1.0,-0.26l-0.37,0.32l0.07,0.66l-1.73,1.68l-0.09,0.21l-0.04,1.42l0.41,0.29l0.96,-0.4l0.67,1.07l-0.09,0.78l0.04,0.19l0.61,0.97l-0.71,0.78l-0.07,0.28l0.65,2.39l0.21,0.21l1.09,0.31l-0.2,0.95l-2.08,1.58l-4.81,-0.8l-0.13,0.01l-3.65,0.99l-0.22,0.24l-0.25,1.6l-2.59,0.35l-2.74,-1.33l-0.31,0.03l-0.79,0.57l-4.38,-1.31l-0.79,-0.94l1.16,-1.64l0.05,-0.15l0.48,-6.17l-0.06,-0.21l-2.58,-3.3l-1.89,-1.65l-0.11,-0.06l-3.64,-1.17l-0.2,-1.88l2.92,-0.63l4.14,0.82l0.35,-0.36l-0.65,-3.0l1.77,1.05l0.27,0.02l5.83,-2.54l0.17,-0.19l0.71,-2.54l1.75,-0.53l0.27,0.88l0.27,0.21l1.04,0.05l1.08,1.23ZM289.1,278.45l-0.85,0.84l-0.88,0.13l-0.25,-0.51l-0.21,-0.16l-0.56,-0.1l-0.25,0.07l-0.63,0.55l-0.62,-0.29l0.5,-0.88l0.21,-1.11l0.42,-1.05l-0.03,-0.28l-0.93,-1.42l-0.18,-1.54l1.13,-1.87l2.42,0.78l2.55,2.04l0.33,0.81l-1.4,2.16l-0.77,1.84Z", "name": "France"}, "FI": {"path": "M492.26,76.42l-0.38,3.12l0.12,0.28l3.6,2.69l-2.14,2.96l-0.01,0.33l2.83,4.61l-1.61,3.36l0.03,0.31l2.15,2.87l-0.96,2.44l0.1,0.35l3.51,2.55l-0.81,1.72l-2.28,2.19l-5.28,4.79l-4.51,0.31l-4.39,1.37l-3.87,0.75l-1.34,-1.89l-0.11,-0.09l-2.23,-1.14l0.53,-3.54l-0.01,-0.14l-1.17,-3.37l1.12,-2.13l2.23,-2.44l5.69,-4.33l1.65,-0.84l0.16,-0.31l-0.26,-1.73l-0.15,-0.22l-3.4,-1.91l-0.77,-1.47l-0.07,-6.45l-0.12,-0.24l-3.91,-2.94l-3.0,-1.92l0.97,-0.76l2.6,2.17l0.21,0.07l3.2,-0.21l2.63,1.03l0.3,-0.05l2.39,-1.94l0.09,-0.13l1.18,-3.12l3.63,-1.42l2.87,1.59l-0.98,2.87Z", "name": "Finland"}, "FJ": {"path": "M869.98,327.07l-1.31,0.44l-0.14,-0.41l0.96,-0.41l0.85,-0.17l1.43,-0.78l-0.16,0.65l-1.64,0.67ZM867.58,329.12l0.54,0.47l-0.31,1.0l-1.32,0.3l-1.13,-0.26l-0.17,-0.78l0.72,-0.66l0.98,0.27l0.25,-0.04l0.43,-0.29Z", "name": "Fiji"}, "FK": {"path": "M268.15,427.89l2.6,-1.73l1.98,0.77l0.31,-0.05l1.32,-1.17l1.58,1.18l-0.54,0.84l-3.1,0.92l-1.0,-1.04l-0.39,-0.04l-1.9,1.35l-0.86,-1.04Z", "name": "Falkland Islands"}, "NI": {"path": "M202.1,252.6l0.23,-0.0l0.12,-0.11l0.68,-0.09l0.22,-0.15l0.23,-0.43l0.2,-0.01l0.28,-0.31l-0.04,-0.97l0.29,-0.03l0.5,0.02l0.25,-0.11l0.37,-0.46l0.51,0.35l0.4,-0.06l0.23,-0.28l0.45,-0.29l0.87,-0.7l0.11,-0.21l0.02,-0.26l0.23,-0.12l0.25,-0.48l0.29,0.27l0.14,0.07l0.5,0.12l0.22,-0.03l0.48,-0.28l0.66,-0.02l0.87,-0.33l0.36,-0.32l0.21,0.01l-0.11,0.48l0.0,0.14l0.22,0.8l-0.54,0.85l-0.27,1.03l-0.09,1.18l0.14,0.72l0.05,0.95l-0.24,0.15l-0.13,0.19l-0.23,1.09l0.0,0.14l0.14,0.53l-0.42,0.53l-0.06,0.24l0.12,0.69l0.08,0.15l0.18,0.19l-0.26,0.23l-0.49,-0.11l-0.35,-0.44l-0.16,-0.1l-0.79,-0.21l-0.23,0.03l-0.45,0.26l-1.51,-0.62l-0.31,0.05l-0.17,0.15l-1.81,-1.62l-0.6,-0.9l-1.04,-0.79l-0.77,-0.71Z", "name": "Nicaragua"}, "NL": {"path": "M436.22,136.65l1.82,0.08l0.36,0.89l-0.6,2.96l-0.53,1.06l-1.32,0.0l-0.3,0.34l0.35,2.89l-0.83,-0.47l-1.56,-1.43l-0.29,-0.07l-2.26,0.67l-1.02,-0.15l0.68,-0.48l0.1,-0.12l2.14,-4.84l3.25,-1.35Z", "name": "Netherlands"}, "NO": {"path": "M491.45,67.31l7.06,3.0l-2.52,0.94l-0.11,0.49l2.43,2.49l-3.82,1.59l-1.48,0.3l0.89,-2.61l-0.14,-0.36l-3.21,-1.78l-0.25,-0.02l-3.89,1.52l-0.17,0.17l-1.2,3.17l-2.19,1.78l-2.53,-0.99l-0.13,-0.02l-3.15,0.21l-2.69,-2.25l-0.38,-0.01l-1.43,1.11l-1.47,0.17l-0.26,0.26l-0.33,2.57l-4.42,-0.65l-0.33,0.22l-0.6,2.19l-2.17,-0.01l-0.27,0.16l-4.15,7.68l-3.88,5.76l-0.0,0.33l0.81,1.23l-0.7,1.27l-2.3,-0.06l-0.28,0.18l-1.63,3.72l-0.02,0.13l0.15,5.17l0.07,0.18l1.51,1.84l-0.79,4.24l-2.04,2.5l-0.92,1.75l-1.39,-1.88l-0.44,-0.05l-4.89,4.21l-3.16,0.81l-3.24,-1.74l-0.86,-3.82l-0.78,-8.6l2.18,-2.36l6.56,-3.28l5.0,-4.16l4.63,-5.74l5.99,-8.09l4.17,-3.23l6.84,-5.49l5.39,-1.92l4.06,0.24l0.23,-0.09l3.72,-3.67l4.51,0.19l4.4,-0.89ZM484.58,19.95l4.42,1.82l-3.25,2.68l-7.14,0.65l-7.16,-0.91l-0.39,-1.37l-0.28,-0.22l-3.48,-0.1l-2.25,-2.15l7.09,-1.48l3.55,1.36l0.28,-0.03l2.42,-1.66l6.18,1.41ZM481.99,33.92l-4.73,1.85l-3.76,-1.06l1.27,-1.02l0.04,-0.43l-1.18,-1.35l4.46,-0.94l0.89,1.83l0.17,0.15l2.83,0.96ZM466.5,23.95l7.64,3.87l-5.63,1.94l-0.19,0.19l-1.35,3.88l-2.08,0.96l-0.16,0.19l-1.14,4.18l-2.71,0.18l-4.94,-2.95l1.95,-1.63l-0.08,-0.51l-3.7,-1.54l-4.79,-4.54l-1.78,-4.01l6.29,-1.88l1.25,1.81l0.25,0.13l3.57,-0.08l0.26,-0.17l0.87,-1.79l3.41,-0.18l3.08,1.94Z", "name": "Norway"}, "NA": {"path": "M461.88,357.98l-1.61,-1.77l-0.94,-1.9l-0.54,-2.58l-0.62,-1.95l-0.83,-4.05l-0.06,-3.13l-0.33,-1.5l-0.07,-0.14l-0.95,-1.06l-1.27,-2.12l-1.3,-3.1l-0.59,-1.71l-1.98,-2.46l-0.13,-1.67l0.99,-0.4l1.44,-0.42l1.48,0.07l1.42,1.11l0.31,0.03l0.32,-0.15l9.99,-0.11l1.66,1.18l0.16,0.06l6.06,0.37l4.69,-1.06l2.01,-0.57l1.5,0.14l0.63,0.37l-1.0,0.41l-0.7,0.01l-0.16,0.05l-1.38,0.88l-0.79,-0.88l-0.29,-0.09l-3.83,0.9l-1.84,0.08l-0.29,0.3l-0.07,8.99l-2.18,0.08l-0.29,0.3l-0.0,17.47l-2.04,1.27l-1.21,0.18l-1.51,-0.49l-0.99,-0.18l-0.36,-1.0l-0.1,-0.14l-0.99,-0.74l-0.4,0.04l-0.98,1.09Z", "name": "Namibia"}, "NC": {"path": "M835.87,338.68l2.06,1.63l1.01,0.94l-0.49,0.32l-1.21,-0.62l-1.76,-1.16l-1.58,-1.36l-1.61,-1.79l-0.16,-0.41l0.54,0.02l1.32,0.83l1.08,0.87l0.79,0.73Z", "name": "New Caledonia"}, "NE": {"path": "M426.67,254.17l0.03,-1.04l-0.24,-0.3l-2.66,-0.53l-0.06,-1.0l-0.07,-0.17l-1.37,-1.62l-0.3,-1.04l0.15,-0.94l1.37,-0.09l0.19,-0.09l0.85,-0.83l3.34,-0.22l2.22,-0.41l0.24,-0.26l0.2,-1.5l1.32,-1.65l0.07,-0.19l-0.01,-5.74l3.4,-1.13l7.24,-5.12l8.46,-4.95l3.76,1.08l1.35,1.39l0.36,0.05l1.39,-0.77l0.55,3.66l0.12,0.2l0.82,0.6l0.03,0.69l0.1,0.21l0.87,0.74l-0.47,0.99l-0.96,5.26l-0.13,3.25l-3.08,2.34l-0.1,0.15l-1.08,3.37l0.08,0.31l0.94,0.86l-0.01,1.51l0.29,0.3l1.25,0.05l-0.14,0.66l-0.51,0.11l-0.24,0.26l-0.06,0.57l-0.04,0.0l-1.59,-2.62l-0.21,-0.14l-0.59,-0.1l-0.23,0.05l-1.83,1.33l-1.79,-0.68l-1.42,-0.17l-0.17,0.03l-0.65,0.32l-1.39,-0.07l-0.19,0.06l-1.4,1.03l-1.12,0.05l-2.97,-1.29l-0.26,0.01l-1.12,0.59l-1.08,-0.04l-0.85,-0.88l-0.11,-0.07l-2.51,-0.95l-0.14,-0.02l-2.69,0.3l-0.16,0.07l-0.65,0.55l-0.1,0.16l-0.34,1.41l-0.69,0.98l-0.05,0.15l-0.13,1.72l-1.47,-1.13l-0.18,-0.06l-0.9,0.01l-0.2,0.08l-0.32,0.28Z", "name": "Niger"}, "NG": {"path": "M442.0,272.7l-2.4,0.83l-0.88,-0.12l-0.19,0.04l-0.89,0.52l-1.78,-0.05l-1.23,-1.44l-0.88,-1.87l-1.77,-1.66l-0.21,-0.08l-3.78,0.03l0.13,-3.75l-0.06,-1.58l0.44,-1.47l0.74,-0.75l1.21,-1.56l0.04,-0.29l-0.22,-0.56l0.44,-0.9l0.01,-0.24l-0.54,-1.44l0.26,-2.97l0.72,-1.06l0.33,-1.37l0.51,-0.43l2.53,-0.28l2.38,0.9l0.89,0.91l0.2,0.09l1.28,0.04l0.15,-0.03l1.06,-0.56l2.9,1.26l0.13,0.02l1.28,-0.06l0.16,-0.06l1.39,-1.02l1.36,0.07l0.15,-0.03l0.64,-0.32l1.22,0.13l1.9,0.73l0.28,-0.04l1.86,-1.35l0.33,0.06l1.62,2.67l0.29,0.14l0.32,-0.04l0.73,0.74l-0.19,0.37l-0.12,0.74l-2.03,1.89l-0.07,0.11l-0.66,1.62l-0.35,1.28l-0.48,0.51l-0.07,0.12l-0.48,1.67l-1.26,0.98l-0.1,0.15l-0.38,1.24l-0.58,1.07l-0.2,0.91l-1.43,0.7l-1.26,-0.93l-0.19,-0.06l-0.95,0.04l-0.2,0.09l-1.41,1.39l-0.61,0.02l-0.26,0.17l-1.19,2.42l-0.61,1.67Z", "name": "Nigeria"}, "NZ": {"path": "M857.9,379.62l1.85,3.1l0.33,0.14l0.22,-0.28l0.04,-1.41l0.57,0.4l0.35,2.06l0.17,0.22l2.02,0.94l1.78,0.26l0.22,-0.06l1.31,-1.01l0.84,0.22l-0.53,2.27l-0.67,1.5l-1.71,-0.05l-0.25,0.12l-0.67,0.89l-0.05,0.23l0.21,1.15l-0.31,0.46l-2.15,3.57l-1.6,0.99l-0.28,-0.51l-0.15,-0.13l-0.72,-0.3l1.27,-2.15l0.01,-0.29l-0.82,-1.63l-0.15,-0.14l-2.5,-1.09l0.05,-0.69l1.67,-0.94l0.15,-0.21l0.42,-2.24l-0.11,-1.95l-0.03,-0.12l-0.97,-1.85l0.05,-0.41l-0.09,-0.25l-1.18,-1.17l-1.94,-2.49l-0.86,-1.64l0.38,-0.09l1.24,1.43l0.12,0.08l1.81,0.68l0.67,2.39ZM853.93,393.55l0.57,1.24l0.44,0.12l1.51,-1.03l0.52,0.91l0.0,1.09l-0.88,1.31l-1.62,2.2l-1.26,1.2l-0.05,0.38l0.64,1.02l-1.4,0.03l-0.14,0.04l-2.14,1.16l-0.14,0.17l-0.67,2.0l-1.38,3.06l-3.07,2.19l-2.12,-0.06l-1.55,-0.99l-0.14,-0.05l-2.53,-0.2l-0.31,-0.84l1.25,-2.15l3.07,-2.97l1.62,-0.59l1.81,-1.17l2.18,-1.63l1.55,-1.65l1.08,-2.18l0.9,-0.72l0.11,-0.17l0.35,-1.56l1.37,-1.07l0.4,0.91Z", "name": "New Zealand"}, "NP": {"path": "M641.26,213.53l-0.14,0.95l0.32,1.64l-0.21,0.78l-1.83,0.04l-2.98,-0.62l-1.86,-0.25l-1.37,-1.3l-0.18,-0.08l-3.38,-0.34l-3.21,-1.49l-2.38,-1.34l-2.16,-0.92l0.84,-2.2l1.51,-1.18l0.89,-0.57l1.83,0.77l2.5,1.76l1.39,0.41l0.78,1.21l0.17,0.13l1.91,0.53l2.0,1.17l2.92,0.66l2.63,0.24Z", "name": "Nepal"}, "CI": {"path": "M413.53,272.08l-0.83,0.02l-1.79,-0.49l-1.64,0.03l-3.04,0.46l-1.73,0.72l-2.4,0.89l-0.12,-0.02l0.16,-1.7l0.19,-0.25l0.06,-0.2l-0.08,-0.99l-0.09,-0.19l-1.06,-1.05l-0.15,-0.08l-0.71,-0.15l-0.51,-0.48l0.45,-0.92l0.02,-0.19l-0.24,-1.16l0.07,-0.43l0.14,-0.0l0.3,-0.26l0.15,-1.1l-0.02,-0.15l-0.13,-0.34l0.09,-0.13l0.83,-0.27l0.19,-0.37l-0.62,-2.02l-0.55,-1.0l0.14,-0.59l0.35,-0.14l0.24,-0.16l0.53,0.29l0.14,0.04l1.93,0.02l0.26,-0.14l0.36,-0.58l0.39,0.01l0.43,-0.17l0.28,0.79l0.43,0.16l0.56,-0.31l0.89,-0.32l0.92,0.45l0.39,0.75l0.14,0.13l1.13,0.53l0.3,-0.03l0.81,-0.59l1.02,-0.08l1.49,0.57l0.62,3.33l-1.03,2.09l-0.65,2.84l0.02,0.2l1.05,2.08l-0.07,0.64Z", "name": "Ivory Coast"}, "CH": {"path": "M444.71,156.27l0.05,0.3l-0.34,0.69l0.13,0.4l1.13,0.58l1.07,0.1l-0.12,0.81l-0.87,0.42l-1.75,-0.37l-0.34,0.18l-0.47,1.1l-0.86,0.07l-0.33,-0.38l-0.41,-0.04l-1.34,1.01l-1.02,0.13l-0.93,-0.58l-0.82,-1.32l-0.37,-0.12l-0.77,0.32l0.02,-0.84l1.74,-1.69l0.09,-0.25l-0.04,-0.38l0.73,0.19l0.26,-0.06l0.6,-0.48l2.02,0.02l0.24,-0.12l0.38,-0.51l2.31,0.84Z", "name": "Switzerland"}, "CO": {"path": "M232.24,284.95l-0.94,-0.52l-1.22,-0.82l-0.31,-0.01l-0.62,0.35l-1.88,-0.31l-0.54,-0.95l-0.29,-0.15l-0.37,0.03l-2.34,-1.33l-0.15,-0.35l0.57,-0.11l0.24,-0.32l-0.1,-1.15l0.46,-0.71l1.11,-0.15l0.21,-0.13l1.05,-1.57l0.95,-1.31l-0.08,-0.43l-0.73,-0.47l0.4,-1.24l0.01,-0.16l-0.53,-2.15l0.44,-0.54l0.06,-0.24l-0.4,-2.13l-0.06,-0.13l-0.93,-1.22l0.21,-0.8l0.52,0.12l0.32,-0.13l0.47,-0.75l0.03,-0.27l-0.52,-1.32l0.09,-0.11l1.14,0.07l0.22,-0.08l1.82,-1.71l0.96,-0.25l0.22,-0.28l0.02,-0.81l0.43,-2.01l1.28,-1.04l1.48,-0.05l0.27,-0.19l0.12,-0.31l1.73,0.19l0.2,-0.05l1.96,-1.28l0.97,-0.56l1.16,-1.16l0.64,0.11l0.43,0.44l-0.31,0.55l-1.49,0.39l-0.19,0.16l-0.6,1.2l-0.97,0.74l-0.73,0.94l-0.06,0.13l-0.3,1.76l-0.68,1.44l0.23,0.43l1.1,0.14l0.27,0.97l0.08,0.13l0.49,0.49l0.17,0.85l-0.27,0.86l-0.01,0.14l0.09,0.53l0.2,0.23l0.52,0.18l0.54,0.79l0.27,0.13l3.18,-0.24l1.31,0.29l1.7,2.08l0.31,0.1l0.96,-0.26l1.75,0.13l1.41,-0.27l0.56,0.27l-0.36,1.07l-0.54,0.81l-0.05,0.13l-0.2,1.8l0.51,1.79l0.07,0.12l0.65,0.68l0.05,0.32l-1.16,1.14l0.05,0.47l0.86,0.52l0.6,0.79l0.31,1.01l-0.7,-0.81l-0.44,-0.01l-0.74,0.77l-4.75,-0.05l-0.3,0.31l0.03,1.57l0.25,0.29l1.2,0.21l-0.02,0.24l-0.1,-0.05l-0.22,-0.02l-1.41,0.41l-0.22,0.29l-0.01,1.82l0.11,0.23l1.04,0.85l0.35,1.3l-0.06,1.02l-1.02,6.26l-0.84,-0.89l-0.19,-0.09l-0.25,-0.02l1.35,-2.13l-0.1,-0.42l-1.92,-1.17l-0.2,-0.04l-1.41,0.2l-0.82,-0.39l-0.26,0.0l-1.29,0.62l-1.63,-0.27l-1.4,-2.5l-0.12,-0.12l-1.1,-0.61l-0.83,-1.2l-1.67,-1.19l-0.27,-0.04l-0.54,0.19Z", "name": "Colombia"}, "CN": {"path": "M740.32,148.94l0.22,0.21l4.3,1.03l2.84,2.2l0.99,2.92l0.28,0.2l3.8,0.0l0.15,-0.04l2.13,-1.24l3.5,-0.8l-1.05,2.29l-0.95,1.13l-0.06,0.12l-0.85,3.41l-1.56,2.81l-2.83,-0.51l-0.19,0.03l-2.15,1.09l-0.15,0.34l0.65,2.59l-0.33,3.3l-1.03,0.07l-0.28,0.3l0.01,0.75l-1.09,-1.2l-0.48,0.05l-0.94,1.6l-3.76,1.26l-0.2,0.36l0.29,1.19l-1.67,-0.08l-1.11,-0.88l-0.42,0.05l-1.69,2.08l-2.71,1.57l-2.04,1.88l-3.42,0.84l-0.11,0.05l-1.8,1.34l-1.54,0.46l0.52,-0.53l0.06,-0.33l-0.44,-0.96l1.84,-1.84l0.02,-0.41l-1.32,-1.56l-0.36,-0.08l-2.23,1.08l-2.83,2.06l-1.52,1.85l-2.32,0.13l-0.2,0.09l-1.28,1.37l-0.03,0.37l1.32,1.97l0.18,0.13l1.83,0.43l0.07,1.08l0.18,0.26l1.98,0.84l0.3,-0.03l2.66,-1.96l2.06,1.04l0.12,0.03l1.4,0.07l0.27,1.0l-3.24,0.73l-0.17,0.11l-1.13,1.5l-2.38,1.4l-0.1,0.1l-1.29,1.99l0.1,0.42l2.6,1.5l0.97,2.72l1.52,2.56l1.66,2.08l-0.03,1.76l-1.4,0.67l-0.15,0.38l0.6,1.47l0.13,0.15l1.29,0.75l-0.35,2.0l-0.58,1.96l-1.22,0.21l-0.2,0.14l-1.83,2.93l-2.02,3.51l-2.29,3.13l-3.4,2.42l-3.42,2.18l-2.75,0.3l-0.15,0.06l-1.32,1.01l-0.68,-0.67l-0.41,-0.01l-1.37,1.27l-3.42,1.28l-2.62,0.4l-0.24,0.21l-0.8,2.57l-0.95,0.11l-0.53,-1.54l0.52,-0.89l-0.19,-0.44l-3.36,-0.84l-0.17,0.01l-1.09,0.4l-2.36,-0.64l-1.0,-0.9l0.35,-1.34l-0.23,-0.37l-2.22,-0.47l-1.15,-0.94l-0.36,-0.02l-2.08,1.37l-2.35,0.29l-1.98,-0.01l-0.13,0.03l-1.32,0.63l-1.28,0.38l-0.21,0.33l0.33,2.65l-0.78,-0.04l-0.14,-0.39l-0.07,-1.04l-0.41,-0.26l-1.72,0.71l-0.96,-0.43l-1.63,-0.86l0.65,-1.95l-0.19,-0.38l-1.43,-0.46l-0.56,-2.27l-0.34,-0.22l-2.26,0.38l0.25,-2.65l2.29,-2.15l0.09,-0.2l0.1,-2.21l-0.07,-2.09l-0.15,-0.25l-1.02,-0.6l-0.8,-1.52l-0.31,-0.16l-1.42,0.2l-2.16,-0.32l0.55,-0.74l0.01,-0.35l-1.17,-1.7l-0.41,-0.08l-1.67,1.07l-1.97,-0.63l-0.25,0.03l-2.89,1.73l-2.26,1.99l-1.82,0.3l-1.0,-0.66l-0.15,-0.05l-1.28,-0.06l-1.75,-0.61l-0.24,0.02l-1.35,0.69l-0.1,0.08l-1.2,1.45l-0.14,-1.41l-0.4,-0.25l-1.46,0.55l-2.83,-0.26l-2.77,-0.61l-1.99,-1.17l-1.91,-0.54l-0.78,-1.21l-0.17,-0.13l-1.36,-0.38l-2.54,-1.79l-2.01,-0.84l-0.28,0.02l-0.89,0.56l-3.31,-1.83l-2.35,-1.67l-0.57,-2.49l1.34,0.28l0.36,-0.28l0.08,-1.42l-0.05,-0.19l-0.93,-1.34l0.24,-2.18l-0.07,-0.22l-2.69,-3.32l-0.15,-0.1l-3.97,-1.11l-0.69,-2.05l-0.11,-0.15l-1.79,-1.3l-0.39,-0.73l-0.36,-1.57l0.08,-1.09l-0.18,-0.3l-1.52,-0.66l-0.22,-0.01l-0.51,0.18l-0.52,-2.21l0.59,-0.55l0.06,-0.35l-0.22,-0.44l2.12,-1.24l1.63,-0.55l2.58,0.39l0.31,-0.16l0.87,-1.75l3.05,-0.34l0.21,-0.12l0.84,-1.12l3.87,-1.59l0.15,-0.14l0.35,-0.68l0.03,-0.17l-0.17,-1.51l1.52,-0.7l0.15,-0.39l-2.12,-5.0l4.62,-1.15l1.35,-0.72l0.14,-0.17l1.72,-5.37l4.7,0.99l0.28,-0.08l1.39,-1.43l0.08,-0.2l0.11,-2.95l1.83,-0.26l0.18,-0.1l1.85,-2.08l0.61,-0.17l0.57,1.97l0.1,0.15l2.2,1.75l3.48,1.17l1.59,2.36l-0.93,3.53l0.04,0.24l0.9,1.35l0.2,0.13l2.98,0.53l3.32,0.43l2.97,1.89l1.49,0.35l1.08,2.67l1.52,1.88l0.24,0.11l2.74,-0.07l5.15,0.67l3.36,-0.41l2.39,0.43l3.67,1.81l0.13,0.03l2.92,-0.0l1.02,0.86l0.34,0.03l2.88,-1.59l3.98,-1.03l3.81,-0.13l3.02,-1.12l1.77,-1.61l1.73,-1.01l0.13,-0.37l-0.41,-1.01l-0.72,-1.07l1.09,-1.66l1.21,0.24l2.57,0.63l0.24,-0.04l2.46,-1.62l3.78,-1.19l0.13,-0.09l1.8,-2.03l1.66,-0.84l3.54,-0.41l1.93,0.35l0.34,-0.22l0.27,-1.12l-0.08,-0.29l-2.27,-2.22l-2.08,-1.07l-0.29,0.01l-1.82,1.12l-2.36,-0.47l-0.14,0.01l-1.18,0.34l-0.46,-0.94l1.69,-3.08l1.1,-2.21l2.75,1.12l0.26,-0.02l3.53,-2.06l0.15,-0.26l-0.02,-1.35l2.18,-3.39l1.35,-1.04l0.12,-0.24l-0.03,-1.85l-0.15,-0.25l-1.0,-0.58l1.68,-1.37l3.01,-0.59l3.25,-0.09l3.67,0.99l2.08,1.18l1.51,3.3l0.95,1.45l0.85,1.99l0.92,3.19ZM697.0,237.37l-1.95,1.12l-1.74,-0.68l-0.06,-1.9l1.08,-1.03l2.62,-0.7l1.23,0.05l0.37,0.65l-1.01,1.08l-0.54,1.4Z", "name": "China"}, "CM": {"path": "M453.76,278.92l-0.26,-0.11l-0.18,-0.02l-1.42,0.31l-1.56,-0.33l-1.17,0.16l-3.7,-0.05l0.3,-1.63l-0.04,-0.21l-0.98,-1.66l-0.15,-0.13l-1.03,-0.38l-0.46,-1.01l-0.13,-0.14l-0.48,-0.27l0.02,-0.46l0.62,-1.72l1.1,-2.25l0.54,-0.02l0.2,-0.09l1.41,-1.39l0.73,-0.03l1.32,0.97l0.31,0.03l1.72,-0.85l0.16,-0.2l0.22,-1.0l0.57,-1.03l0.36,-1.18l1.26,-0.98l0.1,-0.15l0.49,-1.7l0.48,-0.51l0.07,-0.13l0.35,-1.3l0.63,-1.54l2.06,-1.92l0.09,-0.17l0.12,-0.79l0.24,-0.41l-0.04,-0.36l-0.89,-0.91l0.04,-0.45l0.28,-0.06l0.85,1.39l0.16,1.59l-0.09,1.66l0.04,0.17l1.09,1.84l-0.86,-0.02l-0.72,0.17l-1.07,-0.24l-0.34,0.17l-0.54,1.19l0.06,0.34l1.48,1.47l1.06,0.44l0.32,0.94l0.73,1.6l-0.32,0.57l-1.23,2.49l-0.54,0.41l-0.12,0.21l-0.19,1.95l0.24,1.08l-0.18,0.67l0.07,0.28l1.13,1.25l0.24,0.93l0.92,1.29l1.1,0.8l0.1,1.01l0.26,0.73l-0.12,0.93l-1.65,-0.49l-2.02,-0.66l-3.19,-0.11Z", "name": "Cameroon"}, "CL": {"path": "M246.8,429.1l-1.14,0.78l-2.25,1.21l-0.16,0.23l-0.37,2.94l-0.75,0.06l-2.72,-1.07l-2.83,-2.34l-3.06,-1.9l-0.71,-1.92l0.67,-1.84l-0.02,-0.25l-1.22,-2.13l-0.31,-5.41l1.02,-2.95l2.59,-2.4l-0.13,-0.51l-3.32,-0.8l2.06,-2.4l0.07,-0.15l0.79,-4.77l2.44,0.95l0.4,-0.22l1.31,-6.31l-0.16,-0.33l-1.68,-0.8l-0.42,0.21l-0.72,3.47l-1.01,-0.27l0.74,-4.06l0.85,-5.46l1.12,-1.96l0.03,-0.22l-0.71,-2.82l-0.19,-2.94l0.76,-0.07l0.26,-0.2l1.53,-4.62l1.73,-4.52l1.07,-4.2l-0.56,-4.2l0.73,-2.2l0.01,-0.12l-0.29,-3.3l1.46,-3.34l0.45,-5.19l0.8,-5.52l0.78,-5.89l-0.18,-4.33l-0.49,-3.47l1.1,-0.56l0.13,-0.13l0.44,-0.88l0.9,1.29l0.32,1.8l0.1,0.18l1.16,0.97l-0.73,2.33l0.01,0.21l1.33,2.91l0.97,3.6l0.35,0.22l1.57,-0.31l0.16,0.34l-0.79,2.51l-2.61,1.25l-0.17,0.28l0.08,4.36l-0.48,0.79l0.01,0.33l0.6,0.84l-1.62,1.55l-1.67,2.6l-0.89,2.47l-0.02,0.13l0.23,2.56l-1.5,2.76l-0.03,0.21l1.15,4.8l0.11,0.17l0.54,0.42l-0.01,2.37l-1.4,2.7l-0.03,0.15l0.06,2.25l-1.8,1.78l-0.09,0.21l0.02,2.73l0.71,2.63l-1.33,0.94l-0.12,0.17l-0.67,2.64l-0.59,3.03l0.4,3.55l-0.84,0.51l-0.14,0.31l0.58,3.5l0.08,0.16l0.96,0.99l-0.7,1.08l0.11,0.43l1.04,0.55l0.19,0.8l-0.89,0.48l-0.16,0.31l0.26,1.77l-0.89,4.06l-1.31,2.67l-0.03,0.19l0.28,1.53l-0.73,1.88l-1.85,1.37l-0.12,0.26l0.22,3.46l0.06,0.16l0.88,1.19l0.28,0.12l1.32,-0.17l-0.04,2.13l0.04,0.15l1.04,1.95l0.24,0.16l5.94,0.44ZM248.79,430.71l0.0,7.41l0.3,0.3l2.67,0.0l1.01,0.06l-0.54,0.91l-1.99,1.01l-1.13,-0.1l-1.42,-0.27l-1.87,-1.06l-2.57,-0.49l-3.09,-1.9l-2.52,-1.83l-2.65,-2.93l0.93,0.32l3.54,2.29l3.32,1.23l0.34,-0.09l1.29,-1.57l0.83,-2.32l2.11,-1.28l1.43,0.32Z", "name": "Chile"}, "CA": {"path": "M280.14,145.66l-1.66,2.88l0.06,0.37l0.37,0.03l1.5,-1.01l1.17,0.49l-0.64,0.83l0.13,0.46l2.22,0.89l0.28,-0.03l1.02,-0.7l2.09,0.83l-0.69,2.1l0.37,0.38l1.43,-0.45l0.27,1.43l0.74,1.88l-0.95,2.5l-0.88,0.09l-1.34,-0.48l0.49,-2.34l-0.14,-0.32l-0.7,-0.4l-0.36,0.04l-2.81,2.66l-0.63,-0.05l1.2,-1.01l-0.1,-0.52l-2.4,-0.77l-2.79,0.18l-4.65,-0.09l-0.22,-0.54l1.37,-0.99l0.01,-0.48l-0.82,-0.65l1.91,-1.79l2.57,-5.17l1.49,-1.81l2.04,-1.07l0.63,0.08l-0.27,0.51l-1.33,2.07ZM193.92,74.85l-0.01,4.24l0.19,0.28l0.33,-0.07l3.14,-3.22l2.65,2.5l-0.71,3.04l0.06,0.26l2.42,2.88l0.46,0.0l2.66,-3.14l1.83,-3.74l0.03,-0.12l0.13,-4.53l3.23,0.31l3.63,0.64l3.18,2.08l0.13,1.91l-1.79,2.22l-0.0,0.37l1.69,2.2l-0.28,1.8l-4.74,2.84l-3.33,0.62l-2.5,-1.21l-0.41,0.17l-0.73,2.05l-2.39,3.44l-0.74,1.78l-2.78,2.61l-3.48,0.26l-0.17,0.07l-1.98,1.68l-0.1,0.21l-0.15,2.33l-2.68,0.45l-0.17,0.09l-3.1,3.2l-2.75,4.38l-0.99,3.06l-0.14,4.31l0.25,0.31l3.5,0.58l1.07,3.24l1.18,2.76l0.34,0.18l3.43,-0.69l4.55,1.52l2.45,1.32l1.76,1.65l0.12,0.07l3.11,0.96l2.63,1.46l0.13,0.04l4.12,0.2l2.41,0.3l-0.36,2.81l0.8,3.51l1.81,3.78l0.08,0.1l3.73,3.17l0.34,0.03l1.93,-1.08l0.13,-0.15l1.35,-3.44l0.01,-0.18l-1.31,-5.38l-0.08,-0.14l-1.46,-1.5l3.68,-1.51l2.84,-2.46l1.45,-2.55l0.04,-0.17l-0.2,-2.39l-0.04,-0.12l-1.7,-3.07l-2.9,-2.64l2.79,-3.66l0.05,-0.27l-1.08,-3.38l-0.8,-5.75l1.45,-0.75l4.18,1.03l2.6,0.38l0.18,-0.03l1.93,-0.95l2.18,1.23l3.01,2.18l0.73,1.42l0.25,0.16l4.18,0.27l-0.06,2.95l0.83,4.7l0.22,0.24l2.19,0.55l1.75,2.08l0.38,0.07l3.63,-2.03l0.11,-0.11l2.38,-4.06l1.36,-1.43l1.76,3.01l3.26,4.68l2.68,4.19l-0.94,2.09l0.12,0.38l3.31,1.98l2.23,1.98l0.13,0.07l3.94,0.89l1.48,1.02l0.96,2.82l0.22,0.2l1.85,0.43l0.88,1.13l0.17,3.53l-1.68,1.16l-1.76,1.14l-4.08,1.17l-0.11,0.06l-3.08,2.65l-4.11,0.52l-5.35,-0.69l-3.76,-0.02l-2.62,0.23l-0.2,0.1l-2.05,2.29l-3.13,1.41l-0.11,0.08l-3.6,4.24l-2.87,2.92l-0.05,0.36l0.33,0.14l2.13,-0.52l0.15,-0.08l3.98,-4.15l5.16,-2.63l3.58,-0.31l1.82,1.3l-2.09,1.91l-0.09,0.29l0.8,3.46l0.82,2.37l0.15,0.17l3.25,1.56l0.16,0.03l4.14,-0.45l0.21,-0.12l2.03,-2.86l0.11,1.46l0.13,0.22l1.26,0.88l-2.7,1.78l-5.51,1.83l-2.52,1.26l-2.75,2.16l-1.52,-0.18l-0.08,-2.16l4.19,-2.47l0.14,-0.34l-0.3,-0.22l-4.01,0.1l-2.66,0.36l-1.45,-1.56l0.0,-4.16l-0.11,-0.23l-1.11,-0.91l-0.28,-0.05l-1.5,0.48l-0.7,-0.7l-0.45,0.02l-1.91,2.39l-0.8,2.5l-0.82,1.31l-0.95,0.43l-0.77,0.15l-0.23,0.2l-0.18,0.56l-8.2,0.02l-0.13,0.03l-1.19,0.61l-2.95,2.45l-0.78,1.13l-4.6,0.01l-0.12,0.02l-1.13,0.48l-0.13,0.44l0.37,0.55l0.2,0.82l-0.01,0.09l-3.1,1.42l-2.63,0.5l-2.84,1.57l-0.47,0.0l-0.72,-0.4l-0.18,-0.27l0.03,-0.15l0.52,-1.0l1.2,-1.71l0.73,-1.8l0.02,-0.17l-1.03,-5.47l-0.15,-0.21l-2.35,-1.32l0.16,-0.29l-0.05,-0.35l-0.37,-0.38l-0.22,-0.09l-0.56,0.0l-0.35,-0.34l-0.11,-0.65l-0.46,-0.2l-0.39,0.26l-0.2,-0.03l-0.11,-0.33l-0.48,-0.25l-0.21,-0.71l-0.15,-0.18l-3.97,-2.07l-4.8,-2.39l-0.25,-0.01l-2.19,0.89l-0.72,0.03l-3.04,-0.82l-0.14,-0.0l-1.94,0.4l-2.4,-0.98l-2.56,-0.51l-1.7,-0.19l-0.62,-0.44l-0.42,-1.67l-0.3,-0.23l-0.85,0.02l-0.29,0.3l-0.01,0.95l-69.26,-0.01l-4.77,-3.14l-1.78,-1.41l-4.51,-1.38l-1.3,-2.73l0.34,-1.96l-0.17,-0.33l-3.06,-1.37l-0.41,-2.58l-0.11,-0.18l-2.92,-2.4l-0.05,-1.53l1.32,-1.59l0.07,-0.2l-0.07,-2.21l-0.16,-0.26l-4.19,-2.22l-2.52,-4.02l-1.56,-2.6l-0.08,-0.09l-2.28,-1.64l-1.65,-1.48l-1.31,-1.89l-0.38,-0.1l-2.51,1.21l-2.28,1.92l-2.03,-2.22l-1.85,-1.71l-2.44,-1.04l-2.28,-0.12l0.03,-37.72l4.27,0.98l4.0,2.13l2.61,0.4l0.24,-0.07l2.17,-1.81l2.92,-1.33l3.63,0.53l0.18,-0.03l3.72,-1.94l3.89,-1.06l1.6,1.72l0.37,0.06l1.87,-1.04l0.14,-0.19l0.48,-1.83l1.37,0.38l4.18,3.96l0.41,0.0l2.89,-2.62l0.28,2.79l0.37,0.26l3.08,-0.73l0.17,-0.12l0.85,-1.16l2.81,0.24l3.83,1.86l5.86,1.61l3.46,0.75l2.44,-0.26l2.89,1.89l-3.12,1.89l-0.14,0.31l0.24,0.24l4.53,0.92l6.84,-0.5l2.04,-0.71l2.54,2.44l0.39,0.02l2.72,-2.16l-0.01,-0.48l-2.26,-1.61l1.27,-1.16l2.94,-0.19l1.94,-0.42l1.89,0.97l2.49,2.32l0.24,0.08l2.71,-0.33l4.35,1.9l0.17,0.02l3.86,-0.67l3.62,0.1l0.31,-0.33l-0.26,-2.44l1.9,-0.65l3.58,1.36l-0.01,3.84l0.23,0.29l0.34,-0.17l1.51,-3.23l1.81,0.1l0.31,-0.22l1.13,-4.37l-0.08,-0.29l-2.68,-2.73l-2.83,-1.76l0.19,-4.73l2.77,-3.15l3.06,0.69l2.44,1.97l3.24,4.88l-2.05,2.02l0.15,0.51l4.41,0.85ZM265.85,150.7l-0.84,0.04l-3.15,-0.99l-1.77,-1.17l0.19,-0.06l3.17,0.79l2.39,1.27l0.01,0.12ZM249.41,3.71l6.68,0.49l5.34,0.79l4.34,1.6l-0.08,1.24l-5.91,2.56l-6.03,1.21l-2.36,1.38l-0.14,0.34l0.29,0.22l4.37,-0.02l-4.96,3.01l-4.06,1.64l-0.11,0.08l-4.21,4.62l-5.07,0.92l-0.12,0.05l-1.53,1.1l-7.5,0.59l-0.28,0.28l0.24,0.31l2.67,0.54l-1.04,0.6l-0.09,0.44l1.89,2.49l-2.11,1.66l-3.83,1.52l-0.15,0.13l-1.14,2.01l-3.41,1.55l-0.16,0.36l0.35,1.19l0.3,0.22l3.98,-0.19l0.03,0.78l-6.42,2.99l-6.44,-1.41l-7.41,0.79l-3.72,-0.62l-4.48,-0.26l-0.25,-2.0l4.37,-1.13l0.21,-0.38l-1.14,-3.55l1.13,-0.28l6.61,2.29l0.35,-0.12l-0.04,-0.37l-3.41,-3.45l-0.14,-0.08l-3.57,-0.92l1.62,-1.7l4.36,-1.3l0.2,-0.18l0.71,-1.94l-0.12,-0.36l-3.45,-2.15l-0.88,-2.43l6.36,0.23l1.94,0.61l0.23,-0.02l3.91,-2.1l0.15,-0.32l-0.26,-0.24l-5.69,-0.67l-8.69,0.37l-4.3,-1.92l-2.12,-2.39l-2.82,-1.68l-0.44,-1.65l3.41,-1.06l2.93,-0.2l4.91,-0.99l3.69,-2.28l2.93,0.31l2.64,1.68l0.42,-0.1l1.84,-3.23l3.17,-0.96l4.45,-0.69l7.56,-0.26l1.26,0.64l0.18,0.03l7.2,-1.06l10.81,0.8ZM203.94,57.59l0.01,0.32l1.97,2.97l0.51,-0.01l2.26,-3.75l6.05,-1.89l4.08,4.72l-0.36,2.95l0.38,0.33l4.95,-1.36l0.11,-0.05l2.23,-1.77l5.37,2.31l3.32,2.14l0.3,1.89l0.36,0.25l4.48,-1.01l2.49,2.8l0.14,0.09l5.99,1.78l2.09,1.74l2.18,3.83l-4.29,1.91l-0.01,0.54l5.9,2.83l3.95,0.94l3.54,3.84l0.2,0.1l3.58,0.25l-0.67,2.51l-4.18,4.54l-2.84,-1.61l-3.91,-3.95l-0.26,-0.09l-3.24,0.52l-0.25,0.26l-0.32,2.37l0.1,0.26l2.63,2.38l3.42,1.89l0.96,1.0l1.57,3.8l-0.74,2.43l-2.85,-0.96l-6.26,-3.15l-0.38,0.09l0.04,0.39l3.54,3.4l2.55,2.31l0.23,0.78l-6.26,-1.43l-5.33,-2.25l-2.73,-1.73l0.67,-0.86l-0.09,-0.45l-7.38,-4.01l-0.44,0.27l0.03,0.89l-6.85,0.61l-1.8,-1.17l1.43,-2.6l4.56,-0.07l5.15,-0.52l0.23,-0.45l-0.76,-1.34l0.8,-1.89l3.21,-4.06l0.05,-0.29l-0.72,-1.95l-0.97,-1.47l-0.11,-0.1l-3.84,-2.1l-4.53,-1.33l1.09,-0.75l0.05,-0.45l-2.65,-2.75l-0.18,-0.09l-2.12,-0.24l-1.91,-1.47l-0.39,0.02l-1.27,1.25l-4.4,0.56l-9.06,-0.99l-5.28,-1.31l-4.01,-0.67l-1.72,-1.31l2.32,-1.85l0.1,-0.33l-0.28,-0.2l-3.3,-0.02l-0.74,-4.36l1.86,-4.09l2.46,-1.88l5.74,-1.15l-1.5,2.55ZM261.28,159.28l0.19,0.14l1.82,0.42l1.66,-0.05l-0.66,0.68l-0.75,0.16l-3.0,-1.25l-0.46,-0.77l0.51,-0.52l0.68,1.19ZM230.87,84.48l-2.48,0.19l-0.52,-1.74l0.96,-2.17l2.03,-0.53l1.71,1.04l0.02,1.6l-0.22,0.46l-1.5,1.16ZM229.52,58.19l0.14,0.82l-4.99,-0.22l-2.73,0.63l-0.59,-0.23l-2.61,-2.4l0.08,-1.38l0.94,-0.25l5.61,0.51l4.14,2.54ZM222.12,105.0l-0.79,1.63l-0.75,-0.22l-0.52,-0.91l0.04,-0.09l0.84,-1.01l0.74,0.06l0.44,0.55ZM183.77,38.22l2.72,1.65l0.16,0.04l4.83,-0.01l1.92,1.52l-0.51,1.75l0.18,0.36l2.84,1.14l1.56,1.19l0.16,0.06l3.37,0.22l3.65,0.42l4.07,-1.1l5.05,-0.43l3.96,0.35l2.53,1.8l0.48,1.79l-1.37,1.16l-3.6,1.03l-3.22,-0.59l-7.17,0.76l-5.1,0.09l-4.0,-0.6l-6.48,-1.56l-0.81,-2.57l-0.3,-2.49l-0.1,-0.19l-2.51,-2.25l-0.16,-0.07l-5.12,-0.63l-2.61,-1.45l0.75,-1.71l4.88,0.32ZM207.46,91.26l0.42,1.62l0.42,0.19l1.12,-0.55l1.35,0.99l2.74,1.39l2.73,1.2l0.2,1.74l0.35,0.26l1.72,-0.29l1.31,0.97l-1.72,0.96l-3.68,-0.9l-1.34,-1.71l-0.43,-0.04l-2.46,2.1l-3.23,1.85l-0.74,-1.98l-0.31,-0.19l-2.47,0.28l1.49,-1.34l0.1,-0.19l0.32,-3.15l0.79,-3.45l1.34,0.25ZM215.59,102.66l-2.73,2.0l-1.49,-0.08l-0.37,-0.7l1.61,-1.56l3.0,0.03l-0.02,0.3ZM202.79,24.07l0.11,0.12l2.54,1.53l-3.01,1.47l-4.55,4.07l-4.3,0.38l-5.07,-0.68l-2.51,-2.09l0.03,-1.72l1.86,-1.4l0.1,-0.34l-0.29,-0.2l-4.49,0.04l-2.63,-1.79l-1.45,-2.36l1.61,-2.38l1.65,-1.69l2.47,-0.4l0.19,-0.48l-0.72,-0.89l5.1,-0.26l3.1,3.05l0.13,0.07l4.21,1.25l3.99,1.06l1.92,3.65ZM187.5,59.3l-0.15,0.1l-2.59,3.4l-2.5,-0.15l-1.47,-3.92l0.04,-2.24l1.22,-1.92l2.34,-1.26l5.11,0.17l4.28,1.06l-3.36,3.86l-2.9,0.9ZM186.19,48.8l-1.15,1.63l-3.42,-0.35l-2.68,-1.15l1.11,-1.88l3.34,-1.27l2.01,1.63l0.79,1.38ZM185.78,35.41l-0.95,0.13l-4.48,-0.33l-0.4,-0.91l4.5,0.07l1.45,0.82l-0.1,0.21ZM180.76,32.56l-3.43,1.03l-1.85,-1.14l-1.01,-1.92l-0.16,-1.87l2.87,0.2l1.39,0.35l2.75,1.75l-0.55,1.6ZM181.03,76.32l-1.21,1.2l-3.19,-1.26l-0.18,-0.01l-1.92,0.45l-2.88,-1.67l1.84,-1.16l1.6,-1.77l2.45,1.17l1.45,0.77l2.05,2.28ZM169.72,54.76l2.83,0.97l0.14,0.01l4.25,-0.58l0.47,1.01l-2.19,2.16l0.07,0.48l3.61,1.95l-0.41,3.84l-3.87,1.68l-2.23,-0.36l-1.73,-1.75l-6.07,-3.53l0.03,-1.01l4.79,0.55l0.3,-0.16l-0.04,-0.34l-2.55,-2.89l2.59,-2.05ZM174.44,40.56l1.49,1.87l0.07,2.48l-1.07,3.52l-3.87,0.48l-2.41,-0.72l0.05,-2.72l-0.33,-0.3l-3.79,0.36l-0.13,-3.31l2.36,0.14l0.15,-0.03l3.7,-1.74l3.44,0.29l0.31,-0.22l0.03,-0.12ZM170.14,31.5l0.75,1.74l-3.52,-0.52l-4.19,-1.77l-4.65,-0.17l1.65,-1.11l-0.05,-0.52l-2.86,-1.26l-0.13,-1.58l4.52,0.7l6.66,1.99l1.84,2.5ZM134.64,58.08l-1.08,1.93l0.34,0.44l5.44,-1.41l3.37,2.32l0.37,-0.02l2.66,-2.28l2.03,1.38l2.01,4.53l0.53,0.04l1.26,-1.93l0.03,-0.27l-1.67,-4.55l1.82,-0.58l2.36,0.73l2.69,1.84l1.53,4.46l0.77,3.24l0.15,0.19l4.22,2.26l4.32,2.04l-0.21,1.51l-3.87,0.34l-0.19,0.5l1.45,1.54l-0.65,1.23l-4.3,-0.65l-4.4,-1.19l-2.97,0.28l-4.67,1.48l-6.31,0.65l-4.27,0.39l-1.26,-1.91l-0.15,-0.12l-3.42,-1.2l-0.16,-0.01l-2.05,0.45l-2.66,-3.02l1.2,-0.34l3.82,-0.76l3.58,0.19l3.27,-0.78l0.23,-0.29l-0.24,-0.29l-4.84,-1.06l-5.42,0.35l-3.4,-0.09l-0.97,-1.22l5.39,-1.7l0.21,-0.33l-0.3,-0.25l-3.82,0.06l-3.95,-1.1l1.88,-3.13l1.68,-1.81l6.54,-2.84l2.11,0.77ZM158.85,56.58l-1.82,2.62l-3.38,-2.9l0.49,-0.39l3.17,-0.18l1.54,0.86ZM149.71,42.7l1.0,1.87l0.37,0.14l2.17,-0.83l2.33,0.2l0.38,2.16l-1.38,2.17l-8.33,0.76l-6.34,2.15l-3.51,0.1l-0.22,-1.13l4.98,-2.12l0.17,-0.34l-0.31,-0.23l-11.27,0.6l-3.04,-0.78l3.14,-4.57l2.2,-1.35l6.87,1.7l4.4,3.0l0.14,0.05l4.37,0.39l0.27,-0.48l-3.41,-4.68l1.96,-1.62l2.28,0.53l0.79,2.32ZM145.44,29.83l-2.18,0.77l-3.79,-0.0l0.02,-0.31l2.34,-1.5l1.2,0.23l2.42,0.83ZM144.83,34.5l-4.44,1.46l-3.18,-1.48l1.6,-1.36l3.51,-0.53l3.1,0.75l-0.6,1.16ZM119.02,65.87l-6.17,2.07l-1.19,-1.82l-0.13,-0.11l-5.48,-2.32l0.92,-1.7l1.73,-3.44l2.16,-3.15l-0.02,-0.36l-2.09,-2.56l7.84,-0.71l3.59,1.02l6.32,0.27l2.35,1.37l2.25,1.71l-2.68,1.04l-6.21,3.41l-3.1,3.28l-0.08,0.21l0.0,1.81ZM129.66,35.4l-0.3,3.55l-1.77,1.67l-2.34,0.27l-4.62,2.2l-3.89,0.76l-2.83,-0.93l3.85,-3.52l5.04,-3.36l3.75,0.07l3.11,-0.7ZM111.24,152.74l-0.82,0.29l-3.92,-1.39l-0.7,-1.06l-0.12,-0.1l-2.15,-1.09l-0.41,-0.84l-0.2,-0.16l-2.44,-0.56l-0.84,-1.56l0.1,-0.36l2.34,0.64l1.53,0.5l2.28,0.34l0.78,1.04l1.24,1.55l0.09,0.08l2.42,1.3l0.81,1.39ZM88.54,134.82l0.14,0.02l2.0,-0.23l-0.67,3.48l0.06,0.24l1.78,2.22l-0.24,-0.0l-1.4,-1.42l-0.91,-1.53l-1.26,-1.08l-0.42,-1.35l0.09,-0.66l0.82,0.31Z", "name": "Canada"}, "CG": {"path": "M453.66,296.61l-0.9,-0.82l-0.35,-0.04l-0.83,0.48l-0.77,0.83l-1.65,-2.13l1.66,-1.2l0.08,-0.39l-0.81,-1.43l0.59,-0.43l1.62,-0.29l0.24,-0.24l0.1,-0.58l0.94,0.84l0.19,0.08l2.21,0.11l0.27,-0.14l0.81,-1.29l0.32,-1.76l-0.27,-1.96l-0.06,-0.15l-1.08,-1.35l1.02,-2.74l-0.09,-0.34l-0.62,-0.5l-0.22,-0.06l-1.66,0.18l-0.55,-1.03l0.12,-0.73l2.85,0.09l1.98,0.65l2.0,0.59l0.38,-0.25l0.17,-1.3l1.26,-2.24l1.34,-1.19l1.54,0.38l1.35,0.12l-0.11,1.15l-0.74,1.34l-0.5,1.61l-0.31,2.22l0.12,1.41l-0.4,0.9l-0.06,0.88l-0.24,0.67l-1.57,1.15l-1.24,1.41l-1.09,2.43l-0.03,0.13l0.08,1.95l-0.55,0.69l-1.46,1.23l-1.32,1.41l-0.61,-0.29l-0.13,-0.57l-0.29,-0.23l-1.36,-0.02l-0.23,0.1l-0.72,0.81l-0.41,-0.16Z", "name": "Republic of the Congo"}, "CF": {"path": "M459.41,266.56l1.9,-0.17l0.22,-0.12l0.36,-0.5l0.14,0.02l0.55,0.51l0.29,0.07l3.15,-0.96l0.12,-0.07l1.05,-0.97l1.29,-0.87l0.12,-0.33l-0.17,-0.61l0.38,-0.12l2.36,0.15l0.15,-0.03l2.36,-1.17l0.12,-0.1l1.78,-2.72l1.18,-0.96l1.23,-0.34l0.21,0.79l0.07,0.13l1.37,1.5l0.01,0.86l-0.39,1.0l-0.01,0.17l0.16,0.78l0.1,0.17l0.91,0.76l1.89,1.09l1.24,0.92l0.02,0.67l0.12,0.23l1.67,1.3l0.99,1.03l0.61,1.46l0.14,0.15l1.79,0.95l0.2,0.4l-0.44,0.14l-1.54,-0.06l-1.98,-0.26l-0.93,0.22l-0.19,0.14l-0.3,0.48l-0.57,0.05l-0.91,-0.49l-0.26,-0.01l-2.7,1.21l-1.04,-0.23l-0.21,0.03l-0.34,0.19l-0.12,0.13l-0.64,1.3l-1.67,-0.43l-1.77,-0.24l-1.58,-0.91l-2.06,-0.85l-0.27,0.02l-1.42,0.88l-0.97,1.27l-0.06,0.14l-0.19,1.46l-1.3,-0.11l-1.67,-0.42l-0.27,0.07l-1.55,1.41l-0.99,1.76l-0.14,-1.18l-0.13,-0.22l-1.1,-0.78l-0.86,-1.2l-0.2,-0.84l-0.07,-0.13l-1.07,-1.19l0.16,-0.59l0.0,-0.15l-0.24,-1.01l0.18,-1.77l0.5,-0.38l0.09,-0.11l1.18,-2.4Z", "name": "Central African Republic"}, "CD": {"path": "M497.85,276.25l-0.14,2.77l0.2,0.3l0.57,0.19l-0.47,0.52l-1.0,0.71l-0.96,1.31l-0.56,1.22l-0.16,2.04l-0.54,0.89l-0.04,0.15l-0.02,1.76l-0.63,0.61l-0.09,0.2l-0.08,1.33l-0.2,0.11l-0.15,0.21l-0.23,1.37l0.03,0.2l0.6,1.08l0.16,2.96l0.44,2.29l-0.24,1.25l0.01,0.15l0.5,1.46l0.07,0.12l1.41,1.37l1.09,2.56l-0.51,-0.11l-3.45,0.45l-0.67,0.3l-0.15,0.15l-0.71,1.61l0.01,0.26l0.52,1.03l-0.43,2.9l-0.31,2.55l0.13,0.29l0.7,0.46l1.75,0.99l0.31,-0.01l0.26,-0.17l0.15,1.9l-1.44,-0.02l-0.94,-1.28l-0.94,-1.1l-0.17,-0.1l-1.76,-0.33l-0.5,-1.18l-0.42,-0.15l-1.44,0.75l-1.79,-0.32l-0.77,-1.05l-0.2,-0.12l-1.59,-0.23l-0.97,0.04l-0.1,-0.53l-0.27,-0.25l-0.86,-0.06l-1.13,-0.15l-1.62,0.37l-1.04,-0.06l-0.32,0.09l0.11,-2.56l-0.08,-0.21l-0.77,-0.87l-0.17,-1.41l0.36,-1.47l-0.03,-0.21l-0.48,-0.91l-0.04,-1.52l-0.3,-0.29l-2.65,0.02l0.13,-0.53l-0.29,-0.37l-1.28,0.01l-0.28,0.21l-0.07,0.24l-1.35,0.09l-0.26,0.18l-0.62,1.45l-0.25,0.42l-1.17,-0.3l-0.19,0.01l-0.79,0.34l-1.44,0.18l-1.41,-1.96l-0.7,-1.47l-0.61,-1.86l-0.28,-0.21l-7.39,-0.03l-0.92,0.3l-0.78,-0.03l-0.78,0.25l-0.11,-0.25l0.35,-0.15l0.18,-0.26l0.07,-1.02l0.33,-0.52l0.72,-0.42l0.52,0.2l0.33,-0.08l0.76,-0.86l0.99,0.02l0.11,0.48l0.16,0.2l0.94,0.44l0.35,-0.07l1.46,-1.56l1.44,-1.21l0.68,-0.85l0.06,-0.2l-0.08,-1.99l1.04,-2.33l1.1,-1.23l1.62,-1.19l0.11,-0.14l0.29,-0.8l0.08,-0.94l0.38,-0.82l0.03,-0.16l-0.13,-1.38l0.3,-2.16l0.47,-1.51l0.73,-1.31l0.04,-0.12l0.15,-1.51l0.21,-1.66l0.89,-1.16l1.16,-0.7l1.9,0.79l1.69,0.95l1.81,0.24l1.85,0.48l0.35,-0.16l0.71,-1.43l0.16,-0.09l1.03,0.23l0.19,-0.02l2.65,-1.19l0.86,0.46l0.17,0.03l0.81,-0.08l0.23,-0.14l0.31,-0.5l0.75,-0.17l1.83,0.26l1.64,0.06l0.72,-0.21l1.39,1.9l0.16,0.11l1.12,0.3l0.24,-0.04l0.58,-0.36l1.05,0.15l0.15,-0.02l1.15,-0.44l0.47,0.84l0.08,0.09l2.08,1.57Z", "name": "Democratic Republic of the Congo"}, "CZ": {"path": "M463.29,152.22l-0.88,-0.47l-0.18,-0.03l-1.08,0.15l-1.86,-0.94l-0.21,-0.02l-0.88,0.24l-0.13,0.07l-1.25,1.17l-1.63,-0.91l-1.38,-1.36l-1.22,-0.75l-0.24,-1.24l-0.33,-0.75l1.53,-0.6l0.98,-0.84l1.74,-0.62l0.11,-0.07l0.47,-0.47l0.46,0.27l0.24,0.03l0.96,-0.3l1.06,0.95l0.15,0.07l1.57,0.24l-0.1,0.6l0.16,0.32l1.36,0.68l0.41,-0.15l0.28,-0.62l1.29,0.28l0.19,0.84l0.26,0.23l1.73,0.18l0.74,1.02l-0.17,0.0l-0.25,0.13l-0.32,0.49l-0.46,0.11l-0.22,0.23l-0.13,0.57l-0.32,0.1l-0.2,0.22l-0.03,0.14l-0.65,0.25l-1.05,-0.05l-0.28,0.17l-0.22,0.43Z", "name": "Czech Republic"}, "CY": {"path": "M505.03,193.75l-1.51,0.68l-1.0,-0.3l-0.32,-0.63l0.69,-0.06l0.41,0.13l0.19,-0.0l0.62,-0.22l0.31,0.02l0.06,0.22l0.49,0.17l0.06,-0.01Z", "name": "Cyprus"}, "CR": {"path": "M213.0,263.84l-0.98,-0.4l-0.3,-0.31l0.16,-0.24l0.05,-0.21l-0.09,-0.56l-0.1,-0.18l-0.76,-0.65l-0.99,-0.5l-0.74,-0.28l-0.13,-0.58l-0.12,-0.18l-0.66,-0.45l-0.34,-0.0l-0.13,0.31l0.13,0.59l-0.17,0.21l-0.34,-0.42l-0.14,-0.1l-0.7,-0.22l-0.23,-0.34l0.01,-0.62l0.31,-0.74l-0.14,-0.38l-0.3,-0.15l0.47,-0.4l1.48,0.6l0.26,-0.02l0.47,-0.27l0.58,0.15l0.35,0.44l0.17,0.11l0.74,0.17l0.27,-0.07l0.3,-0.27l0.52,1.09l0.97,1.02l0.77,0.71l-0.41,0.1l-0.23,0.3l0.01,1.02l0.12,0.24l0.2,0.14l-0.07,0.05l-0.11,0.3l0.08,0.37l-0.23,0.63Z", "name": "Costa Rica"}, "CU": {"path": "M215.01,226.09l2.08,0.18l1.94,0.03l2.24,0.86l0.95,0.92l0.25,0.08l2.22,-0.28l0.79,0.55l3.68,2.81l0.19,0.06l0.77,-0.03l1.18,0.42l-0.12,0.47l0.27,0.37l1.78,0.1l1.59,0.9l-0.11,0.22l-1.5,0.3l-1.64,0.13l-1.75,-0.2l-2.69,0.19l1.0,-0.86l-0.03,-0.48l-1.02,-0.68l-0.13,-0.05l-1.52,-0.16l-0.74,-0.64l-0.57,-1.42l-0.3,-0.19l-1.36,0.1l-2.23,-0.67l-0.71,-0.52l-0.14,-0.06l-3.2,-0.4l-0.42,-0.25l0.56,-0.39l0.12,-0.33l-0.27,-0.22l-2.46,-0.13l-0.2,0.06l-1.72,1.31l-0.94,0.03l-0.25,0.15l-0.29,0.53l-1.04,0.24l-0.29,-0.07l0.7,-0.43l0.1,-0.11l0.5,-0.87l1.04,-0.54l1.23,-0.49l1.86,-0.25l0.62,-0.28Z", "name": "Cuba"}, "SZ": {"path": "M500.95,353.41l-0.41,0.97l-1.16,0.23l-1.29,-1.26l-0.02,-0.71l0.63,-0.93l0.23,-0.7l0.47,-0.12l1.04,0.4l0.32,1.05l0.2,1.08Z", "name": "Swaziland"}, "SY": {"path": "M510.84,199.83l0.09,-0.11l0.07,-0.2l-0.04,-1.08l0.56,-1.4l1.3,-1.01l0.1,-0.34l-0.41,-1.11l-0.24,-0.19l-0.89,-0.11l-0.2,-1.84l0.55,-1.05l1.3,-1.22l0.09,-0.19l0.09,-1.09l0.39,0.27l0.25,0.04l2.66,-0.77l1.35,0.52l2.06,-0.01l2.93,-1.08l1.35,0.04l2.14,-0.34l-0.83,1.16l-1.31,0.68l-0.16,0.3l0.23,2.03l-0.9,3.25l-5.43,2.87l-4.79,2.91l-2.32,-0.92Z", "name": "Syria"}, "KG": {"path": "M599.04,172.15l0.38,-0.9l1.43,-0.37l4.04,1.02l0.37,-0.23l0.36,-1.64l1.17,-0.52l3.45,1.24l0.2,-0.0l0.86,-0.31l4.09,0.08l3.61,0.31l1.18,1.02l0.11,0.06l1.19,0.34l-0.13,0.26l-3.84,1.58l-0.13,0.1l-0.81,1.08l-3.08,0.34l-0.24,0.16l-0.85,1.7l-2.43,-0.37l-0.14,0.01l-1.79,0.61l-2.39,1.4l-0.12,0.39l0.25,0.49l-0.48,0.45l-4.57,0.43l-3.04,-0.94l-2.45,0.18l0.14,-1.02l2.42,0.44l0.27,-0.08l0.81,-0.81l1.76,0.27l0.21,-0.05l3.21,-2.14l-0.03,-0.51l-2.97,-1.57l-0.26,-0.01l-1.64,0.69l-1.38,-0.84l1.81,-1.67l-0.09,-0.5l-0.46,-0.18Z", "name": "Kyrgyzstan"}, "KE": {"path": "M523.3,287.04l0.06,0.17l1.29,1.8l-1.46,0.84l-0.11,0.11l-0.55,0.93l-0.81,0.16l-0.24,0.24l-0.34,1.69l-0.81,1.06l-0.46,1.58l-0.76,0.63l-3.3,-2.3l-0.16,-1.32l-0.15,-0.23l-9.35,-5.28l-0.02,-2.4l1.92,-2.63l0.91,-1.83l0.01,-0.24l-1.09,-2.86l-0.29,-1.24l-1.09,-1.63l2.93,-2.85l0.92,0.3l0.0,1.19l0.09,0.22l0.86,0.83l0.21,0.08l1.65,0.0l3.09,2.08l0.16,0.05l0.79,0.03l0.54,-0.06l0.58,0.28l1.67,0.2l0.28,-0.12l0.69,-0.98l2.04,-0.94l0.86,0.73l0.19,0.07l1.1,0.0l-1.82,2.36l-0.06,0.18l0.03,9.12Z", "name": "Kenya"}, "SS": {"path": "M505.7,261.39l0.02,1.64l-0.27,0.55l-1.15,0.05l-0.24,0.15l-0.85,1.44l0.22,0.45l1.44,0.17l1.15,1.12l0.42,0.95l0.14,0.15l1.06,0.54l1.33,2.45l-3.06,2.98l-1.44,1.08l-1.75,0.01l-1.92,0.56l-1.5,-0.53l-0.27,0.03l-0.85,0.57l-1.98,-1.5l-0.56,-1.02l-0.37,-0.13l-1.32,0.5l-1.08,-0.15l-0.2,0.04l-0.56,0.35l-0.9,-0.24l-1.44,-1.97l-0.39,-0.77l-0.13,-0.13l-1.78,-0.94l-0.65,-1.5l-1.08,-1.12l-1.57,-1.22l-0.02,-0.68l-0.12,-0.23l-1.37,-1.02l-1.17,-0.68l0.2,-0.08l0.86,-0.48l0.14,-0.18l0.63,-2.22l0.6,-1.02l1.47,-0.28l0.35,0.56l1.29,1.48l0.14,0.09l0.69,0.22l0.22,-0.02l0.83,-0.4l1.58,0.08l0.26,0.39l0.25,0.13l2.49,0.0l0.3,-0.25l0.06,-0.35l1.13,-0.42l0.18,-0.18l0.22,-0.63l0.68,-0.38l1.95,1.37l0.23,0.05l1.29,-0.26l0.19,-0.12l1.23,-1.8l1.36,-1.37l0.08,-0.25l-0.21,-1.52l-0.06,-0.15l-0.25,-0.3l0.94,-0.08l0.26,-0.21l0.1,-0.32l0.6,0.09l-0.25,1.67l0.3,1.83l0.11,0.19l1.22,0.94l0.25,0.73l-0.04,1.2l0.26,0.31l0.09,0.01Z", "name": "South Sudan"}, "SR": {"path": "M278.1,270.26l2.71,0.45l0.31,-0.14l0.19,-0.32l1.82,-0.16l2.25,0.56l-1.09,1.81l-0.04,0.19l0.2,1.72l0.05,0.13l0.9,1.35l-0.39,0.99l-0.21,1.09l-0.48,0.8l-1.2,-0.44l-0.17,-0.01l-1.12,0.24l-0.95,-0.21l-0.35,0.2l-0.25,0.73l0.05,0.29l0.3,0.35l-0.06,0.13l-1.01,-0.15l-1.42,-2.03l-0.32,-1.36l-0.29,-0.23l-0.63,-0.0l-0.95,-1.56l0.41,-1.16l0.01,-0.17l-0.08,-0.35l1.29,-0.56l0.18,-0.22l0.35,-1.97Z", "name": "Suriname"}, "KH": {"path": "M680.28,257.89l-0.93,-1.2l-1.24,-2.56l-0.56,-2.9l1.45,-1.92l3.07,-0.46l2.26,0.35l2.03,0.98l0.38,-0.11l1.0,-1.55l1.86,0.79l0.52,1.51l-0.28,2.82l-4.05,1.88l-0.12,0.45l0.79,1.1l-2.2,0.17l-2.08,0.98l-1.89,-0.33Z", "name": "Cambodia"}, "SV": {"path": "M197.02,248.89l0.18,-0.05l0.59,0.17l0.55,0.51l0.64,0.35l0.06,0.22l0.37,0.21l1.01,-0.28l0.38,0.13l0.16,0.13l-0.14,0.81l-0.18,0.38l-1.22,-0.03l-0.84,-0.23l-1.11,-0.52l-1.31,-0.15l-0.49,-0.38l0.02,-0.08l0.76,-0.57l0.46,-0.27l0.11,-0.35Z", "name": "El Salvador"}, "SK": {"path": "M468.01,150.02l0.05,0.07l0.36,0.1l0.85,-0.37l1.12,1.02l0.33,0.05l1.38,-0.65l1.07,0.3l0.16,0.0l1.69,-0.43l1.95,1.02l-0.51,0.64l-0.45,1.2l-0.32,0.2l-2.55,-0.93l-0.17,-0.01l-0.82,0.2l-0.17,0.11l-0.53,0.68l-0.94,0.32l-0.14,-0.11l-0.29,-0.04l-1.18,0.48l-0.95,0.09l-0.26,0.21l-0.15,0.47l-1.84,0.34l-0.82,-0.31l-1.14,-0.73l-0.2,-0.89l0.42,-0.84l0.91,0.05l0.12,-0.02l0.86,-0.33l0.18,-0.21l0.03,-0.13l0.32,-0.1l0.2,-0.22l0.12,-0.55l0.39,-0.1l0.18,-0.13l0.3,-0.45l0.43,-0.0Z", "name": "Slovakia"}, "KR": {"path": "M737.31,185.72l0.84,0.08l0.27,-0.12l0.89,-1.2l1.63,-0.13l1.1,-0.2l0.21,-0.16l0.12,-0.24l1.86,2.95l0.59,1.79l0.02,3.17l-0.84,1.38l-2.23,0.55l-1.95,1.14l-1.91,0.21l-0.22,-1.21l0.45,-2.07l-0.01,-0.17l-0.99,-2.67l1.54,-0.4l0.17,-0.46l-1.55,-2.24Z", "name": "South Korea"}, "SI": {"path": "M455.77,159.59l1.79,0.21l0.18,-0.04l1.2,-0.68l2.12,-0.08l0.21,-0.1l0.38,-0.42l0.1,0.01l0.28,0.62l-1.71,0.71l-0.18,0.22l-0.21,1.1l-0.71,0.26l-0.2,0.28l0.01,0.55l-0.59,-0.04l-0.79,-0.47l-0.38,0.06l-0.36,0.41l-0.84,-0.05l0.05,-0.15l-0.56,-1.24l0.21,-1.17Z", "name": "Slovenia"}, "KP": {"path": "M747.76,172.02l-0.23,-0.04l-0.26,0.08l-1.09,1.02l-0.78,1.06l-0.06,0.19l0.09,1.95l-1.12,0.57l-0.53,0.58l-0.88,0.82l-1.69,0.51l-1.09,0.79l-0.12,0.22l-0.07,1.17l-0.22,0.25l0.09,0.47l0.96,0.46l1.22,1.1l-0.19,0.37l-0.91,0.16l-1.75,0.14l-0.22,0.12l-0.87,1.18l-0.95,-0.09l-0.3,0.18l-0.97,-0.44l-0.39,0.13l-0.25,0.44l-0.29,0.09l-0.03,-0.2l-0.18,-0.23l-0.62,-0.25l-0.43,-0.29l0.52,-0.97l0.52,-0.3l0.13,-0.38l-0.18,-0.42l0.59,-1.47l0.01,-0.21l-0.16,-0.48l-0.22,-0.2l-1.41,-0.31l-0.82,-0.55l1.74,-1.62l2.73,-1.58l1.62,-1.96l0.96,0.76l0.17,0.06l2.17,0.11l0.31,-0.37l-0.32,-1.31l3.61,-1.21l0.16,-0.13l0.79,-1.34l1.25,1.38Z", "name": "North Korea"}, "SO": {"path": "M543.8,256.48l0.61,-0.05l1.14,-0.37l1.31,-0.25l0.12,-0.05l1.11,-0.81l0.57,-0.0l0.03,0.39l-0.23,1.49l0.01,1.25l-0.52,0.92l-0.7,2.71l-1.19,2.79l-1.54,3.2l-2.13,3.66l-2.12,2.79l-2.92,3.39l-2.47,2.0l-3.76,2.5l-2.33,1.9l-2.77,3.06l-0.61,1.35l-0.28,0.29l-1.22,-1.69l-0.03,-8.92l2.12,-2.76l0.59,-0.68l1.47,-0.04l0.18,-0.06l2.15,-1.71l3.16,-0.11l0.21,-0.09l7.08,-7.55l1.76,-2.12l1.14,-1.57l0.06,-0.18l0.01,-4.67Z", "name": "Somalia"}, "SN": {"path": "M379.28,250.34l-0.95,-1.82l-0.09,-0.1l-0.83,-0.6l0.62,-0.28l0.13,-0.11l1.21,-1.8l0.6,-1.31l0.71,-0.68l1.09,0.2l0.18,-0.02l1.17,-0.53l1.25,-0.03l1.17,0.73l1.59,0.65l1.47,1.83l1.59,1.7l0.12,1.56l0.49,1.46l0.1,0.14l0.85,0.65l0.18,0.82l-0.08,0.57l-0.13,0.05l-1.29,-0.19l-0.29,0.13l-0.11,0.16l-0.35,0.04l-1.83,-0.61l-5.84,-0.13l-0.12,0.02l-0.6,0.26l-0.87,-0.06l-1.01,0.32l-0.26,-1.26l1.9,0.04l0.16,-0.04l0.54,-0.32l0.37,-0.02l0.15,-0.05l0.78,-0.5l0.92,0.46l0.12,0.03l1.09,0.04l0.15,-0.03l1.08,-0.57l0.11,-0.44l-0.51,-0.74l-0.39,-0.1l-0.76,0.39l-0.62,-0.01l-0.92,-0.58l-0.18,-0.05l-0.79,0.04l-0.2,0.09l-0.48,0.51l-2.41,0.06Z", "name": "Senegal"}, "SL": {"path": "M392.19,267.53l-0.44,-0.12l-1.73,-0.97l-1.24,-1.28l-0.4,-0.84l-0.27,-1.65l1.21,-1.0l0.09,-0.12l0.27,-0.66l0.32,-0.41l0.56,-0.05l0.16,-0.07l0.5,-0.41l1.75,0.0l0.59,0.77l0.49,0.96l-0.07,0.64l0.04,0.19l0.36,0.58l-0.03,0.84l0.24,0.2l-0.64,0.65l-1.13,1.37l-0.06,0.14l-0.12,0.66l-0.43,0.58Z", "name": "Sierra Leone"}, "SB": {"path": "M826.74,311.51l0.23,0.29l-0.95,-0.01l-0.39,-0.63l0.65,0.27l0.45,0.09ZM825.01,308.52l-1.18,-1.39l-0.37,-1.06l0.24,0.0l0.82,1.84l0.49,0.6ZM823.21,309.42l-0.44,0.03l-1.43,-0.24l-0.32,-0.24l0.08,-0.5l1.29,0.31l0.72,0.47l0.11,0.18ZM817.9,303.81l2.59,1.44l0.3,0.41l-1.21,-0.66l-1.34,-0.89l-0.34,-0.3ZM813.77,302.4l0.48,0.34l0.1,0.08l-0.33,-0.17l-0.25,-0.25Z", "name": "Solomon Islands"}, "SA": {"path": "M528.24,243.1l-0.2,-0.69l-0.07,-0.12l-0.69,-0.71l-0.18,-0.94l-0.12,-0.19l-1.24,-0.89l-1.28,-2.09l-0.7,-2.08l-0.07,-0.11l-1.73,-1.79l-0.11,-0.07l-1.03,-0.39l-1.57,-2.36l-0.27,-1.72l0.1,-1.53l-0.03,-0.15l-1.44,-2.93l-1.25,-1.13l-1.34,-0.56l-0.72,-1.33l0.11,-0.49l-0.02,-0.2l-0.7,-1.38l-0.08,-0.1l-0.68,-0.56l-0.97,-1.98l-2.8,-4.03l-0.25,-0.13l-0.85,0.01l0.29,-1.11l0.12,-0.97l0.23,-0.81l2.52,0.39l0.23,-0.06l1.08,-0.84l0.6,-0.95l1.78,-0.35l0.22,-0.17l0.37,-0.83l0.74,-0.42l0.08,-0.46l-2.17,-2.4l4.55,-1.26l0.12,-0.06l0.36,-0.32l2.83,0.71l3.67,1.91l7.04,5.5l0.17,0.06l4.64,0.22l2.06,0.24l0.55,1.15l0.28,0.17l1.56,-0.06l0.9,2.15l0.14,0.15l1.14,0.57l0.39,0.85l0.11,0.13l1.59,1.06l0.12,0.91l-0.23,0.83l0.01,0.18l0.32,0.9l0.07,0.11l0.68,0.7l0.33,0.86l0.37,0.65l0.09,0.1l0.76,0.53l0.25,0.04l0.45,-0.12l0.35,0.75l0.1,0.63l0.96,2.68l0.23,0.19l7.53,1.33l0.27,-0.09l0.24,-0.26l0.87,1.41l-1.58,4.96l-7.34,2.54l-7.28,1.02l-2.34,1.17l-0.12,0.1l-1.74,2.63l-0.86,0.32l-0.49,-0.68l-0.28,-0.12l-0.92,0.12l-2.32,-0.25l-0.41,-0.23l-0.15,-0.04l-2.89,0.06l-0.63,0.2l-0.91,-0.59l-0.43,0.11l-0.66,1.27l-0.03,0.21l0.21,0.89l-0.6,0.45Z", "name": "Saudi Arabia"}, "SE": {"path": "M476.42,90.44l-0.15,0.1l-2.43,2.86l-0.07,0.24l0.36,2.31l-3.84,3.1l-4.83,3.38l-0.11,0.15l-1.82,5.45l0.03,0.26l1.78,2.68l2.27,1.99l-2.13,3.88l-2.49,0.82l-0.2,0.24l-0.95,6.05l-1.32,3.09l-2.82,-0.32l-0.3,0.16l-1.34,2.64l-2.48,0.14l-0.76,-3.15l-2.09,-4.04l-1.85,-5.01l1.03,-1.98l2.06,-2.53l0.06,-0.13l0.83,-4.45l-0.06,-0.25l-1.54,-1.86l-0.15,-5.0l1.52,-3.48l2.28,0.06l0.27,-0.16l0.87,-1.59l-0.01,-0.31l-0.8,-1.21l3.79,-5.63l4.07,-7.54l2.23,0.01l0.29,-0.22l0.59,-2.15l4.46,0.66l0.34,-0.26l0.34,-2.64l1.21,-0.14l3.24,2.08l3.78,2.85l0.06,6.37l0.03,0.14l0.67,1.29l-3.95,1.07Z", "name": "Sweden"}, "SD": {"path": "M505.98,259.75l-0.31,-0.9l-0.1,-0.14l-1.2,-0.93l-0.27,-1.66l0.29,-1.83l-0.25,-0.34l-1.16,-0.17l-0.33,0.21l-0.11,0.37l-1.3,0.11l-0.21,0.49l0.55,0.68l0.18,1.29l-1.31,1.33l-1.18,1.72l-1.04,0.21l-2.0,-1.4l-0.32,-0.02l-0.95,0.52l-0.14,0.16l-0.21,0.6l-1.16,0.43l-0.19,0.23l-0.04,0.27l-2.08,0.0l-0.25,-0.39l-0.24,-0.13l-1.81,-0.09l-0.14,0.03l-0.8,0.38l-0.49,-0.16l-1.22,-1.39l-0.42,-0.67l-0.31,-0.14l-1.81,0.35l-0.2,0.14l-0.72,1.24l-0.61,2.14l-0.73,0.4l-0.62,0.22l-0.83,-0.68l-0.12,-0.6l0.38,-0.97l0.01,-1.14l-0.08,-0.2l-1.39,-1.53l-0.25,-0.97l0.03,-0.57l-0.11,-0.25l-0.81,-0.66l-0.03,-1.34l-0.04,-0.14l-0.52,-0.98l-0.31,-0.15l-0.42,0.07l0.12,-0.44l0.63,-1.03l0.03,-0.23l-0.24,-0.88l0.69,-0.66l0.02,-0.41l-0.4,-0.46l0.58,-1.39l1.04,-1.71l1.97,0.16l0.32,-0.3l-0.12,-10.24l0.02,-0.8l2.59,-0.01l0.3,-0.3l0.0,-4.92l29.19,0.0l0.68,2.17l-0.4,0.35l-0.1,0.27l0.36,2.69l0.93,3.15l0.12,0.16l2.05,1.4l-0.99,1.15l-1.75,0.4l-0.15,0.08l-0.79,0.79l-0.08,0.17l-0.24,1.69l-1.07,3.75l-0.0,0.16l0.25,0.96l-0.38,2.1l-0.98,2.41l-1.52,1.3l-1.07,1.94l-0.25,0.99l-1.08,0.64l-0.13,0.18l-0.46,1.65Z", "name": "Sudan"}, "DO": {"path": "M241.7,234.97l0.15,-0.22l1.73,0.01l1.43,0.64l0.15,0.03l0.45,-0.04l0.36,0.74l0.28,0.17l1.02,-0.04l-0.04,0.43l0.27,0.33l1.03,0.09l0.91,0.7l-0.57,0.64l-0.99,-0.47l-0.16,-0.03l-1.11,0.11l-0.79,-0.12l-0.26,0.09l-0.38,0.4l-0.66,0.11l-0.28,-0.45l-0.38,-0.12l-0.83,0.37l-0.14,0.13l-0.85,1.49l-0.27,-0.17l-0.1,-0.58l0.05,-0.67l-0.07,-0.21l-0.44,-0.53l0.35,-0.25l0.12,-0.19l0.19,-1.0l-0.2,-1.4Z", "name": "Dominican Republic"}, "DJ": {"path": "M528.78,253.36l0.34,0.45l-0.06,0.76l-1.26,0.54l-0.05,0.53l0.82,0.53l-0.57,0.83l-0.3,-0.25l-0.27,-0.05l-0.56,0.17l-1.07,-0.03l-0.04,-0.56l-0.16,-0.56l0.76,-1.07l0.76,-0.97l0.89,0.18l0.25,-0.06l0.51,-0.42Z", "name": "Djibouti"}, "DK": {"path": "M452.4,129.07l-1.27,2.39l-2.25,-1.69l-0.26,-1.08l3.15,-1.0l0.63,1.39ZM447.87,126.25l-0.35,0.76l-0.47,-0.24l-0.38,0.09l-1.8,2.53l-0.03,0.29l0.56,1.4l-1.22,0.4l-1.68,-0.41l-0.92,-1.76l-0.07,-3.47l0.38,-0.88l0.62,-0.93l2.07,-0.21l0.19,-0.1l0.84,-0.95l1.5,-0.76l-0.06,1.26l-0.7,1.1l-0.03,0.25l0.3,1.0l0.18,0.19l1.06,0.42Z", "name": "Denmark"}, "DE": {"path": "M445.51,131.69l0.03,0.94l0.21,0.28l2.32,0.74l-0.02,1.0l0.37,0.3l2.55,-0.65l1.36,-0.89l2.63,1.27l1.09,1.01l0.51,1.51l-0.6,0.78l-0.0,0.36l0.88,1.17l0.58,1.68l-0.18,1.08l0.03,0.18l0.87,1.81l-0.66,0.2l-0.55,-0.32l-0.36,0.05l-0.58,0.58l-1.73,0.62l-0.99,0.84l-1.77,0.7l-0.16,0.4l0.42,0.94l0.26,1.34l0.14,0.2l1.25,0.76l1.22,1.2l-0.71,1.2l-0.81,0.37l-0.17,0.32l0.34,1.99l-0.04,0.09l-0.47,-0.39l-0.17,-0.07l-1.2,-0.1l-1.85,0.57l-2.15,-0.13l-0.29,0.18l-0.21,0.5l-0.96,-0.67l-0.24,-0.05l-0.67,0.16l-2.6,-0.94l-0.34,0.1l-0.42,0.57l-1.64,-0.02l0.26,-1.88l1.24,-2.15l-0.21,-0.45l-3.54,-0.58l-0.98,-0.71l0.12,-1.26l-0.05,-0.2l-0.44,-0.64l0.27,-2.18l-0.38,-3.14l1.17,-0.0l0.27,-0.17l0.63,-1.26l0.65,-3.17l-0.02,-0.17l-0.41,-1.0l0.32,-0.47l1.77,-0.16l0.37,0.6l0.47,0.06l1.7,-1.69l0.06,-0.33l-0.55,-1.24l-0.09,-1.51l1.5,0.36l0.16,-0.01l1.22,-0.4Z", "name": "Germany"}, "YE": {"path": "M553.53,242.65l-1.51,0.58l-0.17,0.16l-0.48,1.14l-0.07,0.79l-2.31,1.0l-3.98,1.19l-2.28,1.8l-0.97,0.12l-0.7,-0.14l-0.23,0.05l-1.42,1.03l-1.51,0.47l-2.07,0.13l-0.68,0.15l-0.17,0.1l-0.49,0.6l-0.57,0.16l-0.18,0.13l-0.3,0.49l-1.06,-0.05l-0.13,0.02l-0.73,0.32l-1.48,-0.11l-0.55,-1.26l0.07,-1.32l-0.04,-0.16l-0.39,-0.72l-0.48,-1.85l-0.52,-0.79l0.08,-0.02l0.22,-0.36l-0.23,-1.05l0.24,-0.39l0.04,-0.19l-0.09,-0.95l0.96,-0.72l0.11,-0.31l-0.23,-0.98l0.46,-0.88l0.75,0.49l0.26,0.03l0.63,-0.22l2.76,-0.06l0.5,0.25l2.42,0.26l0.85,-0.11l0.52,0.71l0.35,0.1l1.17,-0.43l0.15,-0.12l1.75,-2.64l2.22,-1.11l6.95,-0.96l2.55,5.58Z", "name": "Yemen"}, "AT": {"path": "M463.17,154.15l-0.14,0.99l-1.15,0.01l-0.24,0.47l0.39,0.56l-0.75,1.84l-0.36,0.4l-2.06,0.07l-0.14,0.04l-1.18,0.67l-1.96,-0.23l-3.43,-0.78l-0.5,-0.97l-0.33,-0.16l-2.47,0.55l-0.2,0.16l-0.18,0.37l-1.27,-0.38l-1.28,-0.09l-0.81,-0.41l0.25,-0.51l0.03,-0.18l-0.05,-0.28l0.35,-0.08l1.16,0.81l0.45,-0.13l0.27,-0.64l2.0,0.12l1.84,-0.57l1.05,0.09l0.71,0.59l0.47,-0.11l0.23,-0.54l0.02,-0.17l-0.32,-1.85l0.69,-0.31l0.13,-0.12l0.73,-1.23l1.61,0.89l0.35,-0.04l1.35,-1.27l0.7,-0.19l1.84,0.93l0.18,0.03l1.08,-0.15l0.81,0.43l-0.07,0.15l-0.02,0.2l0.24,1.06Z", "name": "Austria"}, "DZ": {"path": "M450.58,224.94l-8.31,4.86l-7.23,5.12l-3.46,1.13l-2.42,0.22l-0.02,-1.33l-0.2,-0.28l-1.15,-0.42l-1.45,-0.69l-0.55,-1.13l-0.1,-0.12l-8.45,-5.72l-17.72,-12.17l0.03,-0.38l-0.02,-3.21l3.84,-1.91l2.46,-0.41l2.1,-0.75l0.14,-0.11l0.9,-1.3l2.84,-1.06l0.19,-0.27l0.09,-1.81l1.21,-0.2l0.15,-0.07l1.06,-0.96l3.19,-0.46l0.23,-0.18l0.46,-1.08l-0.08,-0.34l-0.6,-0.54l-0.83,-2.85l-0.18,-1.8l-0.82,-1.57l2.13,-1.37l2.65,-0.49l0.13,-0.05l1.55,-1.15l2.34,-0.85l4.2,-0.51l4.07,-0.23l1.21,0.41l0.23,-0.01l2.3,-1.11l2.52,-0.02l0.94,0.62l0.2,0.05l1.25,-0.13l-0.36,1.03l-0.01,0.14l0.39,2.66l-0.56,2.2l-1.49,1.52l-0.08,0.24l0.22,2.12l0.11,0.2l1.94,1.58l0.02,0.54l0.12,0.23l1.45,1.06l1.04,4.85l0.81,2.42l0.13,1.19l-0.43,2.17l0.17,1.28l-0.31,1.53l0.2,1.56l-0.9,1.02l-0.01,0.38l1.43,1.88l0.09,1.06l0.04,0.13l0.89,1.48l0.37,0.12l1.03,-0.43l1.79,1.12l0.89,1.34Z", "name": "Algeria"}, "US": {"path": "M892.64,99.05l1.16,0.57l0.21,0.02l1.45,-0.38l1.92,0.99l2.17,0.47l-1.65,0.72l-1.75,-0.79l-0.93,-0.7l-0.21,-0.06l-2.11,0.22l-0.35,-0.2l0.09,-0.87ZM183.29,150.37l0.39,1.54l0.12,0.17l0.78,0.55l0.14,0.05l1.74,0.2l2.52,0.5l2.4,0.98l0.17,0.02l1.96,-0.4l3.01,0.81l0.91,-0.02l2.22,-0.88l4.67,2.33l3.86,2.01l0.21,0.71l0.15,0.18l0.33,0.17l-0.02,0.05l0.23,0.43l0.67,0.1l0.21,-0.05l0.1,-0.07l0.05,0.29l0.09,0.16l0.5,0.5l0.21,0.09l0.56,0.0l0.13,0.13l-0.2,0.36l0.12,0.41l2.49,1.39l0.99,5.24l-0.69,1.68l-1.16,1.64l-0.6,1.18l-0.06,0.31l0.04,0.22l0.28,0.43l0.11,0.1l0.85,0.47l0.15,0.04l0.63,0.0l0.14,-0.04l2.87,-1.58l2.6,-0.49l3.28,-1.5l0.17,-0.23l0.04,-0.43l-0.23,-0.93l-0.24,-0.39l0.74,-0.32l4.7,-0.01l0.25,-0.13l0.77,-1.15l2.9,-2.41l1.04,-0.52l8.35,-0.02l0.28,-0.21l0.2,-0.6l0.7,-0.14l1.06,-0.48l0.13,-0.11l0.92,-1.49l0.75,-2.39l1.67,-2.08l0.59,0.6l0.3,0.07l1.52,-0.49l0.88,0.72l-0.0,4.14l0.08,0.2l1.6,1.72l0.31,0.72l-2.42,1.35l-2.55,1.05l-2.64,0.9l-0.14,0.11l-1.33,1.81l-0.44,0.7l-0.05,0.15l-0.03,1.6l0.03,0.14l0.83,1.59l0.24,0.16l0.78,0.06l-1.15,0.33l-1.25,-0.04l-1.83,0.52l-2.51,0.29l-2.17,0.88l-0.17,0.36l0.33,0.22l3.55,-0.54l0.15,0.11l-2.87,0.73l-1.19,0.0l-0.16,-0.33l-0.36,0.06l-0.76,0.82l0.17,0.5l0.42,0.08l-0.45,1.75l-1.4,1.74l-0.04,-0.17l-0.21,-0.22l-0.48,-0.13l-0.77,-0.69l-0.36,-0.03l-0.12,0.34l0.52,1.58l0.09,0.14l0.52,0.43l0.03,0.87l-0.74,1.05l-0.39,0.63l0.05,-0.12l-0.08,-0.34l-1.19,-1.03l-0.28,-2.31l-0.26,-0.26l-0.32,0.19l-0.48,1.27l-0.01,0.19l0.39,1.33l-1.14,-0.31l-0.36,0.18l0.14,0.38l1.57,0.85l0.1,2.58l0.22,0.28l0.55,0.15l0.21,0.81l0.33,2.72l-1.46,1.94l-2.5,0.81l-0.12,0.07l-1.58,1.58l-1.15,0.17l-0.15,0.06l-1.27,1.03l-0.09,0.13l-0.32,0.85l-2.71,1.79l-1.45,1.37l-1.18,1.64l-0.05,0.12l-0.39,1.96l0.0,0.13l0.44,1.91l0.85,2.37l1.1,1.91l0.03,1.2l1.16,3.07l-0.08,1.74l-0.1,0.99l-0.57,1.48l-0.54,0.24l-0.97,-0.26l-0.34,-1.02l-0.12,-0.16l-0.89,-0.58l-2.44,-4.28l-0.34,-0.94l0.49,-1.71l-0.02,-0.21l-0.7,-1.5l-2.0,-2.35l-0.11,-0.08l-0.98,-0.42l-0.25,0.01l-2.42,1.19l-0.26,-0.08l-1.26,-1.29l-1.57,-0.68l-0.16,-0.02l-2.79,0.34l-2.18,-0.3l-1.98,0.19l-1.12,0.45l-0.14,0.44l0.4,0.65l-0.04,1.02l0.09,0.22l0.29,0.3l-0.06,0.05l-0.77,-0.33l-0.26,0.01l-0.87,0.48l-1.64,-0.08l-1.79,-1.39l-0.23,-0.06l-2.11,0.33l-1.75,-0.61l-0.14,-0.01l-1.61,0.2l-2.11,0.64l-0.11,0.06l-2.25,1.99l-2.53,1.21l-1.43,1.38l-0.58,1.22l-0.03,0.12l-0.03,1.86l0.13,1.32l0.3,0.62l-0.46,0.04l-1.71,-0.57l-1.85,-0.79l-0.63,-1.14l-0.54,-1.85l-0.07,-0.12l-1.45,-1.51l-0.86,-1.58l-1.26,-1.87l-0.09,-0.09l-1.76,-1.09l-0.17,-0.04l-2.05,0.05l-0.23,0.12l-1.44,1.97l-1.84,-0.72l-1.19,-0.76l-0.6,-1.45l-0.9,-1.52l-1.49,-1.21l-1.27,-0.87l-0.89,-0.96l-0.22,-0.1l-4.34,-0.0l-0.3,0.3l-0.0,0.84l-6.62,0.02l-5.66,-1.93l-3.48,-1.24l0.11,-0.25l-0.3,-0.42l-3.18,0.3l-2.6,0.2l-0.35,-1.19l-0.08,-0.13l-1.62,-1.61l-0.13,-0.08l-1.02,-0.29l-0.22,-0.66l-0.25,-0.2l-1.31,-0.13l-0.82,-0.7l-0.16,-0.07l-2.25,-0.27l-0.48,-0.34l-0.28,-1.44l-0.07,-0.14l-2.41,-2.84l-2.03,-3.89l0.08,-0.58l-0.1,-0.27l-1.08,-0.94l-1.87,-2.36l-0.33,-2.31l-0.07,-0.15l-1.24,-1.5l0.52,-2.4l-0.09,-2.57l-0.78,-2.3l0.96,-2.83l0.61,-5.66l-0.46,-4.26l-0.79,-2.71l-0.68,-1.4l0.13,-0.26l3.24,0.97l1.28,2.88l0.52,0.06l0.62,-0.84l0.06,-0.22l-0.4,-2.61l-0.74,-2.29l68.9,-0.0l0.3,-0.3l0.01,-0.95l0.32,-0.01ZM32.5,67.43l1.75,1.99l0.41,0.04l1.02,-0.81l3.79,0.25l-0.1,0.72l0.24,0.34l3.83,0.77l2.6,-0.44l5.21,1.41l4.84,0.43l1.9,0.57l0.15,0.01l3.25,-0.71l3.72,1.32l2.52,0.58l-0.03,38.14l0.29,0.3l2.41,0.11l2.34,1.0l1.7,1.59l2.22,2.42l0.42,0.03l2.41,-2.04l2.25,-1.08l1.23,1.76l1.71,1.53l2.24,1.62l1.54,2.56l2.56,4.09l0.11,0.11l4.1,2.17l0.06,1.93l-1.12,1.35l-1.22,-1.14l-2.08,-1.05l-0.68,-2.94l-0.09,-0.16l-3.18,-2.84l-1.32,-3.35l-0.25,-0.19l-2.43,-0.24l-3.93,-0.09l-2.85,-1.02l-5.24,-3.85l-6.77,-2.04l-3.52,0.3l-4.84,-1.7l-2.96,-1.6l-0.23,-0.02l-2.78,0.8l-0.21,0.35l0.46,2.31l-1.11,0.19l-2.9,0.78l-2.24,1.26l-2.42,0.68l-0.29,-1.79l1.07,-3.49l2.54,-1.11l0.12,-0.45l-0.69,-0.96l-0.41,-0.07l-3.19,2.12l-1.76,2.54l-3.57,2.62l-0.03,0.46l1.63,1.59l-2.14,2.38l-2.64,1.49l-2.49,1.09l-0.16,0.17l-0.58,1.48l-3.8,1.79l-0.14,0.14l-0.75,1.57l-2.75,1.41l-1.62,-0.25l-0.16,0.02l-2.35,0.98l-2.54,1.19l-2.06,1.15l-4.05,0.93l-0.1,-0.15l2.45,-1.45l2.49,-1.1l2.61,-1.88l3.03,-0.39l0.19,-0.1l1.2,-1.41l3.43,-2.11l0.61,-0.75l1.81,-1.24l0.13,-0.2l0.42,-2.7l1.24,-2.12l-0.03,-0.35l-0.34,-0.09l-2.73,1.05l-0.67,-0.53l-0.39,0.02l-1.13,1.11l-1.43,-1.62l-0.49,0.06l-0.41,0.8l-0.67,-1.31l-0.42,-0.12l-2.43,1.43l-1.18,-0.0l-0.18,-1.86l0.43,-1.3l-0.09,-0.33l-1.61,-1.33l-0.26,-0.06l-3.11,0.68l-2.0,-1.66l-1.61,-0.85l-0.01,-1.97l-0.11,-0.23l-1.76,-1.48l0.86,-1.96l2.01,-2.13l0.88,-1.94l1.79,-0.25l1.65,0.6l0.31,-0.06l1.91,-1.8l1.67,0.31l0.22,-0.04l1.91,-1.23l0.13,-0.33l-0.47,-1.82l-0.15,-0.19l-1.0,-0.52l1.51,-1.27l0.09,-0.34l-0.29,-0.19l-1.62,0.06l-2.66,0.88l-0.13,0.09l-0.62,0.72l-1.77,-0.8l-0.16,-0.02l-3.48,0.44l-3.5,-0.92l-1.06,-1.61l-2.78,-2.09l3.07,-1.51l5.52,-2.01l1.65,0.0l-0.28,1.73l0.31,0.35l5.29,-0.16l0.23,-0.49l-2.03,-2.59l-0.1,-0.08l-3.03,-1.58l-1.79,-2.12l-2.4,-1.83l-3.18,-1.27l1.13,-1.84l4.28,-0.14l0.15,-0.05l3.16,-2.0l0.13,-0.17l0.57,-2.07l2.43,-2.02l2.42,-0.52l4.67,-1.98l2.22,0.29l0.2,-0.04l3.74,-2.37l3.57,0.91ZM37.66,123.49l-2.31,1.26l-1.04,-0.75l-0.31,-1.35l2.06,-1.16l1.24,-0.51l1.48,0.22l0.76,0.81l-1.89,1.49ZM30.89,233.84l1.2,0.57l0.35,0.3l0.48,0.69l-1.6,0.86l-0.3,0.31l-0.24,-0.14l0.05,-0.54l-0.02,-0.15l-0.36,-0.83l0.05,-0.12l0.39,-0.38l0.07,-0.31l-0.09,-0.27ZM29.06,231.89l0.5,0.14l0.31,0.19l-0.46,0.1l-0.34,-0.43ZM25.02,230.13l0.2,-0.11l0.4,0.47l-0.43,-0.05l-0.17,-0.31ZM21.29,228.68l0.1,-0.07l0.22,0.02l0.02,0.21l-0.02,0.02l-0.32,-0.18ZM6.0,113.33l-1.19,0.45l-1.5,-0.64l-0.94,-0.63l1.76,-0.46l1.71,0.29l0.16,0.98Z", "name": "United States of America"}, "LV": {"path": "M473.99,127.16l0.07,-2.15l1.15,-2.11l2.05,-1.07l1.84,2.48l0.25,0.12l2.01,-0.07l0.29,-0.25l0.45,-2.58l1.85,-0.56l0.98,0.4l2.13,1.33l0.16,0.05l1.97,0.01l1.02,0.7l0.21,1.67l0.71,1.84l-2.44,1.23l-1.36,0.53l-2.28,-1.62l-0.12,-0.05l-1.18,-0.2l-0.28,-0.6l-0.31,-0.17l-2.43,0.35l-4.17,-0.23l-0.12,0.02l-2.45,0.93Z", "name": "Latvia"}, "UY": {"path": "M276.9,363.17l1.3,-0.23l2.4,2.04l0.22,0.07l0.82,-0.07l2.48,1.7l1.93,1.5l1.28,1.67l-0.95,1.14l-0.04,0.31l0.63,1.45l-0.96,1.57l-2.65,1.47l-1.73,-0.53l-0.15,-0.01l-1.25,0.28l-2.22,-1.16l-0.16,-0.03l-1.56,0.08l-1.33,-1.36l0.17,-1.58l0.48,-0.55l0.07,-0.2l-0.02,-2.74l0.66,-2.8l0.57,-2.02Z", "name": "Uruguay"}, "LB": {"path": "M510.44,198.11l-0.48,0.03l-0.26,0.17l-0.15,0.32l-0.21,-0.0l0.72,-1.85l1.19,-1.9l0.74,0.09l0.27,0.73l-1.19,0.93l-0.09,0.13l-0.54,1.36Z", "name": "Lebanon"}, "LA": {"path": "M684.87,248.8l0.61,-0.86l0.05,-0.16l0.11,-2.17l-0.08,-0.22l-1.96,-2.16l-0.15,-2.44l-0.08,-0.18l-1.9,-2.1l-0.19,-0.1l-1.89,-0.18l-0.29,0.15l-0.42,0.76l-1.21,0.06l-0.67,-0.41l-0.31,-0.0l-2.2,1.29l-0.05,-1.77l0.61,-2.7l-0.27,-0.37l-1.44,-0.1l-0.12,-1.31l-0.12,-0.21l-0.87,-0.65l0.38,-0.68l1.76,-1.41l0.08,0.22l0.27,0.2l1.33,0.07l0.31,-0.34l-0.35,-2.75l0.85,-0.25l1.32,1.88l1.11,2.36l0.27,0.17l2.89,0.02l0.78,1.82l-1.32,0.56l-0.12,0.09l-0.72,0.93l0.1,0.45l2.93,1.52l3.62,5.27l1.88,1.78l0.58,1.67l-0.38,2.11l-1.87,-0.79l-0.37,0.11l-0.99,1.54l-1.51,-0.73Z", "name": "Laos"}, "TW": {"path": "M725.6,222.5l-1.5,4.22l-0.82,1.65l-1.01,-1.7l-0.26,-1.8l1.4,-2.48l1.8,-1.81l0.76,0.53l-0.38,1.39Z", "name": "Taiwan"}, "TT": {"path": "M266.35,259.46l0.41,-0.39l0.09,-0.23l-0.04,-0.75l1.14,-0.26l0.2,0.03l-0.07,1.37l-1.73,0.23Z", "name": "Trinidad and Tobago"}, "TR": {"path": "M513.25,175.38l3.63,1.17l0.14,0.01l2.88,-0.45l2.11,0.26l0.18,-0.03l2.9,-1.53l2.51,-0.13l2.25,1.37l0.36,0.88l-0.23,1.36l0.19,0.33l1.81,0.72l0.61,0.53l-1.31,0.64l-0.16,0.34l0.76,3.24l-0.44,0.8l0.01,0.3l1.19,2.02l-0.71,0.29l-0.74,-0.62l-0.15,-0.07l-2.91,-0.37l-0.15,0.02l-1.04,0.43l-2.78,0.44l-1.44,-0.03l-2.83,1.06l-1.95,0.01l-1.28,-0.52l-0.2,-0.01l-2.62,0.76l-0.7,-0.48l-0.47,0.22l-0.13,1.49l-1.01,0.94l-0.58,-0.82l0.79,-0.9l0.04,-0.34l-0.31,-0.15l-1.46,0.23l-2.03,-0.64l-0.3,0.07l-1.65,1.58l-3.58,0.3l-1.94,-1.47l-0.17,-0.06l-2.7,-0.1l-0.28,0.17l-0.51,1.06l-1.47,0.29l-2.32,-1.46l-0.17,-0.05l-2.55,0.05l-1.4,-2.7l-1.72,-1.54l1.11,-2.06l-0.07,-0.37l-1.35,-1.19l2.47,-2.51l3.74,-0.11l0.26,-0.17l0.96,-2.07l4.56,0.38l0.19,-0.05l2.97,-1.92l2.84,-0.83l4.03,-0.06l4.31,2.08ZM488.85,176.8l-1.81,1.38l-0.57,-1.01l0.02,-0.36l0.45,-0.25l0.13,-0.15l0.78,-1.87l-0.11,-0.37l-0.72,-0.47l1.91,-0.71l1.89,0.35l0.25,0.97l0.17,0.2l1.87,0.83l-0.19,0.31l-2.82,0.16l-0.18,0.07l-1.06,0.91Z", "name": "Turkey"}, "LK": {"path": "M625.44,266.07l-0.35,2.4l-0.9,0.61l-1.91,0.5l-1.04,-1.75l-0.43,-3.5l1.0,-3.6l1.34,1.09l1.13,1.72l1.16,2.52Z", "name": "Sri Lanka"}, "TN": {"path": "M444.91,206.18l-0.99,-4.57l-0.12,-0.18l-1.43,-1.04l-0.02,-0.53l-0.11,-0.22l-1.95,-1.59l-0.19,-1.85l1.44,-1.47l0.08,-0.14l0.59,-2.34l-0.38,-2.77l0.44,-1.28l2.52,-1.08l1.41,0.28l-0.06,1.2l0.43,0.28l1.81,-0.9l0.02,0.06l-1.14,1.28l-0.08,0.2l-0.02,1.32l0.11,0.24l0.74,0.6l-0.29,2.18l-1.56,1.35l-0.09,0.32l0.48,1.54l0.28,0.21l1.11,0.04l0.55,1.17l0.15,0.14l0.76,0.35l-0.12,1.79l-1.1,0.72l-0.8,0.91l-1.68,1.04l-0.13,0.32l0.25,1.08l-0.18,0.96l-0.74,0.39Z", "name": "Tunisia"}, "TL": {"path": "M734.21,307.22l0.17,-0.34l1.99,-0.52l1.72,-0.08l0.78,-0.3l0.29,0.1l-0.43,0.32l-2.57,1.09l-1.71,0.59l-0.05,-0.49l-0.19,-0.36Z", "name": "East Timor"}, "TM": {"path": "M553.16,173.51l-0.12,1.0l-0.26,-0.65l0.38,-0.34ZM553.54,173.16l0.13,-0.12l0.43,-0.09l-0.56,0.21ZM555.68,172.6l0.65,-0.14l1.53,0.76l1.71,2.29l0.27,0.12l1.27,-0.14l2.81,-0.04l0.29,-0.38l-0.35,-1.27l1.98,-0.97l1.96,-1.63l3.05,1.44l0.25,2.23l0.14,0.22l0.96,0.61l0.18,0.05l2.61,-0.13l0.68,0.44l1.2,2.97l0.1,0.13l2.85,2.03l1.67,1.41l2.66,1.45l3.13,1.17l-0.05,1.23l-0.36,-0.04l-1.12,-0.73l-0.44,0.14l-0.34,0.89l-1.96,0.52l-0.22,0.23l-0.47,2.17l-1.26,0.78l-1.93,0.42l-0.21,0.18l-0.46,1.14l-1.64,0.33l-2.3,-0.97l-0.2,-2.23l-0.28,-0.27l-1.76,-0.1l-2.78,-2.48l-0.15,-0.07l-1.95,-0.31l-2.82,-1.48l-1.78,-0.27l-0.18,0.03l-1.03,0.51l-1.6,-0.08l-0.22,0.08l-1.72,1.6l-1.83,0.46l-0.39,-1.7l0.36,-3.0l-0.16,-0.3l-1.73,-0.88l0.57,-1.77l-0.25,-0.39l-1.33,-0.14l0.41,-1.85l2.05,0.63l0.21,-0.01l2.2,-0.95l0.09,-0.49l-1.78,-1.75l-0.69,-1.66l-0.07,-0.03Z", "name": "Turkmenistan"}, "TJ": {"path": "M597.99,178.71l-0.23,0.23l-2.57,-0.47l-0.35,0.25l-0.24,1.7l0.32,0.34l2.66,-0.22l3.15,0.95l4.47,-0.42l0.58,2.45l0.39,0.21l0.71,-0.25l1.22,0.53l-0.06,1.01l0.29,1.28l-2.19,-0.0l-1.71,-0.21l-0.23,0.07l-1.51,1.25l-1.05,0.27l-0.77,0.51l-0.71,-0.67l0.22,-2.28l-0.24,-0.32l-0.43,-0.08l0.17,-0.57l-0.16,-0.36l-1.36,-0.66l-0.34,0.05l-1.08,1.01l-0.09,0.15l-0.25,1.09l-0.24,0.26l-1.36,-0.05l-0.27,0.14l-0.65,1.06l-0.58,-0.39l-0.3,-0.02l-1.68,0.86l-0.36,-0.16l1.28,-2.65l0.02,-0.2l-0.54,-2.17l-0.18,-0.21l-1.53,-0.58l0.41,-0.82l1.89,0.13l0.26,-0.12l1.19,-1.63l0.77,-1.82l2.66,-0.55l-0.33,0.87l0.01,0.23l0.36,0.82l0.3,0.18l0.23,-0.02Z", "name": "Tajikistan"}, "LS": {"path": "M493.32,359.69l0.69,0.65l-0.65,1.12l-0.38,0.8l-1.27,0.39l-0.18,0.15l-0.4,0.77l-0.59,0.18l-1.59,-1.78l1.16,-1.5l1.3,-1.02l0.97,-0.46l0.94,0.72Z", "name": "Lesotho"}, "TH": {"path": "M677.42,253.68l-1.7,-0.88l-0.14,-0.03l-1.77,0.04l0.3,-1.64l-0.3,-0.35l-2.21,0.01l-0.3,0.28l-0.2,2.76l-2.15,5.9l-0.02,0.13l0.17,1.83l0.28,0.27l1.45,0.07l0.93,2.1l0.44,2.15l0.08,0.15l1.4,1.44l0.16,0.09l1.43,0.27l1.04,1.05l-0.58,0.73l-1.24,0.22l-0.15,-0.99l-0.15,-0.22l-2.04,-1.1l-0.36,0.06l-0.23,0.23l-0.72,-0.71l-0.41,-1.18l-0.06,-0.11l-1.33,-1.42l-1.22,-1.2l-0.5,0.13l-0.15,0.54l-0.14,-0.41l0.26,-1.48l0.73,-2.38l1.2,-2.57l1.37,-2.35l0.02,-0.27l-0.95,-2.26l0.03,-1.19l-0.29,-1.42l-0.06,-0.13l-1.65,-2.0l-0.46,-0.99l0.62,-0.34l0.13,-0.15l0.92,-2.23l-0.02,-0.27l-1.05,-1.74l-1.57,-1.86l-1.04,-1.96l0.76,-0.34l0.16,-0.16l1.07,-2.63l1.58,-0.1l0.16,-0.06l1.43,-1.11l1.24,-0.52l0.84,0.62l0.13,1.43l0.28,0.27l1.34,0.09l-0.54,2.39l0.05,2.39l0.45,0.25l2.48,-1.45l0.6,0.36l0.17,0.04l1.47,-0.07l0.25,-0.15l0.41,-0.73l1.58,0.15l1.76,1.93l0.15,2.44l0.08,0.18l1.94,2.15l-0.1,1.96l-0.66,0.93l-2.25,-0.34l-3.24,0.49l-0.19,0.12l-1.6,2.12l-0.06,0.24l0.48,2.46Z", "name": "Thailand"}, "TF": {"path": "M593.76,417.73l1.38,0.84l2.15,0.37l0.04,0.31l-0.59,1.24l-3.36,0.19l-0.05,-1.38l0.43,-1.56Z", "name": "French Southern and Antarctic Lands"}, "TG": {"path": "M425.23,269.29l-1.49,0.4l-0.43,-0.68l-0.64,-1.54l-0.18,-1.16l0.54,-2.21l-0.04,-0.24l-0.59,-0.86l-0.23,-1.9l0.0,-1.82l-0.07,-0.19l-0.95,-1.19l0.1,-0.41l1.58,0.04l-0.23,0.97l0.08,0.28l1.55,1.55l0.09,1.13l0.08,0.19l0.42,0.43l-0.11,5.66l0.52,1.53Z", "name": "Togo"}, "TD": {"path": "M457.57,252.46l0.23,-1.08l-0.28,-0.36l-1.32,-0.05l0.0,-1.35l-0.1,-0.22l-0.9,-0.82l0.99,-3.1l3.12,-2.37l0.12,-0.23l0.13,-3.33l0.95,-5.2l0.53,-1.09l-0.07,-0.36l-0.94,-0.81l-0.03,-0.7l-0.12,-0.23l-0.84,-0.61l-0.57,-3.76l2.21,-1.26l19.67,9.88l0.12,9.74l-1.83,-0.15l-0.28,0.14l-1.14,1.89l-0.68,1.62l0.05,0.31l0.33,0.38l-0.61,0.58l-0.08,0.3l0.25,0.93l-0.58,0.95l-0.29,1.01l0.34,0.37l0.67,-0.11l0.39,0.73l0.03,1.4l0.11,0.23l0.8,0.65l-0.01,0.24l-1.38,0.37l-0.11,0.06l-1.27,1.03l-1.83,2.76l-2.21,1.1l-2.34,-0.15l-0.82,0.25l-0.2,0.37l0.19,0.68l-1.16,0.79l-1.01,0.94l-2.92,0.89l-0.5,-0.46l-0.17,-0.08l-0.41,-0.05l-0.28,0.12l-0.38,0.54l-1.36,0.12l0.1,-0.18l0.01,-0.27l-0.78,-1.72l-0.35,-1.03l-0.17,-0.18l-1.03,-0.41l-1.29,-1.28l0.36,-0.78l0.9,0.2l0.14,-0.0l0.67,-0.17l1.36,0.02l0.26,-0.45l-1.32,-2.22l0.09,-1.64l-0.17,-1.68l-0.04,-0.13l-0.93,-1.53Z", "name": "Chad"}, "LY": {"path": "M457.99,226.38l-1.57,0.87l-1.25,-1.28l-0.13,-0.08l-3.85,-1.11l-1.04,-1.57l-0.09,-0.09l-1.98,-1.23l-0.27,-0.02l-0.93,0.39l-0.72,-1.2l-0.09,-1.07l-0.06,-0.16l-1.33,-1.75l0.83,-0.94l0.07,-0.24l-0.21,-1.64l0.31,-1.43l-0.17,-1.29l0.43,-2.26l-0.15,-1.33l-0.73,-2.18l0.99,-0.52l0.16,-0.21l0.22,-1.16l-0.22,-1.06l1.54,-0.95l0.81,-0.92l1.19,-0.78l0.14,-0.23l0.12,-1.76l2.57,0.84l0.16,0.01l0.99,-0.23l2.01,0.45l3.19,1.2l1.12,2.36l0.2,0.16l2.24,0.53l3.5,1.14l2.65,1.36l0.29,-0.01l1.22,-0.71l1.27,-1.32l0.07,-0.29l-0.55,-2.0l0.69,-1.19l1.7,-1.23l1.61,-0.35l3.2,0.54l0.78,1.14l0.24,0.13l0.85,0.01l0.84,0.47l2.35,0.31l0.42,0.63l-0.79,1.16l-0.04,0.26l0.35,1.08l-0.61,1.6l-0.0,0.2l0.73,2.16l0.0,24.24l-2.58,0.01l-0.3,0.29l-0.02,0.62l-19.55,-9.83l-0.28,0.01l-2.53,1.44Z", "name": "Libya"}, "AE": {"path": "M550.59,223.8l0.12,0.08l1.92,-0.41l3.54,0.15l0.23,-0.09l1.71,-1.79l1.86,-1.7l1.31,-1.36l0.26,0.5l0.28,1.72l-0.93,0.01l-0.3,0.26l-0.21,1.73l0.11,0.27l0.08,0.06l-0.7,0.32l-0.17,0.27l-0.01,0.99l-0.68,1.02l-0.05,0.15l-0.06,0.96l-0.32,0.36l-7.19,-1.27l-0.79,-2.22Z", "name": "United Arab Emirates"}, "VE": {"path": "M240.66,256.5l0.65,0.91l-0.03,1.13l-1.05,1.39l-0.03,0.31l0.95,2.0l0.32,0.17l1.08,-0.16l0.24,-0.21l0.56,-1.83l-0.06,-0.29l-0.71,-0.81l-0.1,-1.58l2.9,-0.96l0.19,-0.37l-0.29,-1.02l0.45,-0.41l0.72,1.43l0.26,0.16l1.65,0.04l1.46,1.27l0.08,0.72l0.3,0.27l2.28,0.02l2.55,-0.25l1.34,1.06l0.14,0.06l1.92,0.31l0.2,-0.03l1.4,-0.79l0.15,-0.25l0.02,-0.36l2.82,-0.14l1.17,-0.01l-0.41,0.14l-0.14,0.46l0.86,1.19l0.22,0.12l1.93,0.18l1.73,1.13l0.37,1.9l0.31,0.24l1.21,-0.05l0.52,0.32l-1.63,1.21l-0.11,0.17l-0.22,0.92l0.07,0.27l0.63,0.69l-0.31,0.24l-1.48,0.39l-0.22,0.3l0.04,1.03l-0.59,0.6l-0.01,0.41l1.67,1.87l0.23,0.48l-0.72,0.76l-2.71,0.91l-1.78,0.39l-0.13,0.06l-0.6,0.49l-1.84,-0.58l-1.89,-0.33l-0.18,0.03l-0.47,0.23l-0.02,0.53l0.96,0.56l-0.08,1.58l0.35,1.58l0.26,0.23l1.91,0.19l0.02,0.07l-1.54,0.62l-0.18,0.2l-0.25,0.92l-0.88,0.35l-1.85,0.58l-0.16,0.13l-0.4,0.64l-1.66,0.14l-1.22,-1.18l-0.79,-2.52l-0.67,-0.88l-0.66,-0.43l0.99,-0.98l0.09,-0.26l-0.09,-0.56l-0.08,-0.16l-0.66,-0.69l-0.47,-1.54l0.18,-1.67l0.55,-0.85l0.45,-1.35l-0.15,-0.36l-0.89,-0.43l-0.19,-0.02l-1.39,0.28l-1.76,-0.13l-0.92,0.23l-1.64,-2.01l-0.17,-0.1l-1.54,-0.33l-3.05,0.23l-0.5,-0.73l-0.15,-0.12l-0.45,-0.15l-0.05,-0.28l0.28,-0.86l0.01,-0.15l-0.2,-1.01l-0.08,-0.15l-0.5,-0.5l-0.3,-1.08l-0.25,-0.22l-0.89,-0.12l0.54,-1.18l0.29,-1.73l0.66,-0.85l0.94,-0.7l0.09,-0.11l0.3,-0.6Z", "name": "Venezuela"}, "AF": {"path": "M574.42,192.1l2.24,0.95l0.18,0.02l1.89,-0.38l0.22,-0.18l0.46,-1.14l1.82,-0.4l1.5,-0.91l0.14,-0.19l0.46,-2.12l1.93,-0.51l0.2,-0.18l0.26,-0.68l0.87,0.57l0.13,0.05l0.79,0.09l1.35,0.02l1.83,0.59l0.75,0.34l0.26,-0.01l1.66,-0.85l0.7,0.46l0.42,-0.09l0.72,-1.17l1.32,0.05l0.23,-0.1l0.39,-0.43l0.07,-0.14l0.24,-1.08l0.86,-0.81l0.94,0.46l-0.2,0.64l0.23,0.38l0.49,0.09l-0.21,2.15l0.09,0.25l0.99,0.94l0.38,0.03l0.83,-0.57l1.06,-0.27l0.12,-0.06l1.46,-1.21l1.63,0.2l2.4,0.0l0.17,0.32l-1.12,0.25l-1.23,0.52l-2.86,0.33l-2.69,0.6l-0.13,0.06l-1.46,1.25l-0.07,0.36l0.58,1.18l0.25,1.21l-1.13,1.08l-0.09,0.25l0.09,0.98l-0.53,0.79l-2.22,-0.08l-0.28,0.44l0.83,1.57l-1.3,0.58l-0.13,0.11l-1.06,1.69l-0.05,0.18l0.13,1.51l-0.73,0.58l-0.78,-0.22l-0.14,-0.01l-1.91,0.36l-0.23,0.19l-0.2,0.57l-1.65,-0.0l-0.22,0.1l-1.4,1.56l-0.08,0.19l-0.08,2.13l-2.99,1.05l-1.67,-0.23l-0.27,0.1l-0.39,0.46l-1.43,-0.31l-2.43,0.4l-3.69,-1.23l1.96,-2.15l0.08,-0.24l-0.21,-1.78l-0.23,-0.26l-1.69,-0.42l-0.19,-1.62l-0.77,-2.08l0.98,-1.41l-0.14,-0.45l-0.82,-0.31l0.6,-1.79l0.93,-3.21Z", "name": "Afghanistan"}, "IQ": {"path": "M534.42,190.89l0.13,0.14l1.5,0.78l0.15,1.34l-1.13,0.87l-0.11,0.16l-0.58,2.2l0.04,0.24l1.73,2.67l0.12,0.1l2.99,1.49l1.18,1.94l-0.39,1.89l0.29,0.36l0.5,-0.0l0.02,1.17l0.08,0.2l0.83,0.86l-2.36,-0.29l-0.29,0.13l-1.74,2.49l-4.4,-0.21l-7.03,-5.49l-3.73,-1.94l-2.92,-0.74l-0.89,-3.0l5.33,-2.81l0.15,-0.19l0.95,-3.43l-0.2,-2.0l1.19,-0.61l0.11,-0.09l1.23,-1.73l0.92,-0.38l2.75,0.35l0.81,0.68l0.31,0.05l0.94,-0.38l1.5,3.17Z", "name": "Iraq"}, "IS": {"path": "M384.26,87.96l-0.51,2.35l0.08,0.28l2.61,2.58l-2.99,2.83l-7.16,2.72l-2.08,0.7l-9.51,-1.71l1.89,-1.36l-0.07,-0.53l-4.4,-1.59l3.33,-0.59l0.25,-0.32l-0.11,-1.2l-0.25,-0.27l-4.82,-0.88l1.38,-2.2l3.54,-0.57l3.8,2.74l0.33,0.01l3.68,-2.18l3.02,1.12l0.25,-0.02l4.01,-2.18l3.72,0.27Z", "name": "Iceland"}, "IR": {"path": "M556.2,187.5l2.05,-0.52l0.13,-0.07l1.69,-1.57l1.55,0.08l0.15,-0.03l1.02,-0.5l1.64,0.25l2.82,1.48l1.91,0.3l2.8,2.49l0.18,0.08l1.61,0.09l0.19,2.09l-1.0,3.47l-0.69,2.04l0.18,0.38l0.73,0.28l-0.85,1.22l-0.04,0.28l0.81,2.19l0.19,1.72l0.23,0.26l1.69,0.42l0.17,1.43l-2.18,2.39l-0.01,0.4l1.22,1.42l1.0,1.62l0.12,0.11l2.23,1.11l0.06,2.2l0.2,0.27l1.03,0.38l0.14,0.83l-3.38,1.3l-0.18,0.19l-0.87,2.85l-4.44,-0.76l-2.75,-0.62l-2.64,-0.32l-1.01,-3.11l-0.17,-0.19l-1.2,-0.48l-0.18,-0.01l-1.99,0.51l-2.42,1.25l-2.89,-0.84l-2.48,-2.03l-2.41,-0.79l-1.61,-2.47l-1.84,-3.63l-0.36,-0.15l-1.22,0.4l-1.48,-0.84l-0.37,0.06l-0.72,0.82l-1.08,-1.12l-0.02,-1.35l-0.3,-0.29l-0.43,0.0l0.34,-1.64l-0.04,-0.22l-1.29,-2.11l-0.12,-0.11l-3.0,-1.49l-1.62,-2.49l0.52,-1.98l1.18,-0.92l0.11,-0.27l-0.19,-1.66l-0.16,-0.23l-1.55,-0.81l-1.58,-3.33l-1.3,-2.2l0.41,-0.75l0.03,-0.21l-0.73,-3.12l1.2,-0.59l0.35,0.9l1.26,1.35l0.15,0.09l1.81,0.39l0.91,-0.09l0.15,-0.06l2.9,-2.13l0.7,-0.16l0.48,0.56l-0.75,1.26l0.05,0.37l1.56,1.53l0.28,0.08l0.37,-0.09l0.7,1.89l0.21,0.19l2.31,0.59l1.69,1.4l0.15,0.07l3.66,0.49l3.91,-0.76l0.23,-0.19l0.19,-0.52Z", "name": "Iran"}, "AM": {"path": "M530.51,176.08l2.91,-0.39l0.41,0.63l0.11,0.1l0.66,0.36l-0.32,0.47l0.07,0.41l1.1,0.84l-0.53,0.7l0.06,0.42l1.06,0.8l1.01,0.44l0.04,1.56l-0.44,0.04l-0.88,-1.46l0.01,-0.37l-0.3,-0.31l-0.98,0.01l-0.65,-0.69l-0.26,-0.09l-0.38,0.06l-0.97,-0.82l-1.64,-0.65l0.2,-1.2l-0.02,-0.16l-0.28,-0.69Z", "name": "Armenia"}, "IT": {"path": "M451.68,158.58l0.2,0.16l3.3,0.75l-0.22,1.26l0.02,0.18l0.35,0.78l-1.4,-0.32l-0.21,0.03l-2.04,1.1l-0.16,0.29l0.13,1.47l-0.29,0.82l0.02,0.24l0.82,1.57l0.1,0.11l2.28,1.5l1.29,2.53l2.79,2.43l0.2,0.07l1.83,-0.02l0.31,0.34l-0.46,0.39l0.06,0.5l4.06,1.97l2.06,1.49l0.17,0.36l-0.24,0.53l-1.08,-1.07l-0.15,-0.08l-2.18,-0.49l-0.33,0.15l-1.05,1.91l0.11,0.4l1.63,0.98l-0.22,1.12l-0.84,0.14l-0.22,0.15l-1.27,2.38l-0.54,0.12l0.01,-0.47l0.48,-1.46l0.5,-0.58l0.03,-0.35l-0.97,-1.69l-0.76,-1.48l-0.17,-0.15l-0.94,-0.33l-0.68,-1.18l-0.16,-0.13l-1.53,-0.52l-1.03,-1.14l-0.19,-0.1l-1.78,-0.19l-1.88,-1.3l-2.27,-1.94l-1.64,-1.68l-0.76,-2.94l-0.21,-0.21l-1.22,-0.35l-2.01,-1.0l-0.24,-0.01l-1.15,0.42l-0.11,0.07l-1.38,1.36l-0.5,0.11l0.19,-0.87l-0.21,-0.35l-1.19,-0.34l-0.56,-2.06l0.76,-0.82l0.03,-0.36l-0.68,-1.08l0.04,-0.31l0.68,0.42l0.19,0.04l1.21,-0.15l0.14,-0.06l1.18,-0.89l0.25,0.29l0.25,0.1l1.19,-0.1l0.25,-0.18l0.45,-1.04l1.61,0.34l0.19,-0.02l1.1,-0.53l0.17,-0.22l0.15,-0.95l1.19,0.35l0.35,-0.16l0.23,-0.47l2.11,-0.47l0.45,0.89ZM459.35,184.63l-0.71,1.81l0.0,0.23l0.33,0.79l-0.37,1.03l-1.6,-0.91l-1.33,-0.34l-3.24,-1.36l0.23,-0.99l2.73,0.24l3.95,-0.5ZM443.95,175.91l1.26,1.77l-0.31,3.47l-0.82,-0.13l-0.26,0.08l-0.83,0.79l-0.64,-0.52l-0.1,-3.42l-0.44,-1.34l0.91,0.1l0.21,-0.06l1.01,-0.74Z", "name": "Italy"}, "VN": {"path": "M690.8,230.21l-2.86,1.93l-2.09,2.46l-0.06,0.11l-0.55,1.8l0.04,0.26l4.26,6.1l2.31,1.63l1.46,1.97l1.12,4.62l-0.32,4.3l-1.97,1.57l-2.85,1.62l-2.09,2.14l-2.83,2.13l-0.67,-1.19l0.65,-1.58l-0.09,-0.35l-1.47,-1.14l1.67,-0.79l2.57,-0.18l0.22,-0.47l-0.89,-1.24l3.88,-1.8l0.17,-0.24l0.31,-3.05l-0.01,-0.13l-0.56,-1.63l0.44,-2.48l-0.01,-0.15l-0.63,-1.81l-0.08,-0.12l-1.87,-1.77l-3.64,-5.3l-0.11,-0.1l-2.68,-1.39l0.45,-0.59l1.53,-0.65l0.16,-0.39l-0.97,-2.27l-0.27,-0.18l-2.89,-0.02l-1.04,-2.21l-1.28,-1.83l0.96,-0.46l1.97,0.01l2.43,-0.3l0.13,-0.05l1.95,-1.29l1.04,0.85l0.13,0.06l1.98,0.42l-0.32,1.21l0.09,0.3l1.19,1.07l0.12,0.07l1.88,0.51Z", "name": "Vietnam"}, "AR": {"path": "M258.11,341.34l1.4,1.81l0.51,-0.06l0.89,-1.94l2.51,0.1l0.36,0.49l4.6,4.31l0.15,0.08l1.99,0.39l3.01,1.93l2.5,1.01l0.28,0.91l-2.4,3.97l0.17,0.44l2.57,0.74l2.81,0.41l2.09,-0.44l0.14,-0.07l2.27,-2.06l0.09,-0.17l0.38,-2.2l0.88,-0.36l1.05,1.29l-0.04,1.88l-1.98,1.4l-1.72,1.13l-2.84,2.65l-3.34,3.73l-0.07,0.12l-0.63,2.22l-0.67,2.85l0.02,2.73l-0.47,0.54l-0.07,0.17l-0.36,3.28l0.12,0.27l3.03,2.32l-0.31,1.78l0.11,0.29l1.44,1.15l-0.11,1.17l-2.32,3.57l-3.59,1.51l-4.95,0.6l-2.72,-0.29l-0.32,0.38l0.5,1.67l-0.49,2.13l0.01,0.16l0.4,1.29l-1.27,0.88l-2.41,0.39l-2.33,-1.05l-0.31,0.04l-0.97,0.78l-0.11,0.27l0.35,2.98l0.16,0.23l1.69,0.91l0.31,-0.02l1.08,-0.75l0.46,0.96l-2.1,0.88l-2.01,1.89l-0.09,0.18l-0.36,3.05l-0.51,1.42l-2.16,0.01l-0.19,0.07l-1.96,1.59l-0.1,0.15l-0.72,2.34l0.08,0.31l2.46,2.31l0.13,0.07l2.09,0.56l-0.74,2.45l-2.86,1.75l-0.12,0.14l-1.59,3.71l-2.2,1.24l-0.1,0.09l-1.03,1.54l-0.04,0.23l0.81,3.45l0.06,0.13l1.13,1.32l-2.59,-0.57l-5.89,-0.44l-0.92,-1.73l0.05,-2.4l-0.34,-0.3l-1.49,0.19l-0.72,-0.98l-0.2,-3.21l1.79,-1.33l0.1,-0.13l0.79,-2.04l0.02,-0.16l-0.27,-1.52l1.31,-2.69l0.91,-4.15l-0.23,-1.72l0.91,-0.49l0.15,-0.33l-0.27,-1.16l-0.15,-0.2l-0.87,-0.46l0.65,-1.01l-0.04,-0.37l-1.06,-1.09l-0.54,-3.2l0.83,-0.51l0.14,-0.29l-0.42,-3.6l0.58,-2.98l0.64,-2.5l1.41,-1.0l0.12,-0.32l-0.75,-2.8l-0.01,-2.48l1.81,-1.78l0.09,-0.22l-0.06,-2.3l1.39,-2.69l0.03,-0.14l0.01,-2.58l-0.11,-0.24l-0.57,-0.45l-1.1,-4.59l1.49,-2.73l0.04,-0.17l-0.23,-2.59l0.86,-2.38l1.6,-2.48l1.74,-1.65l0.04,-0.39l-0.64,-0.89l0.42,-0.7l0.04,-0.16l-0.08,-4.26l2.55,-1.23l0.16,-0.18l0.86,-2.75l-0.01,-0.22l-0.22,-0.48l1.84,-2.1l3.0,0.59ZM256.77,438.98l-2.1,0.15l-1.18,-1.14l-0.19,-0.08l-1.53,-0.09l-2.38,-0.0l-0.0,-6.28l0.4,0.65l1.25,2.55l0.11,0.12l3.26,2.07l3.19,0.8l-0.82,1.26Z", "name": "Argentina"}, "AU": {"path": "M705.55,353.06l0.09,0.09l0.37,0.05l0.13,-0.35l-0.57,-1.69l0.48,0.3l0.71,0.99l0.34,0.11l0.2,-0.29l-0.04,-1.37l-0.04,-0.14l-1.22,-2.07l-0.28,-0.9l-0.51,-0.69l0.24,-1.33l0.52,-0.7l0.34,-1.32l0.01,-0.13l-0.25,-1.44l0.51,-0.94l0.1,1.03l0.23,0.26l0.32,-0.14l1.01,-1.72l1.94,-0.84l1.27,-1.14l1.84,-0.92l1.0,-0.18l0.6,0.28l0.26,-0.0l1.94,-0.96l1.48,-0.28l0.19,-0.13l0.32,-0.49l0.51,-0.18l1.42,0.05l2.63,-0.76l0.11,-0.06l1.36,-1.15l0.08,-0.1l0.61,-1.33l1.42,-1.27l0.1,-0.19l0.11,-1.03l0.06,-1.32l1.39,-1.74l0.85,1.79l0.4,0.14l1.07,-0.51l0.11,-0.45l-0.77,-1.05l0.53,-0.84l0.86,0.43l0.43,-0.22l0.29,-1.85l1.29,-1.19l0.6,-0.98l1.16,-0.4l0.2,-0.27l0.02,-0.34l0.74,0.2l0.38,-0.27l0.03,-0.44l1.98,-0.61l1.7,1.08l1.36,1.48l0.22,0.1l1.55,0.02l1.57,0.24l0.33,-0.4l-0.48,-1.27l1.09,-1.86l1.06,-0.63l0.1,-0.42l-0.28,-0.46l0.93,-1.24l1.36,-0.8l1.16,0.27l0.14,0.0l2.1,-0.48l0.23,-0.3l-0.05,-1.3l-0.18,-0.26l-1.08,-0.49l0.44,-0.12l1.52,0.58l1.39,1.06l2.11,0.65l0.19,-0.0l0.59,-0.21l1.44,0.72l0.27,0.0l1.37,-0.68l0.84,0.2l0.26,-0.06l0.37,-0.3l0.82,0.89l-0.56,1.14l-0.84,0.91l-0.75,0.07l-0.26,0.38l0.26,0.9l-0.67,1.15l-0.88,1.24l-0.05,0.25l0.18,0.72l0.12,0.17l1.99,1.42l1.96,0.84l1.25,0.86l1.8,1.51l0.19,0.07l0.63,-0.0l1.15,0.58l0.34,0.7l0.17,0.15l2.39,0.88l0.24,-0.02l1.65,-0.88l0.14,-0.16l0.49,-1.37l0.52,-1.19l0.31,-1.39l0.75,-2.02l0.01,-0.19l-0.33,-1.16l0.16,-0.67l0.0,-0.13l-0.28,-1.41l0.3,-1.78l0.42,-0.45l0.05,-0.33l-0.33,-0.73l0.56,-1.25l0.48,-1.39l0.07,-0.69l0.58,-0.59l0.48,0.84l0.17,1.53l0.17,0.24l0.47,0.23l0.09,0.9l0.05,0.14l0.87,1.23l0.17,1.33l-0.09,0.89l0.03,0.15l0.9,2.0l0.43,0.13l1.38,-0.83l0.71,0.92l1.06,0.88l-0.22,0.96l0.0,0.14l0.53,2.2l0.38,1.3l0.15,0.18l0.52,0.26l0.62,2.01l-0.23,1.27l0.02,0.18l0.81,1.76l0.14,0.14l2.69,1.35l3.21,2.21l-0.2,0.4l0.04,0.34l1.39,1.6l0.95,2.78l0.43,0.16l0.79,-0.46l0.85,0.96l0.39,0.05l0.22,-0.15l0.36,2.33l0.09,0.18l1.78,1.63l1.16,1.01l1.9,2.1l0.67,2.05l0.06,1.47l-0.17,1.64l0.03,0.17l1.16,2.22l-0.14,2.28l-0.43,1.24l-0.68,2.44l0.04,1.63l-0.48,1.92l-1.06,2.43l-1.79,1.32l-0.1,0.12l-0.91,2.15l-0.82,1.37l-0.76,2.47l-0.98,1.46l-0.63,2.14l-0.33,2.02l0.1,0.82l-1.21,0.85l-2.71,0.1l-0.13,0.03l-2.31,1.19l-1.21,1.17l-1.34,1.11l-1.89,-1.18l-1.33,-0.46l0.32,-1.24l-0.4,-0.35l-1.46,0.61l-2.06,1.98l-1.99,-0.73l-1.43,-0.46l-1.45,-0.22l-2.32,-0.81l-1.51,-1.67l-0.45,-2.11l-0.6,-1.5l-0.07,-0.11l-1.23,-1.16l-0.16,-0.08l-1.96,-0.28l0.59,-0.99l0.03,-0.24l-0.61,-2.1l-0.54,-0.08l-1.16,1.85l-1.23,0.29l0.73,-0.88l0.06,-0.12l0.37,-1.57l0.93,-1.33l0.05,-0.2l-0.2,-2.07l-0.53,-0.17l-2.01,2.35l-1.52,0.94l-0.12,0.14l-0.82,1.93l-1.5,-0.9l0.07,-1.32l-0.06,-0.2l-1.57,-2.04l-1.15,-0.92l0.3,-0.41l-0.1,-0.44l-3.21,-1.69l-0.13,-0.03l-1.69,-0.08l-2.35,-1.31l-0.16,-0.04l-4.55,0.27l-3.24,0.99l-2.8,0.91l-2.33,-0.18l-0.17,0.03l-2.63,1.41l-2.14,0.64l-0.2,0.19l-0.47,1.42l-0.8,0.99l-1.99,0.06l-1.55,0.24l-2.27,-0.5l-1.79,0.3l-1.71,0.13l-0.19,0.09l-1.38,1.39l-0.58,-0.1l-0.21,0.04l-1.26,0.8l-1.13,0.85l-1.72,-0.1l-1.6,-0.0l-2.58,-1.76l-1.21,-0.49l0.04,-1.19l1.04,-0.32l0.16,-0.12l0.42,-0.64l0.05,-0.19l-0.09,-0.97l0.3,-2.0l-0.28,-1.64l-1.34,-2.84l-0.39,-1.49l0.1,-1.51l-0.04,-0.17l-0.96,-1.72l-0.06,-0.73l-0.09,-0.19l-1.04,-1.01l-0.3,-2.02l-0.05,-0.12l-1.23,-1.83ZM784.95,393.35l2.39,1.01l0.2,0.01l3.26,-0.96l1.19,0.16l0.16,3.19l-0.78,0.95l-0.07,0.16l-0.19,1.83l-0.43,-0.41l-0.44,0.03l-1.61,1.96l-0.4,-0.12l-1.38,-0.09l-1.43,-2.42l-0.37,-2.03l-1.4,-2.53l0.04,-0.94l1.27,0.2Z", "name": "Australia"}, "IL": {"path": "M509.04,199.22l0.71,0.0l0.27,-0.17l0.15,-0.33l0.19,-0.01l0.02,0.73l-0.27,0.34l0.02,0.08l-0.32,0.62l-0.65,-0.27l-0.41,0.19l-0.52,1.85l0.16,0.35l0.14,0.07l-0.17,0.1l-0.14,0.21l-0.11,0.73l0.39,0.33l0.81,-0.26l0.03,0.64l-0.97,3.43l-1.28,-3.67l0.62,-0.78l-0.03,-0.41l0.58,-1.16l0.5,-2.07l0.27,-0.54Z", "name": "Israel"}, "IN": {"path": "M615.84,192.58l2.4,2.97l-0.24,2.17l0.05,0.2l0.94,1.35l-0.06,0.97l-1.46,-0.3l-0.35,0.36l0.7,3.06l0.12,0.18l2.46,1.75l3.11,1.72l-1.23,0.96l-0.1,0.13l-0.97,2.55l0.16,0.38l2.41,1.02l2.37,1.33l3.27,1.52l3.43,0.37l1.37,1.3l0.17,0.08l1.92,0.25l3.0,0.62l2.15,-0.04l0.28,-0.22l0.29,-1.06l0.0,-0.13l-0.32,-1.66l0.16,-0.94l1.0,-0.37l0.23,2.28l0.18,0.24l2.28,1.02l0.2,0.02l1.52,-0.41l2.06,0.18l2.08,-0.08l0.29,-0.27l0.18,-1.66l-0.1,-0.26l-0.53,-0.44l1.38,-0.23l0.15,-0.07l2.26,-2.0l2.75,-1.65l1.97,0.63l0.25,-0.03l1.54,-0.99l0.89,1.28l-0.72,0.97l0.2,0.48l2.49,0.37l0.11,0.61l-0.69,0.39l-0.15,0.3l0.15,1.22l-1.36,-0.37l-0.23,0.03l-3.24,1.86l-0.15,0.28l0.07,1.44l-1.33,2.16l-0.04,0.13l-0.12,1.24l-0.98,1.91l-1.72,-0.53l-0.39,0.28l-0.09,2.66l-0.52,0.83l-0.04,0.23l0.21,0.89l-0.71,0.36l-1.21,-3.85l-0.29,-0.21l-0.69,0.01l-0.29,0.23l-0.28,1.17l-0.84,-0.84l0.6,-1.17l0.97,-0.13l0.23,-0.16l1.15,-2.25l-0.18,-0.42l-1.54,-0.47l-2.3,0.04l-2.13,-0.33l-0.19,-1.63l-0.26,-0.26l-1.13,-0.13l-1.93,-1.13l-0.42,0.13l-0.88,1.82l0.08,0.37l1.47,1.15l-1.21,0.77l-0.1,0.1l-0.56,0.97l0.13,0.42l1.31,0.61l-0.36,1.35l0.01,0.2l0.85,1.95l0.37,2.05l-0.26,0.68l-1.55,-0.02l-3.09,0.54l-0.25,0.32l0.13,1.84l-1.21,1.4l-3.64,1.79l-2.79,3.04l-1.86,1.61l-2.48,1.68l-0.13,0.25l-0.0,1.0l-1.07,0.55l-2.21,0.9l-1.13,0.13l-0.25,0.19l-0.75,1.96l-0.02,0.15l0.52,3.31l0.13,2.03l-1.03,2.35l-0.03,0.12l-0.01,4.03l-1.02,0.1l-0.23,0.15l-1.14,1.93l0.04,0.36l0.44,0.48l-1.83,0.57l-0.18,0.15l-0.81,1.65l-0.74,0.53l-2.14,-2.12l-1.14,-3.47l-0.96,-2.57l-0.9,-1.26l-1.3,-2.38l-0.61,-3.14l-0.44,-1.62l-2.29,-3.56l-1.03,-4.94l-0.74,-3.29l0.01,-3.12l-0.49,-2.51l-0.41,-0.22l-3.56,1.53l-1.59,-0.28l-2.96,-2.87l0.94,-0.74l0.06,-0.41l-0.74,-1.03l-2.73,-2.1l1.35,-1.43l5.38,0.01l0.29,-0.36l-0.5,-2.29l-0.09,-0.15l-1.33,-1.28l-0.27,-1.96l-0.12,-0.2l-1.36,-1.0l2.42,-2.48l2.77,0.2l0.24,-0.1l2.62,-2.85l1.59,-2.8l2.41,-2.74l0.07,-0.2l-0.04,-1.82l2.01,-1.51l-0.01,-0.49l-1.95,-1.33l-0.83,-1.81l-0.82,-2.27l0.98,-0.97l3.64,0.66l2.89,-0.42l0.17,-0.08l2.18,-2.15Z", "name": "India"}, "TZ": {"path": "M505.77,287.58l0.36,0.23l8.95,5.03l0.15,1.3l0.13,0.21l3.4,2.37l-1.07,2.88l-0.02,0.14l0.15,1.42l0.15,0.23l1.47,0.84l0.05,0.42l-0.66,1.44l-0.02,0.18l0.13,0.72l-0.16,1.16l0.03,0.19l0.87,1.57l1.03,2.48l0.12,0.14l0.53,0.32l-1.59,1.18l-2.64,0.95l-1.45,-0.04l-0.2,0.07l-0.81,0.69l-1.64,0.06l-0.68,0.3l-2.9,-0.69l-1.71,0.17l-0.65,-3.18l-0.05,-0.12l-1.35,-1.88l-0.19,-0.12l-2.41,-0.46l-1.38,-0.74l-1.63,-0.44l-0.96,-0.41l-0.95,-0.58l-1.31,-3.09l-1.47,-1.46l-0.45,-1.31l0.24,-1.34l-0.39,-1.99l0.71,-0.08l0.18,-0.09l0.91,-0.91l0.98,-1.31l0.59,-0.5l0.11,-0.24l-0.02,-0.81l-0.08,-0.2l-0.47,-0.5l-0.1,-0.67l0.51,-0.23l0.18,-0.25l0.14,-1.47l-0.05,-0.2l-0.76,-1.09l0.45,-0.15l2.71,0.03l5.01,-0.19Z", "name": "Tanzania"}, "AZ": {"path": "M539.36,175.66l0.16,0.09l1.11,0.2l0.32,-0.15l0.4,-0.71l1.22,-0.99l1.11,1.33l1.26,2.09l0.22,0.14l1.06,0.13l0.28,0.29l-1.46,0.17l-0.26,0.24l-0.43,2.26l-0.39,0.92l-0.85,0.63l-0.12,0.25l0.06,1.2l-0.22,0.05l-1.28,-1.25l0.74,-1.25l-0.03,-0.35l-0.74,-0.86l-0.3,-0.1l-1.05,0.27l-2.49,1.82l-0.04,-1.46l-0.18,-0.27l-1.09,-0.47l-0.8,-0.6l0.53,-0.7l-0.06,-0.42l-1.11,-0.84l0.34,-0.51l-0.11,-0.43l-0.89,-0.48l-0.33,-0.49l0.25,-0.2l1.78,0.81l1.35,0.18l0.25,-0.09l0.34,-0.35l0.02,-0.39l-1.04,-1.36l0.28,-0.18l0.49,0.07l1.65,1.74ZM533.53,180.16l0.63,0.67l0.22,0.09l0.8,-0.0l0.04,0.31l0.66,1.09l-0.94,-0.21l-1.16,-1.24l-0.25,-0.71Z", "name": "Azerbaijan"}, "IE": {"path": "M405.17,135.35l0.36,2.16l-1.78,2.84l-4.28,1.91l-3.02,-0.43l1.81,-3.13l0.02,-0.26l-1.23,-3.26l3.24,-2.56l1.54,-1.32l0.37,1.33l-0.49,1.77l0.3,0.38l1.49,-0.05l1.68,0.63Z", "name": "Ireland"}, "ID": {"path": "M756.56,287.86l0.69,4.02l0.15,0.21l2.59,1.5l0.39,-0.07l2.05,-2.61l2.75,-1.45l2.09,-0.0l2.08,0.85l1.85,0.89l2.52,0.46l0.08,15.44l-1.72,-1.6l-0.15,-0.07l-2.54,-0.51l-0.29,0.1l-0.53,0.62l-2.53,0.06l0.78,-1.51l1.48,-0.66l0.17,-0.34l-0.65,-2.74l-1.23,-2.19l-0.14,-0.13l-4.85,-2.13l-2.09,-0.23l-3.7,-2.28l-0.41,0.1l-0.67,1.11l-0.63,0.14l-0.41,-0.67l-0.01,-1.01l-0.14,-0.25l-1.39,-0.89l2.05,-0.69l1.73,0.05l0.29,-0.39l-0.21,-0.66l-0.29,-0.21l-3.5,-0.0l-0.9,-1.36l-0.19,-0.13l-2.14,-0.44l-0.65,-0.76l2.86,-0.51l1.28,-0.79l3.75,0.96l0.32,0.76ZM758.01,300.37l-0.79,1.04l-0.14,-1.07l0.4,-0.81l0.29,-0.47l0.24,0.31l-0.0,1.0ZM747.45,292.9l0.48,1.02l-1.45,-0.69l-2.09,-0.21l-1.45,0.16l-1.28,-0.07l0.35,-0.81l2.86,-0.1l2.58,0.68ZM741.15,285.69l-0.16,-0.25l-0.72,-3.08l0.47,-1.86l0.35,-0.38l0.1,0.73l0.25,0.26l1.28,0.19l0.18,0.78l-0.11,1.8l-0.96,-0.18l-0.35,0.22l-0.38,1.52l0.05,0.24ZM741.19,285.75l0.76,0.97l-0.11,0.05l-0.65,-1.02ZM739.18,293.52l-0.61,0.54l-1.44,-0.38l-0.25,-0.55l1.93,-0.09l0.36,0.48ZM728.4,295.87l-0.27,-0.07l-2.26,0.89l-0.37,-0.41l0.27,-0.8l-0.09,-0.33l-1.68,-1.37l0.17,-2.29l-0.42,-0.3l-1.67,0.76l-0.17,0.29l0.21,2.92l0.09,3.34l-1.22,0.28l-0.78,-0.54l0.65,-2.1l0.01,-0.14l-0.39,-2.42l-0.29,-0.25l-0.86,-0.02l-0.63,-1.4l0.99,-1.61l0.35,-1.97l1.24,-3.73l0.49,-0.96l1.95,-1.7l1.86,0.69l3.16,0.35l2.92,-0.1l0.17,-0.06l2.24,-1.65l0.11,0.14l-1.8,2.22l-1.72,0.44l-2.41,-0.48l-4.21,0.13l-2.19,0.36l-0.25,0.24l-0.36,1.9l0.08,0.27l2.24,2.23l0.4,0.02l1.29,-1.08l3.19,-0.58l-0.19,0.06l-1.04,1.4l-2.13,0.94l-0.12,0.45l2.26,3.06l-0.37,0.69l0.03,0.32l1.51,1.95ZM728.48,295.97l0.59,0.76l-0.02,1.37l-1.0,0.55l-0.64,-0.58l1.09,-1.84l-0.02,-0.26ZM728.64,286.95l0.79,-0.14l-0.07,0.39l-0.72,-0.24ZM732.38,310.1l-1.89,0.49l-0.06,-0.06l0.17,-0.64l1.0,-1.42l2.14,-0.87l0.1,0.2l0.04,0.58l-1.49,1.72ZM728.26,305.71l-0.17,0.63l-3.53,0.67l-3.02,-0.28l-0.0,-0.42l1.66,-0.44l1.47,0.71l0.16,0.03l1.75,-0.21l1.69,-0.69ZM722.98,310.33l-0.74,0.03l-2.52,-1.35l1.42,-0.3l1.19,0.7l0.72,0.63l-0.06,0.28ZM716.24,305.63l0.66,0.49l0.22,0.06l1.35,-0.18l0.31,0.53l-4.18,0.77l-0.8,-0.01l0.51,-0.86l1.2,-0.02l0.24,-0.12l0.49,-0.65ZM715.84,280.21l0.09,0.34l2.25,1.86l-2.25,0.22l-0.24,0.17l-0.84,1.71l-0.03,0.15l0.1,2.11l-2.27,1.62l-0.13,0.24l-0.06,2.46l-0.74,2.92l-0.02,-0.05l-0.39,-0.16l-2.62,1.04l-0.86,-1.33l-0.23,-0.14l-1.71,-0.14l-1.19,-0.76l-0.25,-0.03l-2.78,0.84l-0.79,-1.05l-0.26,-0.12l-1.61,0.13l-1.8,-0.25l-0.36,-3.13l-0.15,-0.23l-1.18,-0.65l-1.13,-2.02l-0.33,-2.1l0.27,-2.19l1.05,-1.17l0.28,1.12l0.1,0.16l1.71,1.41l0.28,0.05l1.55,-0.49l1.54,0.17l0.23,-0.07l1.4,-1.21l1.05,-0.19l2.3,0.68l0.16,0.0l2.04,-0.53l0.21,-0.19l1.26,-3.41l0.91,-0.82l0.09,-0.14l0.8,-2.64l2.63,0.0l1.71,0.33l-1.19,1.89l0.02,0.34l1.74,2.24l-0.37,1.0ZM692.67,302.0l0.26,0.19l4.8,0.25l0.28,-0.16l0.44,-0.83l4.29,1.12l0.85,1.52l0.23,0.15l3.71,0.45l2.37,1.15l-2.06,0.69l-2.77,-1.0l-2.25,0.07l-2.57,-0.18l-2.31,-0.45l-2.94,-0.97l-1.84,-0.25l-0.13,0.01l-0.97,0.29l-4.34,-0.98l-0.38,-0.94l-0.25,-0.19l-1.76,-0.14l1.31,-1.84l2.81,0.14l1.97,0.96l0.95,0.19l0.28,0.74ZM685.63,299.27l-2.36,0.04l-2.07,-2.05l-3.17,-2.02l-1.06,-1.5l-1.88,-2.02l-1.22,-1.85l-1.9,-3.49l-2.2,-2.11l-0.71,-2.08l-0.94,-1.99l-0.1,-0.12l-2.21,-1.54l-1.35,-2.17l-1.86,-1.39l-2.53,-2.68l-0.14,-0.81l1.22,0.08l3.76,0.47l2.16,2.4l1.94,1.7l1.37,1.04l2.35,2.67l0.22,0.1l2.44,0.04l1.99,1.62l1.42,2.06l0.09,0.09l1.67,1.0l-0.88,1.8l0.11,0.39l1.44,0.87l0.13,0.04l0.68,0.05l0.41,1.62l0.87,1.4l0.22,0.14l1.71,0.21l1.06,1.38l-0.61,3.04l-0.09,3.6Z", "name": "Indonesia"}, "UA": {"path": "M500.54,141.42l0.9,0.13l0.27,-0.11l0.52,-0.62l0.68,0.13l2.43,-0.3l1.32,1.57l-0.45,0.48l-0.07,0.26l0.21,1.03l0.27,0.24l1.85,0.15l0.76,1.22l-0.05,0.55l0.2,0.31l3.18,1.15l0.18,0.01l1.75,-0.47l1.42,1.41l0.22,0.09l1.42,-0.03l3.44,0.99l0.02,0.65l-0.97,1.62l-0.03,0.24l0.52,1.67l-0.29,0.79l-2.24,0.22l-0.14,0.05l-1.29,0.89l-0.13,0.23l-0.07,1.16l-1.75,0.22l-0.12,0.04l-1.6,0.98l-2.27,0.16l-0.12,0.04l-2.16,1.17l-0.16,0.29l0.15,1.94l0.14,0.23l1.23,0.75l0.18,0.04l2.06,-0.15l-0.22,0.51l-2.67,0.54l-3.27,1.72l-1.0,-0.45l0.45,-1.19l-0.19,-0.39l-2.34,-0.78l0.15,-0.2l2.32,-1.0l0.09,-0.49l-0.73,-0.72l-0.15,-0.08l-3.69,-0.75l-0.14,-0.96l-0.35,-0.25l-2.32,0.39l-0.21,0.15l-0.91,1.7l-1.77,2.1l-0.93,-0.44l-0.24,-0.0l-1.05,0.45l-0.48,-0.25l0.13,-0.07l0.14,-0.15l0.43,-1.04l0.67,-0.97l0.04,-0.26l-0.1,-0.31l0.04,-0.02l0.11,0.19l0.24,0.15l1.48,0.09l0.78,-0.25l0.07,-0.53l-0.27,-0.19l0.09,-0.25l-0.08,-0.33l-0.81,-0.74l-0.34,-1.24l-0.14,-0.18l-0.73,-0.42l0.15,-0.87l-0.11,-0.29l-1.13,-0.86l-0.15,-0.06l-0.97,-0.11l-1.79,-0.97l-0.2,-0.03l-1.66,0.32l-0.13,0.06l-0.52,0.41l-0.95,-0.0l-0.23,0.11l-0.56,0.66l-1.74,0.29l-0.79,0.43l-1.01,-0.68l-0.16,-0.05l-1.57,-0.01l-1.52,-0.35l-0.23,0.04l-0.71,0.45l-0.09,-0.43l-0.13,-0.19l-1.18,-0.74l0.38,-1.02l0.53,-0.64l0.35,0.12l0.37,-0.41l-0.57,-1.29l2.1,-2.5l1.16,-0.36l0.2,-0.2l0.27,-0.92l-0.01,-0.2l-1.1,-2.52l0.79,-0.09l0.13,-0.05l1.3,-0.86l1.83,-0.07l2.48,0.26l2.84,0.8l1.91,0.06l0.88,0.45l0.29,-0.01l0.72,-0.44l0.49,0.58l0.25,0.11l2.2,-0.16l0.94,0.3l0.39,-0.26l0.15,-1.57l0.61,-0.59l2.01,-0.19Z", "name": "Ukraine"}, "QA": {"path": "M548.47,221.47l-0.15,-1.72l0.59,-1.23l0.38,-0.16l0.54,0.6l0.04,1.4l-0.47,1.37l-0.41,0.11l-0.53,-0.37Z", "name": "Qatar"}, "MZ": {"path": "M507.71,314.14l1.65,-0.18l2.96,0.7l0.2,-0.02l0.6,-0.29l1.68,-0.06l0.18,-0.07l0.8,-0.69l1.5,0.02l2.74,-0.98l1.74,-1.27l0.25,0.7l-0.1,2.47l0.31,2.27l0.1,3.97l0.42,1.24l-0.7,1.71l-0.94,1.73l-1.52,1.52l-5.06,2.21l-2.88,2.8l-1.01,0.51l-1.72,1.81l-0.99,0.58l-0.15,0.23l-0.21,1.86l0.04,0.19l1.17,1.95l0.47,1.47l0.03,0.74l0.39,0.28l0.05,-0.01l-0.06,2.13l-0.39,1.19l0.1,0.33l0.42,0.32l-0.28,0.83l-0.95,0.86l-2.03,0.88l-3.08,1.49l-1.1,0.99l-0.09,0.28l0.21,1.13l0.21,0.23l0.38,0.11l-0.14,0.89l-1.39,-0.02l-0.17,-0.94l-0.38,-1.23l-0.2,-0.89l0.44,-2.91l-0.01,-0.14l-0.65,-1.88l-1.15,-3.55l2.52,-2.85l0.68,-1.89l0.29,-0.18l0.14,-0.2l0.28,-1.53l-0.03,-0.19l-0.36,-0.7l0.1,-1.83l0.49,-1.84l-0.01,-3.26l-0.14,-0.25l-1.3,-0.83l-0.11,-0.04l-1.08,-0.17l-0.47,-0.55l-0.1,-0.08l-1.16,-0.54l-0.13,-0.03l-1.83,0.04l-0.32,-2.25l7.19,-1.99l1.32,1.12l0.29,0.06l0.55,-0.19l0.75,0.49l0.11,0.81l-0.49,1.11l-0.02,0.15l0.19,1.81l0.09,0.18l1.63,1.59l0.48,-0.1l0.72,-1.68l0.99,-0.49l0.17,-0.29l-0.21,-3.29l-0.04,-0.13l-1.11,-1.92l-0.9,-0.82l-0.21,-0.08l-0.62,0.03l-0.63,-2.98l0.61,-1.67Z", "name": "Mozambique"}}, "height": 440.7063107441331, "projection": {"type": "mill", "centralMeridian": 11.5}, "width": 900.0});
$.fn.vectorMap('addMap', 'us_mill_en',{"insets": [{"width": 200, "top": 370, "height": 108.45463042130267, "bbox": [{"y": -9738382.809686134, "x": -19771865.68561177}, {"y": -6263522.893432467, "x": -13363914.447835693}], "left": 10}, {"width": 100, "top": 400, "height": 63.33165105817722, "bbox": [{"y": -2517962.357553506, "x": -16734015.891922569}, {"y": -2133376.310059541, "x": -16126758.634187918}], "left": 220}, {"width": 900.0, "top": 0, "height": 448.5173156956177, "bbox": [{"y": -5994230.507329411, "x": -12777719.644375157}, {"y": -2788583.1868796386, "x": -6345230.892117638}], "left": 0}], "paths": {"US-VA": {"path": "M759.72,228.63l0.64,-1.33l-0.16,-0.64l0.65,-0.59l-0.13,-0.56l-0.23,-0.12l0.65,-0.53l-0.04,-1.04l0.41,-0.18l0.06,-0.65l0.56,-0.07l0.37,-0.53l0.38,-0.57l0.29,-1.13l0.94,-0.11l0.2,-0.72l0.35,-0.03l0.21,-1.09l-0.46,-0.7l0.88,-0.42l0.13,-0.6l2.51,-0.3l-0.19,1.95l-0.63,0.69l-1.28,2.35l-0.76,1.86l0.05,0.89l-0.5,0.66l-0.32,-0.72l-0.53,-0.19l-0.67,0.55l-0.02,0.58l-0.78,0.38l-0.46,0.79l0.02,0.56l-0.55,0.89l-0.28,2.22l-0.25,-0.03l-0.4,0.35l-0.22,0.94l-0.73,-1.63l0.38,-0.59l-0.11,-0.6ZM641.29,241.29l1.08,-0.37l1.53,-0.15l1.13,-0.6l3.42,-0.84l1.03,-1.75l0.75,-0.03l2.31,-0.9l0.31,-0.59l0.03,-0.85l2.1,-1.18l0.23,-0.5l-0.05,-0.81l0.26,-0.25l5.11,-2.52l5.14,-3.99l0.13,0.53l0.67,0.45l0.07,1.16l1.06,0.8l0.49,0.76l1.29,0.3l0.58,0.64l1.08,0.59l1.27,0.15l0.78,-0.2l0.89,-0.86l1.14,-0.27l0.71,-1.01l1.77,1.52l0.38,0.1l1.46,-0.65l2.17,-0.43l0.66,0.17l1.13,-0.6l0.48,-0.66l-0.25,-0.86l0.24,-0.22l1.58,0.77l3.37,-1.55l0.25,-0.02l0.35,0.66l0.6,0.05l2.55,-1.47l0.35,-0.72l-0.33,-0.48l1.05,-0.67l0.23,-0.54l-0.18,-0.51l-0.77,-0.46l1.18,-2.26l3.23,-3.39l0.91,-1.64l0.35,-1.51l1.93,-1.77l-0.01,-0.8l0.37,-0.6l0.55,-0.31l0.69,-1.32l0.1,-1.12l0.36,-0.56l0.14,-0.83l1.05,0.36l0.73,1.6l3.32,1.02l0.59,-0.12l1.45,-1.85l0.65,-1.86l0.84,-0.71l0.3,-1.33l1.12,-1.68l1.45,0.93l0.62,-0.02l1.85,-2.41l0.5,0.14l0.61,-0.21l0.72,-0.87l0.88,-0.4l0.77,-1.37l1.75,-1.7l0.23,-2.16l0.85,-1.31l0.13,-1.64l7.33,5.42l0.62,-0.15l1.41,-3.06l2.36,0.44l0.44,0.58l0.9,0.38l-0.85,1.2l0.37,0.92l1.28,1.0l2.27,0.46l0.67,1.15l1.44,0.42l0.92,0.81l0.46,0.73l-0.04,2.07l-0.99,0.43l-0.4,-0.08l-0.38,0.29l-0.09,0.56l-0.47,-0.14l-0.59,0.41l-0.54,1.17l0.02,0.38l-0.35,0.41l-0.43,1.77l-0.42,0.12l-0.14,0.61l0.66,0.68l-0.54,0.56l0.36,0.4l1.48,0.26l1.36,-0.21l1.93,-0.94l0.19,0.45l-0.56,0.12l-0.12,0.6l1.43,1.22l-0.01,0.39l0.39,0.62l1.43,0.61l1.24,0.18l0.33,0.44l0.41,0.14l0.88,-0.35l0.92,0.15l0.19,0.5l0.91,0.68l-0.16,0.45l0.22,0.55l0.78,0.01l0.33,0.53l3.27,1.45l-0.02,0.81l-0.64,-0.47l-0.62,0.25l-0.09,0.39l0.46,1.21l-0.43,0.35l-0.0,0.41l0.32,0.4l-0.53,0.55l0.0,0.45l-0.43,-0.15l-0.57,-0.37l-0.35,-0.67l-0.67,0.01l-0.16,0.26l-0.95,-1.5l-0.79,-0.84l-0.37,0.01l-0.22,-0.51l-0.55,0.14l-0.84,-1.43l-1.01,-0.61l-0.3,-0.61l-0.65,-0.47l-0.99,-1.65l-1.16,-0.37l-0.34,-0.58l-0.47,-0.28l-1.05,-0.19l-0.48,0.35l-0.02,0.43l0.3,0.36l0.95,0.21l0.43,0.66l1.17,0.32l0.42,0.44l0.25,1.24l1.06,1.18l0.9,0.49l0.15,0.57l0.81,1.15l2.04,1.26l0.31,1.04l0.5,0.73l0.47,0.25l1.43,0.17l0.77,0.55l-0.47,0.43l0.19,0.52l1.64,0.69l0.13,0.6l0.46,0.2l-0.25,1.18l-0.7,-0.77l-0.38,0.09l-0.77,-1.01l-0.62,0.14l-0.11,0.65l-0.4,0.49l0.09,0.48l0.3,0.26l-0.23,0.43l0.43,0.4l0.43,0.02l-0.77,0.16l-1.69,-0.99l-0.9,-1.35l-0.67,-0.43l-0.75,-1.18l-0.8,-0.74l-0.55,-0.03l-0.34,0.43l0.06,0.76l0.52,0.31l0.61,0.99l0.56,0.38l1.49,1.87l2.11,1.42l1.14,-0.0l0.2,0.92l0.97,0.38l-0.45,0.39l0.15,0.64l0.82,0.05l-0.25,0.82l-0.89,0.14l-0.64,0.44l-0.43,-0.85l-2.26,-1.63l-0.17,-1.18l-0.42,-0.63l-0.75,-0.26l-1.18,0.28l-1.38,-0.66l-0.06,-0.94l-0.66,-0.22l-0.26,0.32l-0.08,0.72l-0.35,0.24l-0.97,-1.32l-0.47,-0.03l-0.53,0.34l-0.49,-0.43l-0.97,0.17l-1.95,-0.5l-0.55,0.76l0.23,0.48l1.63,0.54l1.28,0.02l0.27,0.3l0.43,0.06l0.64,-0.44l0.34,0.8l1.1,0.61l1.78,0.14l1.16,0.85l0.71,-0.34l0.27,2.07l0.94,0.47l0.25,0.49l1.28,0.63l0.13,0.71l-0.71,0.72l0.43,0.53l1.79,-0.69l0.75,0.15l0.22,0.43l0.5,0.3l0.67,-0.14l-0.32,-0.87l0.16,-0.22l-0.12,-0.66l3.27,0.82l1.07,-0.12l0.85,2.76l-0.52,0.53l-0.14,2.49l-0.41,-0.54l-0.46,-0.15l-0.25,0.68l-62.65,0.19l-17.72,-0.53l-6.35,-0.44l-0.37,-0.28l-3.84,-0.14l-0.83,0.37l-25.18,-0.12Z", "name": "Virginia"}, "US-PA": {"path": "M694.82,141.0l0.62,-0.03l3.44,-1.82l1.38,-0.51l0.0,4.46l0.4,0.4l68.61,0.05l1.16,0.78l0.34,1.3l0.54,0.24l0.81,-0.1l0.94,0.7l-0.01,0.78l0.61,0.41l-0.28,0.45l0.2,0.87l-0.04,1.57l1.26,2.14l1.1,0.5l0.68,0.59l2.08,0.32l0.45,0.78l-1.02,0.41l-1.04,1.05l-0.73,1.8l-0.75,0.91l-0.67,0.44l-0.71,1.05l-1.66,1.0l-0.17,0.73l1.21,1.74l-0.42,0.41l-0.25,0.83l-0.88,0.18l-0.35,0.47l-0.26,1.26l0.25,2.59l0.44,0.36l1.13,0.11l0.29,1.75l0.49,0.79l0.45,0.31l0.66,-0.07l0.33,0.86l3.22,3.27l-2.75,1.25l-1.05,0.88l-2.04,1.01l-0.42,0.6l-0.06,0.72l-1.48,0.61l-0.79,-0.06l-1.46,0.59l-0.46,0.46l-1.53,-0.46l-2.03,0.25l-1.37,0.86l-0.7,1.03l-73.27,-0.0l-0.01,-41.2l2.03,-0.67l2.57,-1.29l0.95,-0.71Z", "name": "Pennsylvania"}, "US-TN": {"path": "M537.69,269.77l0.72,-0.73l0.2,-0.77l0.85,0.12l0.67,-0.6l0.08,-1.04l-0.52,-1.93l0.03,-1.03l1.4,-1.41l0.18,-1.05l1.05,-0.24l0.38,-0.37l0.04,-0.41l-0.42,-0.73l0.47,-0.43l0.12,-0.51l-0.66,-1.1l2.36,-1.0l1.07,-0.81l-0.02,-0.8l-0.58,-0.52l0.3,-0.09l0.71,0.37l0.48,-0.27l0.1,-0.6l-0.21,-0.54l-0.65,-0.78l0.67,-1.58l0.59,-0.27l0.42,-0.56l-0.02,-0.36l-0.89,-1.38l1.3,-0.09l0.44,-0.38l-0.08,-0.63l-0.89,-0.61l0.81,-0.1l0.44,-0.36l0.19,-0.59l-0.38,-1.22l0.69,0.43l0.56,-0.19l0.61,-0.63l21.3,0.01l0.4,-0.36l0.07,-1.1l-0.44,-1.92l2.57,0.23l0.32,0.47l0.36,0.09l20.66,-0.36l9.96,0.63l11.63,0.07l21.66,0.7l1.08,-0.33l26.64,0.13l0.75,-0.37l3.11,0.12l-0.53,0.97l0.22,0.77l-0.68,1.5l0.1,0.62l-0.89,-0.16l-1.81,1.17l-1.72,2.91l-0.68,0.51l-0.39,-0.09l-0.42,-0.68l-1.26,-0.23l-2.62,0.98l-0.91,0.81l-0.78,1.15l-0.97,0.55l-0.2,-0.27l0.04,-0.88l-0.57,-0.55l-0.49,0.04l-2.2,1.02l-0.58,1.07l-0.76,-0.31l-0.87,0.26l-0.29,0.59l0.14,0.67l-1.02,1.54l-1.12,-0.14l-1.71,0.65l-1.32,0.81l-0.7,0.74l-0.72,0.11l-2.36,1.63l-0.92,0.17l-0.66,-0.25l-2.05,0.14l-2.56,1.03l-0.54,0.76l-0.84,0.31l-0.63,0.59l-0.59,2.28l-0.37,0.39l-1.49,0.18l-0.75,-0.24l-1.11,0.78l-0.25,0.61l-0.34,3.54l-37.06,-0.04l-22.57,-0.35l-0.31,0.21l-31.59,-0.04Z", "name": "Tennessee"}, "US-ID": {"path": "M117.67,96.19l1.16,-1.26l0.34,-1.21l1.1,-2.21l1.49,-1.06l1.11,-1.54l0.69,-2.05l-0.17,-1.04l1.77,-2.43l0.95,-2.56l0.13,-1.25l1.63,-2.26l0.48,-1.32l0.74,-0.86l0.2,-0.61l-0.15,-0.91l-1.32,-2.48l-1.83,-0.85l-0.64,-0.52l-0.95,-0.19l-1.14,-1.27l-0.96,-2.57l-0.78,-0.91l0.7,-1.19l-0.56,-2.08l-1.53,-2.17l0.28,-0.93l-0.2,-50.44l14.63,0.0l-0.01,19.38l1.86,2.45l1.25,0.99l0.55,1.36l1.51,1.4l0.02,0.77l0.59,0.93l-0.76,0.61l-0.11,0.4l0.72,0.69l0.33,0.73l-0.75,0.25l-0.13,0.71l2.29,1.23l1.4,1.67l2.52,0.76l0.82,1.34l1.35,1.03l0.66,0.99l1.32,1.28l0.21,0.6l0.88,0.42l1.06,0.95l-0.02,0.79l0.36,0.89l1.31,0.99l0.8,0.28l-0.11,0.76l0.26,0.46l0.73,0.06l0.89,-0.64l0.4,0.31l-0.26,0.53l0.17,0.53l1.27,0.7l1.65,-0.09l1.83,-0.57l-0.27,2.34l-0.67,0.28l-0.23,0.33l0.44,0.93l-0.49,1.16l-0.04,0.92l-0.76,1.53l0.33,1.49l-0.8,0.17l-0.31,0.57l0.15,0.47l0.67,0.65l-0.48,0.83l0.16,1.08l0.3,0.41l0.78,0.29l-0.2,0.84l0.4,0.72l-1.48,0.55l-1.02,1.44l0.27,1.01l0.57,0.6l-0.0,0.61l-0.72,0.8l0.18,0.62l-0.23,0.41l0.1,0.4l1.59,0.35l1.67,1.39l0.79,0.13l1.02,-0.44l0.44,-0.77l0.58,-0.04l1.21,-0.57l1.02,-1.28l0.78,-0.36l0.08,-0.69l0.91,0.61l0.34,0.6l1.16,0.43l-0.26,1.08l0.22,0.45l0.66,0.33l-0.14,1.24l0.19,0.6l0.57,0.49l0.03,1.45l0.69,0.62l0.19,0.58l1.06,0.92l0.57,1.47l0.87,0.21l0.96,1.71l-0.04,0.81l-0.68,0.66l0.79,1.65l1.39,0.85l0.42,0.66l0.79,-0.03l0.83,-0.43l1.18,0.68l1.43,2.28l-0.39,0.75l0.64,1.15l0.46,0.35l-0.16,0.61l0.25,0.79l1.16,0.93l0.86,0.29l0.58,0.61l0.48,0.02l0.42,-0.26l0.14,-0.38l-0.29,-0.63l0.93,-0.87l0.92,-0.3l4.69,0.88l0.64,-0.35l0.49,-1.24l1.14,-0.49l0.5,0.26l1.87,0.3l3.27,-0.45l1.05,0.66l1.33,-0.29l0.87,-0.46l1.64,0.01l0.91,0.38l0.75,-0.05l0.4,-0.53l-0.23,-0.42l-0.54,-0.22l-0.04,-0.39l0.17,-0.47l0.68,-0.52l-0.15,-0.84l0.75,-0.18l0.37,-0.37l0.55,0.28l0.93,1.47l0.39,0.26l0.26,0.96l0.62,0.39l0.97,1.16l0.76,0.31l0.02,46.58l-92.18,0.01l-0.19,-34.03l0.87,-1.17l0.58,-2.47l-0.1,-0.77l-0.4,-0.65l0.49,-0.09l0.31,-0.34l0.35,-1.39l-1.11,-0.96l-0.4,-1.01l-1.22,0.13l-0.58,-0.56l-0.64,0.04l-0.36,0.32l-0.43,-0.33l0.04,-0.86l-0.31,-0.82l0.31,-1.0l-0.09,-0.55Z", "name": "Idaho"}, "US-NV": {"path": "M156.86,269.15l-30.9,-27.49l-22.85,-19.78l-29.06,-23.59l-0.01,-54.79l92.05,-0.01l0.01,105.04l-0.64,1.01l-0.57,1.83l-0.34,0.18l-1.19,-0.01l-1.15,-1.66l-0.73,-0.43l-1.21,0.35l-1.86,-0.57l-1.39,0.39l-1.09,0.56l-0.37,0.45l-0.34,2.13l0.44,1.05l0.69,0.89l-0.39,0.82l-0.04,1.1l0.13,0.94l0.62,1.5l-0.01,1.1l-0.29,1.05l1.17,2.83l0.3,2.44l-0.11,0.81l-0.64,0.13l-0.23,0.28l-0.03,0.49l0.37,0.54l-0.33,0.46Z", "name": "Nevada"}, "US-TX": {"path": "M282.01,322.94l55.53,-0.02l0.4,-0.4l0.37,-78.58l46.56,-0.0l0.05,33.71l0.44,0.4l0.89,-0.11l0.66,0.21l3.27,3.06l1.46,0.17l0.76,-0.46l2.18,0.52l0.43,-0.3l0.23,-1.03l0.47,0.57l0.79,0.18l0.31,0.72l0.64,0.6l0.06,1.59l0.41,0.43l2.49,0.37l1.08,-0.15l1.19,0.72l2.4,0.58l1.6,-0.42l0.53,0.09l1.09,1.2l0.53,0.26l1.22,-0.07l1.1,-1.12l2.1,0.24l1.4,-0.33l0.04,1.73l0.82,0.62l1.33,0.33l-0.13,1.33l0.25,0.5l0.47,0.27l0.91,0.24l0.81,-0.16l2.89,-2.14l0.35,0.23l0.02,0.72l0.31,0.52l1.72,0.2l0.17,0.79l0.66,0.45l1.28,-0.13l0.78,-0.71l0.3,0.25l0.57,-0.06l0.51,-0.74l0.16,0.24l-0.42,0.95l0.1,0.68l0.56,0.94l0.7,0.37l0.49,-0.02l0.56,-0.4l0.29,-1.16l0.32,-0.25l0.09,-0.45l0.8,-0.58l0.32,-1.14l0.44,-0.08l0.3,0.09l0.22,0.78l0.43,0.5l1.13,0.1l0.7,0.42l1.11,-0.13l0.64,-1.04l0.3,0.1l-0.07,0.62l0.4,0.52l1.02,0.39l0.42,0.6l1.31,0.01l1.22,1.41l0.49,0.03l0.6,-0.52l0.1,-0.51l1.25,-0.03l0.42,-0.3l0.42,-0.81l1.63,-0.26l1.46,-0.83l1.28,0.7l1.34,-0.12l0.33,-0.64l1.93,-0.5l0.49,-0.4l0.36,0.23l0.12,0.63l0.2,0.1l1.58,0.4l1.46,0.02l1.7,-0.87l0.35,-0.77l0.89,0.28l1.86,1.32l0.99,0.18l0.13,0.4l1.31,1.32l1.82,0.42l0.87,0.79l0.66,-0.05l2.09,0.79l0.87,0.07l0.28,0.64l1.16,0.84l1.28,-0.04l0.35,-0.53l0.65,0.31l0.79,-0.27l0.77,0.32l0.67,-0.08l0.48,0.29l0.08,26.89l1.21,1.43l1.04,0.7l0.93,1.51l0.37,1.29l-0.29,1.47l0.08,0.6l0.79,1.02l0.58,0.33l-0.02,0.73l0.57,0.42l0.18,0.66l0.46,0.55l-0.15,1.02l0.75,0.78l0.41,1.31l0.33,0.29l0.53,-0.01l-0.25,1.21l0.51,0.97l-0.65,0.31l-0.13,0.44l0.54,0.99l-0.48,0.64l0.07,1.11l-0.61,1.17l-0.16,0.87l-0.66,0.61l-0.38,1.15l-0.47,0.32l-0.27,0.59l0.42,1.59l-0.7,1.18l-0.1,0.56l0.09,0.88l0.61,0.93l-0.2,0.8l0.31,1.24l-0.28,1.06l-0.97,1.18l-0.84,0.12l-1.67,2.59l-0.08,0.9l1.31,1.76l-2.73,-0.07l-6.11,2.55l-0.01,-0.21l-0.67,-0.28l-0.17,0.14l-1.0,-0.4l-2.52,0.67l0.6,-1.34l0.32,-1.46l-0.19,-0.75l-0.78,-0.74l-0.42,-0.02l-1.3,0.6l-0.88,1.5l-1.2,-0.8l-1.42,0.04l-0.09,0.62l0.63,0.51l0.01,0.79l0.38,0.33l-0.48,0.91l0.18,0.45l1.07,0.49l-0.34,0.52l0.36,0.8l0.9,0.49l-0.25,0.75l-0.39,0.01l-0.84,0.59l-1.57,1.71l-0.84,-0.39l-0.49,0.11l0.2,0.84l-0.01,1.91l-1.56,1.08l-1.62,1.55l-0.79,0.25l-3.42,2.09l-2.69,0.23l-2.1,0.74l-0.23,0.78l-0.87,-0.16l-1.37,0.57l-0.25,-0.27l-0.73,0.06l0.26,-0.48l-0.18,-0.49l-0.3,-0.11l-1.2,0.13l-0.96,0.77l-0.39,-0.4l-0.1,-0.98l-1.15,-0.69l-0.5,0.42l0.47,1.18l-0.02,0.73l-1.45,-0.33l-0.44,-1.04l-1.19,-0.34l-0.58,0.37l0.02,0.42l0.72,1.38l0.0,0.98l1.59,0.72l-0.51,0.22l-0.3,0.54l0.11,0.28l0.63,0.25l0.88,-0.39l0.65,0.35l-3.41,1.7l-0.41,-0.12l-0.27,-1.1l-0.37,-0.16l-0.89,-1.15l-0.47,-0.05l-0.44,0.43l-0.03,0.46l-0.39,0.24l-0.07,0.52l0.89,1.24l-0.27,0.77l0.22,0.66l-1.33,1.3l0.21,-1.65l-0.41,-0.36l-0.48,0.15l-0.61,0.84l0.17,0.61l-0.23,0.52l0.01,-0.71l-0.47,-0.49l-1.58,0.93l-0.65,-0.26l-0.64,0.44l0.0,0.6l-0.62,0.7l0.14,0.67l0.73,0.25l0.11,0.47l0.55,0.4l0.5,-0.37l0.3,-0.78l0.55,-0.22l0.01,0.29l-2.29,3.19l-0.95,-0.74l-1.15,0.27l-0.24,-0.28l-2.83,0.12l-0.2,0.59l0.34,0.5l0.47,0.32l1.13,0.05l0.02,0.68l0.43,0.52l1.59,0.85l-2.31,5.7l-0.49,-0.33l0.08,-0.45l-0.55,-0.45l-0.89,0.61l-0.09,0.31l-0.54,0.06l-0.36,0.41l-1.28,-1.77l-0.94,-0.74l-0.61,0.39l0.06,0.4l1.09,1.57l-0.15,0.49l-0.6,-0.05l-0.34,0.63l0.44,0.47l1.5,0.09l1.63,0.59l0.64,-0.02l0.96,-0.44l-0.3,1.22l0.16,0.56l-0.78,0.51l0.24,1.18l-0.82,0.08l-0.4,0.38l0.24,1.62l-0.26,1.25l0.4,0.59l0.62,0.17l0.61,2.18l0.5,2.17l-0.74,0.59l0.46,0.45l-0.05,0.97l0.55,0.27l0.13,0.44l0.41,0.27l0.33,1.37l0.46,0.28l0.36,2.46l0.95,0.53l-0.28,0.75l0.16,0.8l-0.29,0.43l-0.78,0.06l-0.52,0.45l0.01,0.68l-0.56,0.09l-0.26,-0.47l-1.17,-0.39l-2.26,-2.01l-1.71,-0.18l-0.68,-0.41l-3.31,0.0l-0.65,0.29l-0.64,-0.47l-1.3,0.16l-1.62,-0.7l-0.54,-0.74l-0.41,-0.14l-0.26,-0.55l-0.91,-0.39l-0.77,-0.04l-1.55,-0.68l-1.16,0.28l-0.45,-0.36l-0.17,-0.46l-0.47,-0.19l-1.12,-1.07l-1.58,-0.03l-1.17,-0.5l-1.84,-0.18l0.2,-0.97l-0.43,-0.81l-0.74,-0.29l-0.21,-1.34l-1.04,-3.28l-2.19,-2.37l-0.23,-0.87l-0.81,-0.53l0.26,-0.56l-0.18,-0.64l0.27,-1.66l-0.34,-0.75l-0.77,-0.8l0.5,-1.68l-0.0,-0.87l-0.14,-0.45l-0.41,-0.29l-0.14,-1.37l-1.52,-1.16l-0.68,0.13l-0.21,-0.27l-0.66,-0.11l-0.59,-1.0l-1.73,-1.29l0.0,-0.5l-0.37,-0.47l0.06,-0.67l-0.79,-0.72l-0.08,-0.6l-0.88,-0.45l-1.06,-2.23l-2.13,-1.15l-0.34,-0.71l-0.87,-0.43l-0.05,-0.9l-0.66,-0.91l-0.4,-1.44l0.21,-0.11l-0.04,-0.73l-0.81,-0.36l-0.2,-0.97l-0.65,-0.46l-0.78,-1.32l-0.51,-1.86l-1.5,-1.82l-0.13,-1.28l-0.61,-2.01l-1.49,-1.04l0.04,-0.53l-0.65,-0.96l-1.08,-0.58l-0.84,-0.81l-1.32,-0.65l-0.63,-1.46l-1.49,-0.46l-1.17,-0.76l-0.03,-1.25l-0.54,-0.31l-0.62,0.14l-0.17,-0.53l-0.73,-0.18l-0.72,-1.57l-0.56,-0.47l-0.31,0.1l-0.41,-0.34l-0.65,0.15l-0.54,-0.64l-0.45,0.15l-0.18,0.45l-0.83,0.13l-2.32,-0.32l-0.38,-0.3l-1.21,-0.0l-0.64,0.24l-0.63,-0.33l-2.19,0.25l-1.35,-0.7l-0.62,-0.08l-1.0,-0.68l-0.6,-0.03l-0.85,0.67l-0.48,1.25l-1.62,-0.09l-0.41,0.32l-0.41,-0.09l-2.08,0.67l-2.38,4.95l-0.12,1.35l-0.6,0.59l-0.26,1.21l0.21,0.63l-1.49,0.79l-0.55,1.02l-0.85,0.5l-0.52,0.72l-0.19,0.79l-2.25,-0.21l-0.95,-0.64l-0.42,0.23l-1.38,-0.86l-1.11,-1.22l-2.39,-0.58l-0.9,-0.68l-0.07,-0.5l-0.4,-0.35l-2.26,-0.31l-1.87,-0.72l-1.6,-1.29l-0.8,-1.16l-0.81,-0.67l-0.6,-0.24l-0.7,0.03l-1.46,-0.89l-0.21,-0.42l-0.97,-0.71l-0.78,-2.21l-0.74,-0.75l-0.23,-0.82l-0.68,-0.97l-0.3,-1.77l0.32,-1.29l-0.01,-1.12l-2.68,-3.84l-0.15,-1.54l-1.14,-1.9l-0.84,-0.34l-0.43,-0.94l-1.22,-0.57l-0.66,-0.75l-1.23,-0.85l-0.86,-0.06l-1.7,-0.85l-0.66,-0.77l-2.15,-1.71l-0.58,-1.19l-2.73,-1.84l-1.45,-1.83l-1.05,-0.69l-0.54,-0.77l-0.8,-0.52l-2.37,-0.83l-0.7,-0.5l-1.09,-1.62l-0.41,-1.19l-0.75,-1.23l-0.71,-0.64l-1.51,-0.22l-0.92,-0.89l-0.56,-0.24l-0.83,-2.27ZM429.17,424.54l0.13,-0.1l0.18,-0.24l0.02,0.31l-0.33,0.03ZM435.46,388.17l-0.06,-0.27l0.65,-0.15l-0.01,0.01l-0.58,0.41ZM433.07,390.44l0.59,-0.97l0.4,-0.3l-0.02,0.22l-0.97,1.05Z", "name": "Texas"}, "US-NH": {"path": "M814.7,129.01l-0.12,-0.41l-1.07,-1.17l-0.13,-0.77l0.46,-1.63l0.68,-0.37l0.19,-0.45l0.5,-4.61l0.55,-0.96l0.17,-4.78l0.92,-1.07l0.35,-1.89l1.48,-1.3l0.53,-1.95l1.26,-1.74l-0.22,-0.67l0.95,-1.88l0.19,-3.32l0.69,-0.84l1.98,-0.2l1.08,-0.98l1.85,-0.99l1.23,-1.31l0.1,-1.01l0.68,-0.38l0.03,-0.62l-1.27,-2.65l0.04,-0.28l1.81,-2.51l0.12,-0.74l-0.34,-0.61l-0.04,-0.61l0.44,-0.47l-0.02,-0.62l1.42,-2.56l-0.03,-0.78l1.26,-1.0l2.27,0.92l0.51,-0.16l0.39,-0.45l1.93,32.44l-0.29,3.24l0.32,0.71l1.48,1.83l0.69,0.45l-0.06,1.59l1.14,1.36l-0.08,0.23l0.59,0.49l-1.51,2.74l-1.52,-0.22l-1.58,0.64l-0.75,0.64l-1.01,0.05l-0.5,0.41l-0.46,0.83l-0.75,0.29l-0.7,0.61l-17.79,-0.51Z", "name": "New Hampshire"}, "US-NY": {"path": "M790.32,168.22l1.69,-2.23l0.58,0.13l0.69,-0.48l0.66,0.3l0.61,-0.25l0.04,-0.2l0.5,0.1l0.43,-0.47l0.6,0.14l0.35,-0.48l-0.16,-0.72l0.31,-0.34l0.66,-0.16l1.17,0.49l0.38,-0.02l0.25,-0.34l1.38,0.2l0.43,-0.59l1.66,0.44l1.22,-0.48l0.33,-0.65l0.49,0.38l0.56,-0.39l4.74,0.1l2.41,-0.51l2.6,-1.87l-0.49,0.75l-1.12,0.46l-0.42,0.61l-0.76,0.36l-0.56,0.61l0.38,0.62l1.52,0.09l0.06,0.48l-0.47,0.26l-1.5,0.38l-0.44,-0.18l-2.3,0.2l-0.48,0.76l-0.63,-0.24l-2.95,0.74l-0.96,-0.12l-0.4,0.6l-1.12,-0.22l-2.54,1.01l-4.61,0.73l-0.39,0.53l-0.2,0.0l-0.27,-0.77l-1.17,-0.37l-1.29,0.45l-0.1,0.59l-0.45,0.25l-0.5,0.09l-0.44,-0.76ZM814.87,163.5l0.43,-0.79l1.47,-0.97l0.52,0.04l0.73,-0.49l0.43,0.42l0.68,-0.27l0.01,-0.28l0.43,0.65l-1.61,0.54l-2.22,1.18l-0.74,0.21l-0.12,-0.22ZM817.27,159.0l0.01,-0.0l-0.01,0.01l-0.0,-0.0ZM701.06,138.32l4.33,-2.51l1.67,-1.59l1.71,-0.83l0.35,-0.4l1.27,-0.44l1.93,-2.56l1.76,-0.79l0.7,-0.62l0.2,-1.63l-0.5,-1.04l-0.16,-0.94l-0.33,-0.35l0.63,-0.82l-0.01,-0.76l-0.68,-0.61l-2.0,-0.38l0.25,-0.78l-0.07,-1.92l2.7,-0.82l1.64,-0.25l1.06,-0.45l4.71,-0.64l2.33,0.3l1.92,-0.26l5.47,0.92l1.8,1.31l0.9,0.36l0.83,-0.02l2.57,-0.75l5.51,0.24l0.45,0.5l0.67,-0.02l0.37,-0.8l1.53,-0.3l1.22,-0.57l0.76,-0.01l1.14,-1.56l2.21,-1.08l1.06,-0.89l1.08,0.26l1.19,-0.2l1.41,-1.13l-0.04,-0.64l-0.21,-0.14l0.61,-0.84l-0.12,-0.59l-0.6,-0.12l0.12,-1.01l-0.51,-1.53l-0.76,-0.72l0.59,0.4l0.55,-0.12l1.07,-1.05l0.22,-0.77l0.93,-0.37l0.26,-0.41l-0.03,-0.51l-0.35,-0.32l-0.48,-0.05l-0.82,0.48l0.62,-0.87l-0.64,-0.79l-1.19,-0.23l-1.05,0.48l-0.78,-0.72l2.59,-1.67l2.08,-0.85l2.27,-1.86l0.82,-0.32l0.27,-0.48l0.99,-0.63l0.22,-0.51l-0.22,-0.9l1.19,-1.38l6.63,-5.37l5.82,-2.74l2.9,0.22l20.64,-0.13l0.14,0.78l-0.64,1.69l0.64,1.26l-0.64,3.31l0.18,0.95l1.04,1.76l0.08,0.56l-0.61,1.57l0.24,1.39l-0.09,0.81l-0.85,0.74l-0.95,2.9l0.43,0.94l0.16,1.79l0.34,0.81l-0.12,0.96l0.35,0.83l-0.88,2.4l-0.08,0.9l0.31,0.88l0.47,0.19l0.67,-0.38l0.3,-0.7l0.36,0.02l0.28,0.77l0.38,0.38l-0.3,12.86l-0.2,0.91l0.35,1.16l-3.89,12.6l0.39,0.71l-0.99,14.0l0.76,1.36l-3.35,1.89l-0.13,0.56l1.05,1.41l0.02,0.41l-0.24,0.31l-0.7,0.22l-1.07,1.31l-0.48,0.24l-0.08,0.57l-1.15,0.18l0.99,-3.16l0.06,-1.95l-0.27,-1.53l-1.04,-1.2l0.13,-0.94l-0.63,-0.29l-0.56,0.47l-0.19,0.56l0.31,1.25l0.73,0.88l0.14,2.42l-11.57,-6.36l-0.83,-1.49l-2.26,-0.33l-0.47,-0.49l-0.94,-0.35l-1.13,-1.93l0.09,-1.32l-0.18,-0.67l0.27,-0.62l-0.19,-0.64l-0.39,-0.27l0.13,-0.29l-0.24,-0.52l-1.36,-0.91l-1.07,0.03l-0.36,-1.32l-1.4,-0.99l-68.54,-0.05l-0.0,-4.37ZM787.73,169.9l0.24,-1.17l1.09,-0.13l-0.02,0.42l-1.3,0.88ZM712.63,123.92l0.15,-0.49l0.71,0.07l-0.54,0.76l-0.32,-0.34Z", "name": "New York"}, "US-HI": {"path": "M299.29,452.24l-0.38,-1.84l-1.43,-2.18l-0.07,-0.61l1.19,-1.43l1.02,-0.51l1.22,-1.85l0.89,-0.87l0.03,-0.74l-1.18,-1.62l-0.41,-1.16l0.54,-1.35l1.78,0.6l0.3,0.64l2.59,1.48l0.76,-0.14l6.09,2.66l2.05,2.08l0.31,2.57l0.42,0.33l1.21,-0.04l0.42,1.59l0.84,0.83l2.08,1.2l-0.46,0.99l-1.43,0.8l-1.77,1.66l-3.22,1.03l-1.84,0.06l-4.08,2.68l-0.87,0.84l-0.47,1.4l-0.72,1.01l-0.56,0.37l-1.4,-1.21l-2.07,-0.51l-0.58,-0.81l-0.03,-1.73l0.48,-3.2l-0.75,-2.68l-0.49,-0.36ZM286.01,423.9l0.9,-0.55l0.27,0.17l0.79,0.82l0.62,1.38l0.7,0.4l1.78,-0.43l0.88,-0.52l1.46,0.23l0.78,0.84l0.92,0.21l0.34,0.69l2.12,0.81l0.0,0.91l-0.91,0.96l-1.17,0.65l-1.35,-0.13l-1.46,0.78l-2.14,0.2l-0.42,-0.69l-0.06,-1.65l-0.61,-1.49l-0.57,-0.24l-1.08,0.14l-1.34,-0.63l-1.06,-1.5l0.62,-1.36ZM285.63,432.65l0.71,-0.3l1.0,-0.59l0.01,0.75l-1.71,0.14ZM275.29,419.94l0.41,-0.1l0.67,0.47l2.41,0.12l1.03,0.31l0.59,-0.27l1.14,0.63l1.42,-0.01l0.44,-0.24l0.96,0.19l-0.55,0.66l-1.87,0.73l-3.55,-1.07l-3.93,0.35l0.83,-1.76ZM281.65,428.21l-0.63,0.2l-0.7,-0.21l-0.3,-1.67l-0.95,-0.78l1.95,-0.17l1.19,1.01l0.48,0.51l-1.05,1.11ZM256.79,412.83l2.28,0.06l1.55,-1.67l0.9,-0.52l0.59,0.4l0.71,1.47l0.81,0.81l-0.18,0.64l0.55,1.06l0.69,0.7l0.96,0.1l0.57,0.49l0.18,0.92l0.72,0.52l-0.49,0.34l-0.77,-0.12l-1.11,0.31l-1.25,-1.19l-0.39,-0.21l-0.53,0.14l0.01,-0.78l-0.95,-0.4l-1.35,0.61l0.12,0.44l0.71,0.48l-1.59,0.28l-0.42,-1.28l-0.62,-0.41l-1.28,-1.67l0.08,-0.82l-0.51,-0.69ZM228.76,403.72l1.13,-1.59l2.84,-1.59l0.87,0.33l1.94,-0.42l1.06,0.59l0.51,1.02l-0.79,1.72l0.1,1.09l-0.33,0.59l-1.5,1.19l-1.2,-0.5l-1.34,0.04l-1.05,-1.11l-0.84,-0.02l-0.86,-0.41l-0.54,-0.92ZM220.67,408.19l-0.26,-0.26l0.27,-0.86l0.55,-0.78l0.42,-0.11l1.38,-1.44l-0.28,1.39l-1.17,0.42l-0.67,0.83l-0.24,0.81Z", "name": "Hawaii"}, "US-VT": {"path": "M799.62,104.23l0.87,-2.6l0.89,-0.82l0.13,-1.1l-0.25,-1.27l0.61,-1.61l-0.12,-0.89l-1.04,-1.75l-0.14,-0.75l0.64,-3.2l-0.1,-0.54l-0.54,-0.79l0.63,-1.53l-0.12,-0.93l27.44,-0.17l0.32,1.7l-1.42,1.79l-0.49,1.31l1.28,2.83l-0.62,0.38l-0.09,1.0l-1.09,1.14l-1.72,0.9l-1.0,0.94l-1.86,0.15l-0.86,0.63l-0.39,0.82l-0.19,3.34l-0.97,1.95l0.19,0.58l-1.13,1.55l-0.48,1.85l-1.49,1.31l-0.42,2.02l-0.95,1.16l-0.18,4.84l-0.55,0.97l-0.5,4.61l-0.78,0.55l-0.54,1.95l0.22,1.23l1.06,1.17l-11.47,-0.39l-0.28,-0.78l0.19,-0.94l0.3,-13.03l-0.82,-1.51l-0.39,-0.28l-0.99,0.03l-0.56,0.85l0.03,-0.8l0.81,-1.86l0.11,-0.78l-0.37,-1.02l0.13,-0.84l-0.35,-0.89l-0.17,-1.83l-0.41,-0.68Z", "name": "Vermont"}, "US-NM": {"path": "M244.72,333.74l0.01,-98.74l93.41,0.0l0.01,8.14l-0.65,0.42l-0.36,78.56l-55.65,0.02l-0.4,0.42l0.01,0.29l0.48,1.51l0.58,1.29l0.69,0.39l-25.57,-0.07l-0.4,0.4l0.0,7.36l-12.16,0.0Z", "name": "New Mexico"}, "US-NC": {"path": "M631.07,265.86l0.78,0.25l1.38,-0.1l0.44,-0.26l0.62,-0.73l0.07,-0.73l0.47,-0.85l-0.04,-0.52l1.34,-0.75l0.55,-0.75l2.17,-0.85l1.92,-0.12l0.63,0.25l1.24,-0.23l2.45,-1.67l0.71,-0.08l0.82,-0.85l1.15,-0.7l1.44,-0.57l1.39,0.07l0.64,-0.62l0.81,-1.35l-0.07,-0.98l1.42,0.29l0.74,-1.25l0.9,-0.45l1.05,-0.44l0.18,1.25l0.45,0.39l0.46,0.06l1.37,-0.74l1.6,-1.89l1.75,-0.48l0.68,-0.4l0.65,0.17l0.15,0.43l0.46,0.33l0.97,-0.01l0.93,-0.73l1.59,-2.77l0.39,-0.31l1.12,-0.7l1.27,0.3l0.46,-0.2l0.05,-0.46l-0.42,-0.69l0.68,-1.5l-0.2,-0.83l0.51,-0.85l6.66,0.48l17.74,0.53l62.79,-0.19l0.1,0.98l2.34,3.26l0.43,1.17l-0.61,-0.88l-0.07,-0.56l-0.71,-0.51l-0.47,-0.07l-0.38,0.58l0.45,0.56l0.2,1.21l-0.45,-0.1l-0.62,-0.77l-1.78,-1.08l-0.3,-0.47l-0.52,-0.0l-0.45,0.51l-0.02,0.61l1.1,0.64l1.05,1.3l-0.98,0.26l-1.88,-1.43l-0.46,0.4l0.04,0.4l0.96,1.04l-1.32,-0.55l-1.73,-1.12l-0.48,0.04l-0.09,0.47l0.34,0.64l1.13,0.92l-0.76,0.23l-0.19,0.52l-0.43,0.27l-1.42,0.29l-0.59,-0.77l-0.86,0.18l-0.62,-2.02l0.74,-2.06l-0.29,-0.49l-0.73,-0.35l-0.49,0.55l0.38,0.6l-0.58,0.68l-0.25,0.85l0.05,1.48l0.87,2.01l-0.51,0.93l0.4,0.4l2.68,0.12l2.13,-0.75l0.35,0.74l0.46,0.08l0.29,-0.18l1.33,0.35l0.31,-0.67l-0.26,-0.27l1.1,-0.29l1.74,-0.0l-0.28,0.86l0.45,0.39l-0.67,0.67l0.51,0.92l-0.71,-0.1l-0.34,0.61l0.42,0.43l0.67,0.22l-0.06,0.62l-0.95,-0.18l-0.34,0.61l0.46,0.61l1.09,0.13l0.4,0.3l0.47,-0.25l0.59,-1.5l0.08,-2.69l0.43,-0.27l0.38,0.44l0.81,0.23l0.37,-0.32l-0.03,-0.5l0.4,-0.32l1.01,1.72l-0.31,1.09l0.32,0.72l-0.44,0.04l-0.36,0.39l0.5,1.08l-0.12,0.2l-0.44,0.32l-0.69,-0.08l-0.58,-0.85l-0.39,0.23l-0.17,1.0l-1.28,1.06l0.02,0.45l-0.26,0.08l-0.35,0.72l-0.53,0.05l-0.23,0.25l-0.15,0.73l-0.93,0.55l-0.91,-0.04l-0.44,-0.41l-0.57,0.29l-0.61,-0.81l-0.72,-0.09l-0.16,-0.68l-0.49,-0.32l-0.55,0.2l-0.13,0.74l-0.48,0.08l-0.16,-0.42l-0.42,-0.16l-0.11,-0.48l0.71,0.03l0.45,-0.31l0.23,-0.48l-0.44,-0.57l-1.8,-0.16l-1.21,0.57l-0.19,0.4l0.59,0.47l0.06,0.83l-0.32,-0.3l-1.62,0.31l-0.86,-0.55l-1.26,-0.23l-1.44,-0.56l-0.81,-0.6l-0.5,-0.0l-0.12,0.48l0.25,0.54l0.76,0.57l0.15,0.52l0.57,0.26l0.35,-0.18l0.44,0.1l1.3,0.81l2.03,0.8l2.85,0.73l0.26,0.36l-0.11,0.3l-0.83,-0.15l-0.46,0.53l-1.62,0.8l0.16,0.66l1.41,0.37l-2.75,2.05l-0.95,-0.04l-0.46,-0.24l-1.15,-1.07l-0.72,-0.32l-0.83,-1.03l-0.56,-0.24l-0.46,0.11l-0.03,0.47l2.19,3.16l2.24,0.74l1.03,0.63l1.9,-1.34l0.33,0.46l0.93,0.49l0.52,-0.47l-0.29,-0.69l0.61,0.26l0.06,0.46l0.34,0.31l1.55,-0.33l0.07,0.62l-0.28,0.16l-0.4,-0.25l-0.37,0.25l-0.16,0.69l-1.19,1.14l-0.16,0.59l-0.46,-0.12l0.03,-0.65l-0.83,-0.7l-0.51,0.36l-0.04,0.58l-0.39,-0.6l-0.71,-0.01l-0.97,0.61l-0.23,0.3l0.12,0.23l-1.72,-0.14l-2.68,0.89l-0.34,-0.84l-0.62,-0.45l-0.47,0.39l0.13,0.96l-0.46,-0.09l-0.34,0.35l0.02,0.3l-1.1,1.13l-0.92,0.47l-0.31,-0.24l0.46,-0.39l0.14,-0.7l-0.67,-0.87l-0.01,-0.48l-0.4,-0.36l-1.01,-0.28l-0.25,0.42l0.13,1.0l0.1,0.29l0.49,0.19l0.11,0.42l-0.79,0.09l-0.25,0.65l0.44,0.64l0.57,0.26l-0.06,0.18l-2.1,0.89l-2.18,1.71l-2.56,2.97l-0.76,1.76l-0.49,-1.33l-0.48,-0.28l-0.4,0.4l0.29,2.16l-0.09,1.1l-0.93,1.57l-3.31,-0.56l-1.34,0.25l-0.14,-0.41l-0.5,-0.3l-0.68,0.73l-1.84,0.55l-0.47,-0.13l-16.83,-15.97l-0.9,-0.2l-16.57,-0.35l-0.1,-2.25l-2.31,-2.76l-0.44,-0.01l-1.2,0.78l0.18,-0.9l-0.65,-0.61l-20.24,-0.86l-0.53,-0.31l-0.63,0.28l-0.33,0.47l-3.74,0.94l-0.34,0.49l-0.62,0.35l-0.38,-0.19l-0.5,0.1l-4.54,1.41l-18.63,0.23l0.35,-3.53l0.7,-0.61ZM761.81,249.9l0.04,0.15l0.02,0.05l-0.09,-0.12l0.04,-0.08ZM754.42,270.87l0.07,-0.12l0.03,0.03l-0.1,0.09ZM752.17,270.3l0.0,-0.07l0.05,0.06l-0.05,0.01ZM760.06,243.17l0.28,-0.11l0.02,0.2l-0.23,0.0l-0.06,-0.09Z", "name": "North Carolina"}, "US-ND": {"path": "M428.09,7.99l1.98,6.42l-0.67,1.34l-0.19,0.98l0.53,2.22l-0.32,1.08l0.43,1.83l-0.22,1.37l0.13,1.64l1.37,3.67l0.44,0.49l-0.1,0.88l0.36,1.42l0.64,0.71l0.84,1.89l0.29,1.26l0.27,0.28l0.08,2.07l-0.25,1.45l0.41,0.66l-0.11,2.44l0.33,1.83l0.01,3.3l0.49,1.44l0.49,0.23l-0.34,0.75l-0.23,1.56l0.31,1.49l-0.21,1.58l0.68,1.04l0.13,1.95l0.39,0.47l0.07,0.55l1.76,2.35l0.07,1.95l0.47,0.98l0.13,1.24l-0.3,1.2l0.21,1.52l-115.8,-0.01l-0.04,-59.52l105.46,-0.0Z", "name": "North Dakota"}, "US-NE": {"path": "M408.75,124.69l3.79,2.38l2.08,0.8l0.51,0.53l1.2,0.36l1.29,-0.16l0.51,-0.4l0.37,-0.91l0.48,-0.16l0.98,0.2l0.73,-0.12l0.71,0.26l1.3,-0.38l1.54,0.25l3.39,-0.47l2.26,1.76l1.36,0.16l1.49,0.7l1.41,0.11l0.83,0.97l1.37,0.17l-0.03,0.85l0.82,0.68l0.18,0.62l0.57,0.54l3.19,0.61l0.15,0.53l-0.27,1.58l1.03,1.72l-0.23,1.32l0.16,0.64l1.09,0.98l0.26,1.47l0.56,0.64l1.05,0.65l-0.01,1.58l1.36,1.81l-0.56,1.94l0.3,2.63l0.5,0.53l0.84,-0.13l-0.04,1.02l1.12,0.48l-0.47,1.89l0.2,0.48l0.96,0.35l-0.54,0.57l-0.11,1.17l0.32,0.48l0.51,0.21l0.1,1.17l-0.28,0.65l0.2,0.51l-0.08,0.5l0.57,0.74l0.2,1.59l-0.26,1.1l0.17,0.62l-0.55,0.73l-0.0,0.73l0.39,0.76l1.14,0.58l-0.07,1.39l0.21,0.72l0.99,0.44l0.01,0.67l0.43,0.61l0.1,0.77l0.45,0.88l-0.34,0.61l0.1,0.24l0.32,0.24l0.79,0.0l0.71,0.86l0.98,0.21l-0.15,0.82l1.12,1.41l-0.23,0.91l0.27,0.7l-102.78,0.0l-0.01,-18.05l-0.4,-0.4l-30.79,-0.0l0.01,-36.63l86.2,0.0Z", "name": "Nebraska"}, "US-LA": {"path": "M478.53,322.47l0.03,-17.05l43.98,-0.05l0.27,0.67l1.15,0.56l-0.86,0.95l-0.39,1.71l0.39,0.66l0.93,0.24l-1.0,0.21l-0.49,0.67l0.28,1.13l0.81,0.74l-0.11,1.67l0.38,0.52l1.18,0.67l0.31,0.87l1.14,0.38l-0.83,0.86l-0.88,1.73l-0.61,-0.02l-0.54,0.41l-0.08,0.61l0.47,0.65l-0.25,0.79l-1.21,0.65l-1.05,1.39l-1.19,0.42l-0.66,0.63l-0.85,1.86l-0.46,2.69l-0.96,0.65l-0.46,0.61l-0.0,1.02l0.44,0.8l-0.46,1.76l-1.46,0.13l-0.45,0.44l0.17,0.83l0.46,0.5l-0.29,1.07l0.68,1.17l-1.02,0.81l-0.13,0.45l0.38,0.27l29.57,0.0l-0.85,2.5l-0.52,0.75l-0.37,1.76l0.47,0.82l-0.11,0.56l0.41,0.83l1.02,0.68l0.87,1.18l0.04,0.69l0.6,1.12l0.03,0.86l0.69,1.4l-1.44,0.12l-0.21,-0.07l-0.12,-0.71l-0.31,-0.24l-1.06,0.11l-0.93,-0.56l-1.24,0.01l-0.39,-0.77l-0.97,-0.81l-2.34,-0.61l-1.11,0.41l-1.34,1.67l-1.19,1.01l-0.43,0.72l-0.03,0.99l0.4,0.76l0.65,0.52l1.78,0.36l1.64,0.62l2.85,-0.51l1.21,-0.83l0.6,-0.74l0.22,0.36l0.78,0.41l1.33,-0.19l-0.37,0.4l-0.86,-0.16l-0.52,0.21l-0.41,0.5l-0.06,0.78l0.53,0.97l1.21,0.15l0.75,0.97l0.6,0.22l0.8,-0.09l0.49,-0.33l0.49,-0.86l0.09,-1.02l0.8,-0.36l0.51,-0.68l-0.22,0.95l0.12,0.6l0.24,0.12l-0.14,0.34l1.1,1.18l-0.14,0.73l-0.69,-0.55l-0.6,-0.13l-1.03,1.39l-0.67,0.03l-0.46,0.39l-0.08,0.81l-1.07,-0.5l-0.44,0.15l0.0,0.47l0.71,0.72l-1.31,-0.06l-0.33,0.38l0.51,0.46l0.89,1.69l1.47,0.51l0.61,0.44l-0.14,0.91l0.28,0.39l0.52,0.12l1.2,-0.19l0.53,0.21l0.15,0.4l0.59,0.32l1.1,-0.13l0.39,0.63l1.11,-0.18l0.65,0.67l-0.35,0.51l1.09,0.82l-0.3,0.43l0.28,0.52l-0.23,0.41l-0.84,0.89l-0.7,-1.07l-0.4,-0.18l-0.22,0.13l0.12,-0.61l-0.37,-0.43l-0.71,-0.37l-0.53,0.41l0.05,0.92l-0.36,0.24l-0.13,-0.78l-0.44,-0.25l-0.55,-0.96l0.02,-0.69l-0.79,-0.19l-0.46,0.33l-1.05,-0.23l-0.21,-0.44l0.14,-0.46l-0.31,-0.47l-0.43,-0.06l-0.71,0.49l-0.78,-0.07l0.17,-0.65l-0.29,-0.82l-0.52,-0.37l-0.33,0.1l0.19,-0.65l-0.32,-0.36l-0.78,-0.09l-0.26,0.34l-0.63,-0.28l-0.39,0.16l-1.99,-1.18l-1.01,-0.14l-0.47,-0.51l-0.61,0.12l-0.28,0.39l-0.16,1.07l1.35,0.9l1.24,0.35l-0.16,0.67l0.17,0.34l-0.28,0.24l0.09,0.49l-0.66,0.7l-0.08,0.51l0.29,0.73l0.25,0.13l-0.82,0.91l-1.06,0.58l-0.5,-0.85l0.28,-1.1l-0.22,-0.8l-0.43,-0.21l-0.34,0.24l-0.89,-0.92l-0.48,0.22l-0.51,-0.8l-0.53,-0.22l-0.41,0.29l-0.25,0.69l-0.7,0.13l-0.37,-0.44l-0.3,-0.03l-0.79,0.38l-0.15,0.53l0.3,0.39l-0.51,0.27l-0.23,1.08l-0.34,0.07l-0.37,0.6l-0.63,-0.06l-0.08,-0.42l-1.31,-0.48l-0.72,0.67l-1.43,-0.84l-0.24,-0.44l-0.87,-0.06l-0.29,0.42l-0.69,-0.42l0.21,-0.18l0.12,-0.86l-0.16,-0.76l-1.52,-1.16l-0.03,-0.4l-0.62,-0.62l-0.01,-0.64l0.73,-1.13l-0.27,-0.71l-0.75,-0.24l-0.39,0.55l0.1,0.25l-0.54,0.6l0.01,0.64l-1.29,-0.41l-0.34,-0.74l-1.6,0.42l-0.47,-1.74l-0.41,-0.13l-0.61,0.2l0.13,-1.17l-0.37,-0.63l-0.83,-0.21l-1.53,0.08l-0.97,0.44l-0.13,-0.38l0.72,-0.21l0.01,-0.66l-0.49,-0.56l-0.86,-0.16l-0.73,0.26l-0.77,-0.16l-0.4,0.6l-1.67,0.69l-0.49,-0.25l-0.37,0.09l-0.81,0.49l0.35,1.12l0.67,0.35l0.47,1.02l-0.9,0.08l-1.55,0.68l-2.95,-0.53l-1.05,0.08l-2.48,-0.53l-1.57,-0.65l-1.42,-0.94l-2.96,-1.07l-2.59,-0.55l-2.12,0.31l-4.64,0.06l-0.85,0.16l-1.52,0.87l-0.4,-0.47l-0.14,-0.73l1.31,-0.32l0.68,-1.37l0.06,-1.24l-0.26,-0.44l0.95,-1.06l0.3,-1.26l-0.3,-1.48l0.13,-1.15l-0.52,-0.62l-0.1,-0.76l0.81,-1.67l-0.42,-1.54l0.68,-0.62l0.31,-1.1l0.71,-0.7l0.17,-0.89l0.65,-1.3l-0.06,-1.13l0.53,-0.71l-0.51,-1.04l0.65,-0.25l0.22,-0.38l-0.65,-1.15l0.18,-0.5l-0.06,-1.19l-0.29,-0.27l-0.6,-0.03l-0.39,-1.2l-0.71,-0.69l0.29,-1.0l-0.64,-0.63l-0.22,-0.76l-0.43,-0.3l0.15,-0.77l-0.95,-0.53l-0.6,-0.74l0.27,-1.9l-0.48,-1.59l-1.01,-1.62l-1.12,-0.79l-0.42,-0.68l-0.53,-0.38ZM552.44,372.37l0.02,0.13l-0.09,0.01l0.07,-0.14ZM545.5,355.37l0.12,-0.23l0.16,-0.01l-0.02,0.15l-0.25,0.09ZM522.71,369.55l-0.6,-0.1l-1.13,-0.64l0.79,-0.72l0.86,0.55l-0.15,0.31l0.22,0.6ZM509.89,363.89l0.99,-0.28l0.38,-0.33l0.72,0.15l0.64,0.52l0.98,0.34l-0.35,0.26l-0.23,0.61l-0.48,0.08l-2.65,-1.36Z", "name": "Louisiana"}, "US-SD": {"path": "M322.49,86.42l0.28,-0.51l-0.1,-17.59l115.66,0.01l-0.22,1.43l-0.8,1.48l-3.04,2.09l-0.48,1.15l1.55,1.99l1.01,1.86l0.52,0.33l1.77,0.27l1.0,0.77l0.53,0.9l0.0,33.83l-1.81,0.02l-0.32,0.15l-0.12,0.4l0.19,1.26l0.82,0.98l-0.04,1.19l-0.65,0.31l0.11,1.34l0.47,0.42l1.06,0.07l0.26,1.39l-0.18,0.75l-0.64,0.7l-0.05,1.51l-0.39,0.55l-0.35,1.48l-0.49,0.37l-0.73,1.62l0.46,1.03l1.19,0.91l-0.13,0.55l0.52,0.46l0.37,1.03l-1.6,-0.29l-0.29,-0.79l-0.79,-0.65l0.2,-0.45l-0.28,-0.6l-1.52,-0.24l-0.97,-1.04l-1.52,-0.14l-1.45,-0.69l-1.31,-0.14l-2.27,-1.77l-0.63,-0.08l-3.07,0.51l-1.6,-0.25l-1.19,0.37l-0.68,-0.26l-0.71,0.12l-1.14,-0.2l-0.97,0.4l-0.42,0.96l-0.35,0.26l-0.73,0.03l-3.55,-1.62l-3.98,-2.46l-86.37,-0.0l-0.05,-37.46Z", "name": "South Dakota"}, "US-DC": {"path": "M742.58,199.53l0.49,-0.45l1.47,1.34l-0.75,0.69l-0.28,-0.93l-0.93,-0.65Z", "name": "District of Columbia"}, "US-DE": {"path": "M763.07,185.56l0.71,-1.11l1.08,-0.7l1.09,-0.22l1.52,0.24l-0.41,0.49l-0.31,0.91l-0.67,0.76l-0.68,0.32l-0.27,0.62l-0.03,0.58l0.72,0.89l-0.41,1.44l1.47,2.46l0.98,0.76l0.46,1.36l-0.13,1.2l0.22,1.7l0.55,0.49l0.62,1.14l0.2,1.19l2.26,2.25l1.28,0.22l0.09,0.96l-0.69,0.0l-0.37,0.25l-0.16,1.19l0.14,0.13l-0.54,0.13l-0.48,0.42l0.12,0.28l-0.22,0.43l0.57,0.37l0.92,-0.4l0.56,0.42l0.29,-0.09l0.28,1.22l-9.64,0.1l-1.17,-22.43Z", "name": "Delaware"}, "US-FL": {"path": "M578.94,340.18l39.64,-0.01l0.46,0.46l0.52,1.15l0.35,2.19l0.8,0.9l0.34,0.11l40.51,2.62l0.64,1.15l-0.14,0.82l0.29,0.92l0.3,0.41l0.53,0.16l1.39,0.02l0.59,-0.19l0.26,-0.32l0.6,-3.55l-0.57,-1.31l0.09,-1.35l0.32,-0.45l0.54,-0.16l0.23,-0.51l4.34,1.57l3.31,0.49l-0.13,0.71l-0.55,-0.12l-0.38,0.34l-0.04,1.25l1.43,1.74l0.02,0.81l0.27,0.32l-0.06,1.53l0.52,1.93l0.46,0.88l0.16,1.58l0.51,1.88l-0.08,0.46l0.45,0.82l0.18,1.23l0.92,2.11l0.26,1.29l1.64,3.26l1.04,2.73l1.36,2.42l0.06,0.54l0.43,0.36l4.04,6.55l-0.56,0.4l-0.96,-0.2l-0.08,-0.7l0.36,-0.38l0.09,-0.84l-1.73,-1.13l-0.55,0.43l0.35,2.31l0.45,0.85l0.92,3.95l5.57,11.94l0.57,2.58l1.91,4.44l-1.08,-0.43l-0.31,0.62l0.52,0.63l0.65,0.34l0.47,-0.06l0.95,0.91l1.04,2.53l-0.37,0.13l-0.23,0.47l0.24,0.37l0.58,0.26l0.38,1.5l-0.24,0.77l0.3,0.82l0.03,2.07l-0.33,0.52l-0.75,6.89l-0.42,0.78l0.24,0.61l-0.12,2.32l-0.86,1.01l-0.31,1.67l-0.73,0.38l-0.47,1.34l-0.52,0.6l-0.07,1.14l-0.51,1.27l0.16,1.47l0.21,0.2l-1.07,1.1l-0.48,0.84l-0.67,0.04l-0.42,-0.22l-1.13,0.13l-0.47,0.7l-0.72,0.14l-0.24,0.4l-0.7,0.37l-1.08,-0.08l-0.17,-0.32l-0.99,-0.25l-0.85,0.65l-2.55,0.36l-0.65,-0.57l-0.36,-0.85l0.28,-1.22l0.51,0.72l1.13,0.61l0.19,0.55l0.41,0.14l1.2,-0.35l0.29,-0.52l-0.1,-0.59l-1.08,-1.13l-1.79,-0.57l-0.59,-0.46l-0.38,-1.35l-0.53,-0.62l0.28,-0.75l-0.38,-0.35l-0.39,0.01l-0.65,-1.99l-0.37,-0.38l-0.45,-0.03l-0.18,-0.42l0.24,-0.73l-0.45,-0.6l-0.86,-0.65l-0.79,-0.22l-0.48,-0.51l-0.5,0.02l-0.75,-0.42l-1.47,-0.35l-0.31,-0.71l-0.63,-0.01l-0.1,-0.59l-0.55,-0.58l-0.25,-1.14l-0.44,-0.26l-0.09,-2.22l-0.44,-0.86l0.09,-1.17l-0.22,-0.73l-0.41,-0.77l-0.45,-0.24l-0.31,0.68l-0.7,-0.3l0.97,-0.82l0.36,-1.04l0.79,-0.86l0.57,-0.18l0.36,-0.63l-0.52,-0.5l-1.27,0.51l-0.9,0.87l-0.65,1.56l-0.98,0.08l0.05,-1.01l-0.41,-1.11l0.42,-2.68l-0.12,-0.62l-0.44,-0.36l1.48,-0.84l0.24,-0.6l-0.49,-0.52l-2.63,0.99l-0.53,-0.59l-0.3,0.11l-0.86,-0.82l-0.51,0.62l0.75,1.03l0.38,0.14l0.66,1.61l-0.75,-0.06l-0.99,-0.44l-0.41,-1.3l-0.51,-0.6l-0.29,-0.05l-1.13,-2.18l-0.45,-1.14l-0.04,-0.75l-0.85,-0.8l0.19,-0.64l-0.5,-1.52l-1.21,-1.0l0.12,-0.35l0.48,0.01l0.36,-0.27l-0.13,-0.44l0.37,-0.46l-0.24,-0.32l0.62,-1.1l2.46,-2.8l-0.46,-2.05l-0.54,-0.52l-0.82,0.19l-0.34,0.46l-0.08,1.14l0.02,-1.29l-0.24,-0.65l-0.7,-0.35l-0.83,-0.81l-1.26,-0.47l-0.18,0.45l0.18,0.44l-0.13,0.66l-0.4,0.38l0.16,0.64l1.58,0.71l0.08,0.69l-0.51,1.08l-0.0,0.64l-0.15,-0.4l-0.62,-0.31l-1.46,-1.46l-0.34,0.1l-0.12,-0.42l0.75,-1.51l0.36,-1.6l0.16,-1.1l-0.26,-1.12l0.4,-0.36l0.66,-1.38l-0.09,-0.5l0.95,-2.2l0.5,-4.05l-0.18,-1.31l0.2,-0.42l-0.05,-1.72l-1.49,-1.34l0.04,-0.33l-0.35,-0.51l0.04,-0.69l-0.62,-0.75l-0.23,-1.19l-0.57,-0.36l-1.16,0.04l-0.82,-0.29l-1.26,0.21l-0.67,-1.47l-1.14,-0.57l-0.14,-0.62l-0.81,-1.22l-0.62,-0.57l-0.53,-0.05l-1.02,-1.07l-0.59,-0.25l-0.1,-0.6l0.21,-0.95l-0.16,-0.64l-2.32,-1.29l-0.43,-0.52l-0.25,-1.0l-1.5,-1.8l-1.61,-1.11l-1.18,-0.3l-2.55,-1.74l-2.47,0.35l-0.8,-0.42l-0.93,0.2l-0.38,0.46l-1.17,0.36l-0.52,0.49l-0.07,0.43l-0.5,-0.21l-0.43,0.15l-0.2,0.26l0.55,1.01l-1.08,0.03l-1.48,0.96l-0.81,0.24l-1.34,1.08l-1.38,0.56l-0.07,-0.74l-0.58,-0.11l-0.88,0.46l-1.08,1.01l-1.8,-0.09l-1.85,0.56l-0.58,-0.06l0.05,-1.55l-0.89,-1.63l-0.84,-0.87l-1.08,-0.49l-0.14,-0.37l0.58,0.07l0.78,-0.41l0.13,-0.69l-1.12,-0.47l-0.25,0.19l-0.06,-0.55l-0.22,-0.11l0.13,-0.37l-0.43,-0.4l-1.18,0.32l-1.67,-0.79l0.55,-0.65l0.71,-0.01l1.04,-1.11l-0.65,-0.88l-0.46,0.05l-0.52,0.7l-0.34,-0.07l-0.7,0.32l-0.44,-0.72l-0.7,-0.01l-0.15,0.24l-1.22,0.43l-0.15,0.78l-2.88,-1.4l-2.77,-0.78l0.41,-0.28l1.2,0.51l0.65,-0.14l0.16,-0.51l-0.62,-0.92l0.13,-0.51l-0.57,-0.38l-0.39,0.18l-0.14,-0.34l-1.65,-0.12l-1.7,0.41l-0.22,-0.77l-0.81,0.14l-0.49,-0.23l-0.28,0.41l0.07,0.52l-1.19,0.41l-0.47,0.44l-2.76,-0.02l-1.28,0.2l0.14,-0.26l-0.29,-0.52l-1.09,-0.38l-0.42,-0.43l0.5,-0.22l0.24,-0.43l-0.11,-0.32l-0.55,-0.19l-0.61,-0.6l-0.47,0.06l0.0,0.65l-0.44,1.12l-1.04,-1.37l-0.68,-0.12l-0.39,0.62l0.47,1.44l-0.29,0.55l-1.21,0.58l-0.21,0.8l-0.45,0.1l-0.27,0.45l-0.96,0.2l0.03,-0.7l0.99,-0.62l0.2,-0.53l-0.3,-0.67l-0.94,-0.31l-0.23,-0.65l0.44,-1.24l0.1,-1.14l-0.31,-0.42l-1.45,-0.88l-1.65,-2.05l0.39,-1.09l-0.01,-0.76ZM679.8,408.73l0.23,0.88l0.68,0.46l0.62,0.02l0.79,1.42l0.63,0.6l1.34,0.82l1.27,0.31l0.55,-0.26l0.13,-0.67l0.52,-0.48l0.06,-0.89l0.81,-0.92l0.37,-1.4l-0.24,-1.35l-0.82,-1.76l-1.15,-1.27l-0.98,-0.32l-1.04,0.47l-1.94,2.11l-1.92,1.13l-0.3,0.6l0.15,0.42l0.24,0.08ZM588.98,349.59l-0.19,0.02l0.1,-0.07l0.09,0.05ZM606.35,353.24l0.57,-0.09l0.13,0.58l-0.69,-0.49ZM688.14,382.63l0.13,0.22l-0.24,0.29l0.11,-0.51ZM610.42,355.75l-0.09,-0.07l0.02,0.01l0.07,0.06ZM686.27,384.49l-0.42,-2.4l1.11,-0.97l-0.63,2.2l-0.06,1.16ZM616.92,362.57l0.09,-0.08l0.16,0.02l-0.07,0.15l-0.18,-0.1Z", "name": "Florida"}, "US-WA": {"path": "M0.53,24.52l0.34,-0.6l0.19,-2.09l0.33,-0.65l-0.08,-0.36l-0.71,-0.6l0.92,0.2l4.82,2.2l1.32,0.07l1.16,0.46l1.17,0.97l2.19,0.53l3.54,0.07l1.09,0.5l1.46,-0.24l1.5,0.21l0.54,0.31l2.58,0.13l1.37,-0.76l0.63,0.17l0.76,0.5l0.24,0.33l0.01,0.64l0.74,0.54l0.32,0.03l0.39,-0.47l-0.11,-0.64l0.51,-0.07l0.21,0.48l0.48,0.16l0.31,0.45l-0.27,0.58l0.44,0.4l0.54,-0.15l0.54,-0.92l-0.22,-0.67l-0.62,-0.64l0.09,-0.24l0.71,-0.23l-0.16,0.86l1.09,1.79l0.51,0.39l0.15,0.69l0.6,0.71l-0.38,0.18l-1.34,2.0l-0.1,-1.27l-0.3,-0.33l-0.61,0.44l-0.63,0.11l-0.2,0.84l0.31,0.8l-0.95,1.79l-1.67,1.65l-0.73,1.48l-0.8,0.81l-0.71,1.74l0.13,0.69l0.74,0.38l0.98,-0.1l2.69,-1.02l1.09,-0.78l-0.19,-0.7l-0.67,-0.06l-2.8,1.34l-0.46,-0.17l1.34,-2.3l1.07,-1.37l2.89,-1.44l0.54,-1.54l1.43,-1.79l0.69,0.44l0.46,-0.3l-0.22,-1.67l0.76,2.59l0.26,0.17l-1.06,0.01l-0.47,0.85l-0.64,-0.59l-0.53,-0.05l-0.24,0.71l0.49,0.58l0.45,1.52l-0.56,-1.05l-0.67,-0.05l-0.31,0.74l0.12,0.72l0.6,0.48l-0.46,0.6l0.08,0.44l0.44,0.09l1.61,-0.89l0.16,0.68l0.34,0.25l-0.64,1.77l-0.07,0.44l0.23,0.53l-0.41,0.24l-0.24,0.58l0.37,0.79l-1.03,-0.4l0.74,-1.51l-0.08,-0.49l-0.37,-0.33l-1.7,1.36l-0.28,0.72l-0.05,-0.73l-0.5,-1.17l-0.5,0.11l-0.65,1.63l-1.14,0.74l-0.69,1.89l-1.46,0.59l-0.36,0.49l0.06,1.13l0.45,0.1l0.67,-0.36l-0.15,0.35l0.36,0.31l0.95,-0.2l0.25,0.61l0.63,0.29l0.44,-0.39l-0.05,-1.63l0.22,0.38l0.8,-0.36l0.9,0.88l0.57,0.25l1.17,-0.82l1.31,-1.65l0.62,-1.61l0.87,0.58l0.72,-0.03l0.39,-0.29l-0.05,-0.65l-0.2,-0.12l1.42,-0.79l0.14,-0.95l-0.65,-1.06l-0.07,-1.11l-0.52,-1.18l0.22,0.26l0.69,-0.2l0.08,-0.92l-0.39,-0.65l-0.83,-0.37l0.59,-1.17l-0.35,-1.58l0.24,-0.6l0.71,-0.74l0.29,-1.34l1.53,-0.78l0.52,-1.26l-0.61,-0.5l-0.53,0.11l-1.24,-1.0l-0.28,-0.52l-0.06,-1.36l-0.47,-0.73l0.29,-0.74l-0.15,-0.83l-1.62,-1.31l-0.75,-0.22l-0.32,-0.52l0.03,-0.49l0.68,0.13l0.46,-0.41l-0.16,-1.67l0.73,-0.4l0.06,-1.0l-0.36,-0.66l-0.43,-0.28l-0.4,-1.03l0.31,-0.88l-0.27,-0.47l-1.2,-0.57l-0.9,0.53l-0.75,-0.83l-0.29,-0.7l-0.8,-0.67l0.32,-0.47l-0.15,-0.69l0.35,-0.63l88.01,-0.0l0.2,50.37l-0.29,0.97l0.21,0.63l1.39,1.89l0.5,1.7l-0.68,0.91l-0.09,0.44l1.04,1.46l-32.49,0.04l-1.5,0.99l-3.79,0.05l-2.17,0.36l-1.51,0.0l-1.47,1.1l-4.22,0.66l-3.07,0.98l-1.49,0.96l-0.94,-0.06l-1.13,0.49l-0.97,-0.11l-0.6,0.2l-2.61,-0.36l-0.79,0.57l-1.69,0.41l-0.83,0.53l-0.82,0.18l-2.25,-0.21l-1.59,0.58l-0.52,-1.0l-0.55,-0.42l-0.82,-0.25l-4.65,-0.4l-2.32,0.37l-1.68,-0.13l-2.43,1.48l-4.34,1.43l-1.26,-0.39l-1.23,-0.02l-1.85,-0.65l-0.89,0.14l-1.08,-0.19l-0.92,-0.79l-0.08,-1.99l-0.4,-0.73l0.09,-1.04l-0.52,-2.03l-0.7,-0.73l-0.69,-1.61l-0.82,-0.71l-2.84,-1.29l-2.84,0.51l-1.36,-0.91l-0.4,-0.86l-0.7,-0.44l-2.43,0.25l-0.65,-0.14l-0.45,-0.63l-0.49,-0.04l-0.89,0.53l-0.88,-0.05l-1.03,0.59l-1.35,-1.06l-0.92,0.01l0.1,-1.24l0.64,0.55l0.64,-0.12l0.59,-0.8l0.63,0.44l0.65,-0.21l-0.04,-0.78l-0.8,-0.45l-0.5,-0.63l0.47,-0.35l0.12,-0.47l-0.41,-1.15l0.35,-0.51l-0.35,-0.82l0.08,-0.2l0.69,-0.18l0.18,0.42l0.57,0.26l0.84,-0.48l-0.24,-0.66l-0.38,-0.05l-1.41,-1.09l-0.53,0.06l-0.3,0.28l-2.07,-0.07l-0.32,-1.69l0.82,0.33l0.46,-0.18l0.16,-0.6l-0.28,-0.51l3.13,-1.19l0.3,-0.35l-0.23,-0.4l-0.51,-0.21l-2.35,-0.17l-0.38,-0.91l-0.7,-0.47l-1.31,0.12l-0.92,-4.23l-0.43,-0.78l-0.39,-0.24l-0.1,-0.63l-0.49,-0.2l-0.75,-5.21l-0.79,-2.13l-0.63,-0.47l-0.58,-1.24l-1.03,-1.0l-0.83,-0.27l-0.46,-0.75l-0.69,-2.02l-0.14,-1.56l-0.39,-0.75ZM30.4,41.91l0.32,0.6l-0.26,0.59l-0.27,-0.87l0.21,-0.32ZM35.18,22.7l-0.36,0.86l-0.01,0.61l-0.2,-1.0l0.58,-0.47ZM33.85,18.4l-0.07,-0.02l0.03,-0.04l0.05,0.05ZM33.04,18.46l-0.38,0.48l-0.36,0.01l0.22,-0.67l-0.19,-0.48l0.21,-0.13l0.49,0.8ZM31.29,22.37l1.22,-2.19l0.53,-0.14l0.2,0.62l0.79,0.57l-0.03,0.2l-0.54,-0.44l-0.48,0.0l-0.46,0.52l-0.38,-0.01l-0.18,0.73l-0.67,0.13ZM31.78,23.44l0.4,-0.07l0.76,0.32l0.15,0.25l-0.9,-0.02l-0.41,-0.48ZM33.4,25.51l0.04,0.65l0.0,0.04l-0.13,-0.25l0.09,-0.43ZM34.32,27.68l0.01,0.0l0.08,-0.04l-0.06,0.06l-0.02,-0.02ZM34.66,27.42l0.2,-0.89l1.4,0.91l0.37,0.92l-0.24,0.37l-0.42,0.01l-0.43,-1.16l-0.55,-0.25l-0.33,0.1ZM34.85,39.32l0.08,-0.98l0.17,-0.28l0.23,0.91l-0.48,0.35ZM34.0,35.06l-0.16,-0.88l0.3,-0.48l0.16,1.5l-0.29,-0.14ZM31.41,44.27l0.13,-0.22l0.06,0.01l-0.04,0.22l-0.15,-0.01ZM27.52,14.4l0.4,-0.43l0.04,0.57l0.5,0.74l-0.27,-0.0l-0.68,-0.88ZM29.15,13.76l1.05,0.54l-0.56,0.43l-0.49,-0.97ZM28.65,16.75l0.04,0.3l-0.04,0.7l0.1,0.46l-0.56,-0.25l0.45,-1.22ZM29.0,18.52l0.19,0.12l0.31,-0.0l-0.44,0.01l-0.06,-0.13ZM28.52,42.59l0.03,-0.11l0.06,0.21l-0.06,-0.05l-0.04,-0.05ZM26.27,17.69l-1.37,-0.54l-0.27,-1.6l0.38,0.05l1.24,0.95l0.27,0.38l-0.27,0.23l0.02,0.53Z", "name": "Washington"}, "US-KS": {"path": "M459.62,181.66l0.38,0.54l0.71,0.18l0.94,0.71l0.62,-0.07l1.06,-0.69l0.41,-0.05l-0.04,0.62l0.95,0.67l0.07,1.14l-0.79,-0.2l-0.58,0.25l-0.21,0.79l-1.13,1.11l-0.12,0.91l-0.54,0.11l-0.23,0.33l0.02,0.58l1.36,1.82l1.76,1.33l0.14,0.93l0.34,0.73l0.65,0.49l0.27,0.96l1.71,0.84l0.88,0.03l0.51,0.26l0.0,38.23l-114.85,0.0l-0.18,-53.64l104.39,0.0l0.91,0.86l0.57,0.23Z", "name": "Kansas"}, "US-WI": {"path": "M588.91,78.53l0.26,0.11l0.6,-0.13l-0.23,0.6l-0.58,-0.06l-0.05,-0.52ZM583.23,85.53l0.54,-0.33l0.56,-2.0l0.61,0.1l0.91,-0.58l0.33,-0.34l0.29,-1.02l0.51,-0.52l0.65,0.06l0.01,0.25l-0.75,-0.04l-0.26,0.5l0.16,0.28l-0.17,0.77l-0.39,0.1l-0.2,0.58l0.43,0.52l-0.28,0.49l-0.54,0.24l-0.94,1.58l-0.25,0.71l0.1,0.39l-1.29,1.84l-0.47,0.08l-0.72,-0.93l-0.09,-0.61l0.51,-1.29l0.76,-0.84ZM497.92,84.81l0.4,-0.21l0.36,-0.8l-0.33,-1.37l0.18,-1.64l0.8,-0.97l0.71,-1.98l-0.14,-0.53l-0.75,-0.86l-0.52,-1.31l-0.82,-0.38l-1.3,-0.09l-0.17,-0.4l0.14,-1.58l1.86,-1.87l0.03,-0.72l0.88,-1.29l2.08,-0.83l0.55,-0.63l1.01,-0.15l0.53,-0.64l1.19,-0.03l0.41,-0.71l0.8,-0.65l0.01,-10.84l1.08,-0.23l0.33,-0.97l0.56,-0.28l0.31,-0.55l0.77,0.7l1.65,0.7l2.73,-0.3l3.52,-1.15l2.79,-0.52l2.54,-1.76l0.3,0.33l1.39,0.02l0.51,-0.61l0.55,-0.09l0.38,-0.52l0.88,-0.47l1.08,0.02l0.51,-0.44l0.3,0.46l0.49,0.05l0.21,0.46l-0.65,1.4l-0.77,0.78l-0.17,0.9l0.23,0.61l-1.29,1.51l-0.18,0.38l0.19,0.53l0.65,0.22l0.52,-0.1l1.95,-0.73l0.77,-0.7l2.13,1.31l2.34,0.62l0.41,0.53l0.88,-0.06l1.59,0.79l1.55,3.06l0.35,0.3l15.53,3.74l4.49,2.21l1.73,0.03l1.58,0.54l1.45,-0.38l1.75,0.62l0.68,-0.04l0.69,0.39l2.21,0.32l0.82,0.46l0.43,0.81l-0.56,0.9l0.33,0.78l0.75,0.39l1.03,-0.02l0.56,0.42l1.02,0.14l1.22,1.1l-0.21,0.62l0.45,1.02l-0.46,0.68l0.27,1.13l-0.95,1.0l-0.26,1.59l0.31,0.46l0.52,0.22l1.4,-0.07l1.15,-0.52l0.13,0.2l-1.09,2.03l-0.13,1.19l1.15,1.46l0.73,0.37l-0.29,0.52l-0.15,1.13l-2.58,0.77l-0.61,0.63l-0.13,1.1l-0.88,0.92l-0.4,1.07l-0.79,0.88l-0.1,0.95l-0.4,0.62l-0.33,1.51l1.0,0.84l0.9,0.07l0.52,-0.26l0.67,-1.13l2.0,-1.08l0.64,-0.93l-0.04,-0.47l0.39,-0.73l1.31,-1.37l0.08,0.22l0.45,0.01l0.68,-0.56l0.54,0.03l0.4,-0.28l0.99,1.12l0.54,0.23l-0.57,1.8l-1.55,2.32l-0.83,3.62l-0.46,1.16l0.08,1.02l0.67,0.92l-0.0,0.39l-0.61,0.76l-0.91,0.44l-0.55,0.58l-1.36,3.28l-0.19,2.26l0.55,1.12l-0.09,1.02l-1.45,2.64l-0.15,1.83l-0.97,1.72l-0.59,2.1l0.02,0.91l0.3,0.91l-0.19,1.15l0.4,0.52l-0.4,1.42l0.79,0.77l0.22,2.12l0.97,1.43l-0.13,1.39l-0.5,1.21l0.09,2.5l-43.18,-0.37l-0.13,-0.67l-0.89,-1.61l-0.43,-0.4l-4.72,-1.12l-0.88,-1.2l-0.2,-1.46l-0.77,-1.11l-0.39,-4.21l0.14,-0.51l1.11,-1.61l0.02,-0.9l-0.64,-0.79l-1.36,-0.52l-0.53,-1.54l-0.09,-3.73l0.18,-1.47l-0.11,-0.62l-0.45,-0.66l-0.01,-1.28l-0.29,-0.99l-1.09,-0.63l-0.95,-1.44l-0.91,-0.17l-1.09,-0.74l-1.7,-0.06l-2.5,-1.76l-1.98,-3.2l-2.46,-2.03l-2.89,-0.67l-0.63,-1.12l-1.05,-0.95l-3.08,-0.6l-2.15,-1.9l-1.14,-0.7l0.53,-1.02l0.01,-1.43l0.31,-0.71l-0.22,-1.68l-0.42,-1.06ZM534.21,46.54l0.1,-0.31l0.02,0.19l-0.12,0.12ZM530.1,51.03l0.11,-0.06l0.01,0.03l-0.12,0.03Z", "name": "Wisconsin"}, "US-OR": {"path": "M3.12,127.4l1.89,-3.81l0.87,-5.49l0.22,0.65l0.61,0.32l0.4,-0.4l-0.01,-0.64l0.28,-0.37l-0.09,-0.49l0.31,-0.44l0.55,0.77l1.14,0.1l0.18,-0.63l-0.84,-1.34l0.05,-0.79l-0.47,-0.05l-0.65,0.42l0.83,-2.89l0.84,-1.05l0.93,0.07l0.4,-0.4l-0.39,-0.63l-1.18,-0.38l0.52,-4.16l0.29,-0.42l-0.21,-1.05l0.37,-2.46l-0.03,-2.34l0.51,-1.81l0.42,0.17l0.53,-0.51l-0.51,-0.75l-0.56,-0.08l0.37,-2.38l0.38,0.12l0.51,-0.34l0.04,-0.32l-0.17,-0.47l-0.62,-0.16l-0.15,-3.39l0.75,-1.81l0.2,-2.41l-0.14,-0.37l0.45,-0.77l0.21,-0.96l-0.03,-1.8l0.24,-0.5l-0.05,-1.09l-0.28,-0.41l0.86,-1.11l-0.12,-0.62l-0.48,-0.25l-0.12,-0.48l1.07,0.3l0.63,-0.76l-0.57,-0.6l0.04,-0.55l-0.49,-0.45l-0.45,-0.09l0.22,-0.96l1.06,-1.03l-0.03,-0.46l-1.03,-0.11l-0.61,-0.99l0.33,-0.81l0.06,-1.22l-0.37,-1.24l0.7,-0.71l0.21,-1.23l-0.32,-1.76l-0.54,-1.13l1.13,0.83l0.64,0.01l0.12,0.81l0.67,0.32l0.56,-1.04l-0.47,-0.77l0.17,-0.11l0.4,0.45l0.73,0.12l1.5,-0.29l0.27,-0.4l1.35,-0.46l1.51,1.59l2.63,0.27l1.06,-0.82l0.82,-0.14l1.12,0.67l0.99,0.27l1.02,0.73l0.67,1.6l0.61,0.57l0.46,1.75l-0.08,1.14l0.41,0.77l-0.01,1.6l0.62,1.22l0.97,0.56l1.22,0.22l0.84,-0.14l1.68,0.61l1.43,0.06l1.2,0.38l4.77,-1.48l1.78,-1.17l0.87,-0.34l1.24,0.21l2.25,-0.37l4.56,0.39l0.82,0.34l0.44,0.95l0.68,0.4l1.78,-0.6l2.25,0.21l0.97,-0.21l0.8,-0.52l1.87,-0.47l0.62,-0.5l2.38,0.39l0.67,-0.2l1.02,0.1l1.13,-0.48l1.04,0.04l1.59,-1.0l2.97,-0.94l4.19,-0.65l1.41,-1.09l1.45,0.01l2.12,-0.36l3.83,-0.05l0.9,-0.33l0.68,-0.65l32.62,-0.04l0.56,1.54l1.27,1.46l1.28,0.38l1.36,0.92l0.67,0.14l1.27,2.3l0.02,0.83l-0.73,0.86l-0.45,1.27l-1.7,2.39l-0.16,1.31l-0.91,2.48l-1.77,2.43l0.09,1.28l-0.26,1.15l-1.14,1.81l-1.77,1.37l-1.19,2.39l-0.27,1.08l-1.24,1.32l0.06,0.75l-0.27,0.68l-0.04,0.61l0.3,0.76l-0.09,0.74l0.46,0.78l0.67,0.44l0.5,-0.06l0.34,-0.38l0.76,0.57l0.85,-0.18l0.33,0.84l0.82,0.54l-0.22,0.87l-0.62,0.15l-0.27,0.45l0.53,1.49l-0.55,2.34l-0.94,1.44l0.16,0.77l0.05,33.25l-111.6,0.0l-2.03,-1.84l-0.36,-1.92l-0.43,-0.71l-0.4,-1.44l0.24,-1.06l-0.18,-1.39l0.58,-1.8l-0.24,-1.67l-1.32,-1.99l-0.35,-0.06l-0.52,-1.42Z", "name": "Oregon"}, "US-KY": {"path": "M550.67,243.16l0.47,-1.56l1.03,0.93l0.49,0.15l0.71,-0.23l0.48,-0.62l1.03,-2.31l0.14,-1.08l-0.28,-0.95l0.42,-0.65l0.09,-1.66l-0.91,-1.61l1.44,-2.02l1.01,-0.58l1.26,0.05l5.4,2.57l0.78,0.18l0.79,-0.19l0.56,-0.55l0.36,-0.9l-0.05,-0.75l-1.06,-1.73l-0.11,-0.53l0.32,-1.25l0.39,-0.36l1.01,-0.04l1.21,-0.55l2.8,-0.47l0.64,-0.35l0.28,-1.02l-1.14,-1.81l0.01,-0.48l0.29,-0.5l1.12,-0.93l0.28,-0.91l1.05,0.47l0.43,-0.17l0.75,-0.8l0.08,-0.44l-0.45,-1.26l0.86,0.7l0.74,0.24l1.6,-0.48l-0.1,0.88l0.19,0.29l0.7,0.25l1.02,-0.67l0.23,-1.03l0.98,0.01l1.22,-0.46l3.77,1.71l0.48,0.82l0.77,0.24l0.62,-0.44l0.96,-1.95l1.31,-0.28l1.42,-0.93l0.62,1.13l0.65,0.43l0.98,0.04l0.07,0.6l0.84,0.27l0.71,-0.46l0.15,-0.77l0.99,-0.39l0.17,-1.92l0.8,-0.21l0.4,-0.47l0.05,-0.5l1.16,-0.32l0.42,-0.54l0.11,1.21l0.49,0.58l1.24,0.69l1.12,0.15l0.89,0.79l0.51,-0.03l0.32,-0.41l1.04,-0.23l0.59,-0.52l0.31,-0.8l0.21,-2.03l1.06,-1.64l0.88,0.29l1.58,-0.78l0.5,-0.85l0.35,-1.5l0.31,-0.36l1.0,-0.17l1.83,-1.61l0.12,-0.76l-0.66,-2.39l2.59,-0.11l0.7,0.64l0.58,0.22l0.75,-0.17l3.17,-1.62l2.1,-0.08l0.2,-0.49l-0.17,-0.48l0.54,-1.14l-0.27,-0.41l-0.98,-0.16l0.45,-0.45l0.19,-0.6l-0.76,-1.34l1.75,-1.24l1.48,1.2l0.85,0.03l1.3,-0.54l0.61,-0.03l0.58,0.82l1.51,0.66l0.31,1.1l0.72,0.88l0.18,1.16l0.28,0.48l2.26,0.9l1.79,-0.2l1.44,0.44l1.69,1.8l0.81,0.48l1.18,0.04l0.5,-0.38l0.29,-0.61l0.96,-0.29l1.14,0.59l1.21,0.22l1.03,1.08l1.25,-0.38l1.31,0.09l0.46,-0.22l0.47,-0.77l1.12,-0.81l1.71,-0.58l0.44,1.99l0.5,0.8l2.1,1.03l1.05,0.98l0.48,0.93l-0.06,0.82l0.39,0.94l-0.06,0.98l-0.4,0.34l-0.03,0.58l-0.49,0.42l-0.08,0.49l1.59,2.5l1.05,0.93l-0.24,0.58l0.1,0.28l0.87,0.68l0.33,1.24l1.23,1.28l0.52,1.37l1.05,0.51l0.48,0.56l0.34,0.03l0.78,1.06l1.68,0.53l-5.18,4.03l-5.19,2.57l-0.54,0.68l0.01,0.98l-1.52,0.71l-0.64,0.54l-0.21,1.3l-1.98,0.72l-0.98,0.13l-0.48,0.48l-0.66,1.31l-1.55,0.23l-2.67,1.08l-1.54,0.15l-1.52,0.49l-1.85,0.97l-21.62,-0.7l-11.62,-0.07l-9.98,-0.63l-20.59,0.35l-0.52,-0.51l-3.24,-0.3l-0.36,0.16l-0.11,0.36l0.53,2.01l-0.0,0.89l-20.62,-0.01ZM548.17,243.14l0.02,-0.31l0.36,0.03l0.07,0.27l-0.46,0.01Z", "name": "Kentucky"}, "US-CO": {"path": "M352.94,180.17l0.18,54.04l-108.39,0.0l0.0,-72.09l108.2,0.0l0.01,18.05Z", "name": "Colorado"}, "US-OH": {"path": "M642.66,148.39l0.3,0.29l1.21,0.34l1.04,-0.1l1.4,1.11l1.98,0.56l1.19,1.2l1.15,0.38l-0.51,0.35l-1.33,0.25l-0.22,0.44l0.38,0.32l0.79,0.03l0.24,0.25l0.58,-0.03l0.67,0.28l1.5,-0.71l1.12,0.18l0.6,-0.12l1.36,0.69l0.46,-0.07l1.22,0.7l0.87,0.07l1.61,-0.84l1.74,-0.22l1.25,-0.62l1.98,-0.5l2.47,0.39l0.72,-0.05l0.42,-0.29l0.65,0.24l0.52,-0.09l1.15,-0.49l5.01,-3.84l4.93,-2.13l1.03,-0.17l1.14,-0.41l0.34,-0.33l4.86,-1.53l0.0,24.03l-0.56,0.35l-1.26,0.13l-0.58,0.73l0.1,0.61l1.0,1.57l-0.39,1.69l0.32,0.32l0.11,0.77l-0.17,0.6l-0.57,0.47l-0.43,0.88l-0.91,2.57l-0.09,1.48l-0.36,1.05l-0.58,0.29l0.09,0.96l-0.62,1.32l-0.46,0.38l-0.06,0.4l0.51,0.78l-0.39,0.54l-0.18,0.88l-2.68,1.74l-1.1,1.38l-0.63,0.24l-0.89,0.76l-1.26,0.34l-0.68,0.47l-0.63,-0.88l-1.11,-0.08l-1.52,1.2l-0.33,1.05l-1.5,0.2l-1.26,1.65l-0.15,1.6l-1.01,0.58l0.17,0.65l0.49,0.44l-0.03,0.93l-0.68,0.06l-0.38,0.83l-0.35,0.39l0.25,-0.69l-0.63,-1.21l-1.3,-0.69l-0.6,0.06l-0.57,0.42l-1.03,1.43l-0.76,2.1l-0.64,0.63l0.49,3.06l-0.89,0.01l-0.52,0.25l-0.73,2.44l-0.24,0.21l-1.21,0.1l-1.27,0.42l-0.9,-0.1l-0.5,-0.96l-1.19,-1.13l-2.0,-0.94l-0.72,-1.68l-0.1,-0.96l-0.64,-0.44l-2.27,0.74l-1.2,0.88l-0.53,0.79l-1.32,-0.08l-0.88,0.37l-0.84,-0.97l-1.34,-0.29l-0.65,-0.46l-0.77,-0.17l-1.36,0.39l-0.68,0.94l-0.65,-0.06l-2.41,-2.26l-1.71,-0.5l-1.7,0.21l-1.85,-0.71l-0.27,-1.36l-0.71,-0.88l-0.44,-1.3l-1.68,-0.82l-0.4,-0.66l-0.49,-0.31l-0.92,0.08l-1.33,0.55l-0.43,-0.04l-1.46,-1.24l-0.59,0.09l-0.62,0.48l0.42,-46.93l20.03,-0.68ZM652.53,151.94l0.37,-0.44l0.34,0.38l-0.29,0.17l-0.42,-0.1Z", "name": "Ohio"}, "US-OK": {"path": "M385.72,277.2l-0.05,-33.66l-0.39,-0.4l-46.32,-0.01l-0.01,-8.14l129.83,0.0l-0.0,8.6l2.79,19.76l-0.69,30.12l-0.96,-0.22l-0.24,-0.3l-1.81,-0.27l-0.89,-0.75l-1.58,-0.31l-1.43,-1.7l-1.06,-0.23l-1.87,-1.33l-1.3,-0.38l-0.73,0.34l-0.26,0.71l-0.67,0.13l-0.45,0.48l-2.11,-0.2l-0.34,-0.17l-0.23,-0.54l-0.89,-0.53l-2.06,0.94l-1.03,0.14l-0.21,0.41l-0.52,0.21l-1.34,-0.67l-0.46,-0.01l-1.5,0.88l-1.01,0.03l-0.8,0.32l-0.75,1.05l-1.28,0.0l-0.39,0.34l-0.14,0.62l-1.01,-1.24l-1.46,-0.15l-0.36,-0.51l-0.95,-0.34l0.04,-0.72l-0.4,-0.45l-1.09,-0.17l-0.69,1.08l-0.54,0.06l-0.72,-0.42l-0.83,0.04l-0.55,-1.21l-0.97,-0.32l-1.05,0.44l-0.11,0.8l-0.32,0.53l-0.57,-0.09l-0.5,0.42l0.17,0.55l-0.41,1.29l-0.33,0.11l-0.43,-0.42l-0.22,-0.67l0.34,-0.64l0.04,-0.68l-0.66,-0.75l-0.74,0.13l-0.43,0.57l-0.73,-0.14l-0.82,0.75l-0.91,0.07l-0.42,-1.09l-0.71,-0.23l-0.98,0.05l-0.22,-1.16l-1.07,-0.48l-0.73,0.26l-1.88,1.67l-1.03,0.37l-0.77,-0.28l0.16,-1.4l-0.23,-0.51l-1.98,-0.57l-0.02,-1.67l-0.4,-0.52l-1.86,0.27l-2.19,-0.23l-0.58,0.21l-0.72,0.94l-0.79,0.03l-1.51,-1.43l-0.85,-0.11l-1.3,0.42l-2.31,-0.53l-1.61,-0.82l-0.92,0.19l-2.12,-0.26l-0.12,-1.67l-0.73,-0.7l-0.37,-0.81l-1.03,-0.36l-0.61,-0.66l-0.77,0.08l-0.36,1.29l-1.92,-0.55l-0.94,0.47l-0.83,-0.07l-3.28,-3.02l-0.99,-0.35l-0.65,0.06Z", "name": "Oklahoma"}, "US-WV": {"path": "M656.31,213.62l0.4,-0.35l0.14,-0.64l0.45,-0.47l0.05,-1.36l-0.36,-1.19l0.93,-0.01l2.86,-0.65l0.47,-0.55l0.57,-2.19l1.06,0.01l0.48,-0.44l-0.07,-2.17l-0.35,-1.04l0.55,-0.45l0.8,-2.18l0.89,-1.22l0.48,-0.24l1.01,0.62l0.21,0.56l-0.29,0.97l0.58,0.5l0.79,-0.24l0.69,-1.05l0.4,0.24l0.55,-0.07l0.3,-0.4l-0.24,-0.83l0.04,-0.98l-0.52,-0.52l0.8,-0.49l0.08,-1.46l1.02,-1.47l1.59,-0.16l0.44,-1.27l1.17,-0.97l0.4,0.0l0.46,0.74l0.58,0.27l2.37,-0.92l0.94,-0.79l0.73,-0.31l1.05,-1.35l2.94,-2.05l0.61,-1.65l-0.43,-0.94l1.03,-1.77l-0.04,-0.61l0.59,-0.4l0.41,-2.86l1.17,-3.1l0.64,-0.56l0.3,-0.96l-0.12,-1.06l-0.3,-0.37l0.32,-0.78l0.02,-0.84l-1.08,-1.8l0.48,-0.3l0.81,0.06l0.32,-0.21l0.01,16.39l0.4,0.4l15.83,-0.0l-0.16,8.96l0.41,0.46l0.64,-0.24l1.72,-1.41l1.0,-0.29l0.51,-0.76l1.89,-1.32l0.43,-0.79l0.56,-0.23l0.99,0.58l0.73,-0.13l1.74,-1.86l0.64,-0.26l0.11,-0.65l0.33,0.54l1.5,0.73l1.32,0.21l0.66,-0.21l1.04,0.13l0.91,-0.58l0.43,-1.15l0.72,-0.24l1.18,0.03l1.29,-1.17l0.64,0.04l1.82,1.48l0.73,0.34l1.79,-0.23l-0.37,0.15l-0.27,0.56l0.3,0.84l1.06,0.62l-0.11,0.79l0.9,0.51l-0.17,0.97l0.2,0.41l-1.27,2.74l-7.19,-5.3l-0.63,0.07l-0.55,0.91l0.01,1.35l-0.82,1.23l-0.09,1.88l-1.73,1.68l-0.75,1.34l-0.76,0.29l-0.6,0.81l-0.29,0.12l-0.51,-0.3l-0.42,0.21l-1.78,2.4l-1.5,-0.96l-0.64,0.09l-1.35,1.94l-0.3,1.33l-0.88,0.79l-0.64,1.84l-1.22,1.58l-2.8,-0.85l-0.99,-1.67l-1.49,-0.5l-0.55,0.27l-0.28,1.13l-0.38,0.59l-0.08,1.07l-0.56,1.09l-0.52,0.27l-0.49,0.79l0.01,0.8l-1.87,1.66l-0.45,1.69l-0.84,1.5l-3.19,3.33l-1.27,2.41l-0.01,0.74l0.85,0.58l-1.17,0.87l-0.07,0.56l0.24,0.37l-2.14,1.23l-0.4,-0.62l-0.77,-0.02l-3.23,1.5l-0.81,-0.61l-1.22,-0.01l-0.58,0.69l0.2,0.98l-0.94,0.55l-0.64,-0.16l-2.19,0.43l-1.24,0.57l-1.69,-1.42l-0.65,-0.12l-0.46,0.27l-0.55,0.87l-1.06,0.22l-0.99,0.92l-0.34,0.06l-0.97,-0.1l-0.93,-0.51l-0.64,-0.67l-1.15,-0.21l-0.41,-0.68l-0.96,-0.67l-0.01,-1.04l-0.63,-0.6l0.38,-0.58l-0.17,-0.64l-0.71,-0.45l-0.79,0.07l-1.16,-0.34l-0.26,-0.56l-0.65,-0.58l-1.69,-0.93l-0.47,-1.3l-1.18,-1.19l-0.38,-1.31l-0.75,-0.6l0.17,-0.4l-0.15,-0.53l-1.08,-0.97l-1.42,-2.12Z", "name": "West Virginia"}, "US-WY": {"path": "M213.5,86.55l108.19,-0.0l0.05,74.77l-108.23,0.0l-0.01,-74.77Z", "name": "Wyoming"}, "US-UT": {"path": "M172.31,143.49l40.4,0.0l0.0,18.22l0.4,0.4l30.82,0.0l-0.0,72.09l-77.02,-0.06l-0.04,-90.66l5.43,0.0ZM182.46,151.58l-0.28,0.07l-0.18,0.62l1.17,2.91l-0.72,0.27l-0.34,0.74l0.04,0.51l0.39,0.31l0.78,0.07l0.31,-0.37l-0.04,-0.4l0.29,-0.17l1.02,0.85l0.34,0.71l0.63,0.55l-0.1,0.9l0.33,1.15l-0.27,0.71l0.41,0.4l0.06,0.48l1.69,1.35l0.12,0.49l0.63,0.48l0.68,1.0l0.65,-0.17l0.56,-1.54l0.33,0.94l0.01,0.91l0.62,0.75l0.06,1.17l0.24,0.33l0.98,0.29l1.47,-0.74l2.13,-1.75l0.19,-1.07l0.76,-0.48l0.69,-0.13l1.57,-1.04l0.06,-0.46l-0.63,-0.83l-0.75,-0.64l-1.36,-0.44l-0.55,-1.17l-0.61,-0.46l-0.25,-0.81l-0.83,-0.75l-0.06,-0.4l-0.4,-0.34l-0.44,0.0l0.64,-0.74l1.31,0.36l0.49,-0.25l0.75,-0.02l0.83,-1.0l-0.25,-0.83l-0.34,-0.22l-1.38,-0.02l-0.53,0.41l-0.56,0.1l-0.52,-0.08l0.11,-0.64l-0.76,-0.65l-0.59,0.1l-0.48,-0.19l-0.7,0.21l-0.33,0.99l0.36,0.69l-0.24,0.55l0.82,1.94l-0.8,0.36l-0.36,-0.28l-0.15,-0.65l0.13,-0.87l-0.49,-0.58l-0.29,-1.45l-0.73,-0.43l-0.58,-0.06l-0.36,0.25l-0.34,-0.14l-1.21,-1.17l-0.24,-0.48l0.51,-0.5l0.18,-1.16l-0.99,-1.14l-1.19,-0.09l-0.83,0.79l-2.57,0.48l-0.28,0.64l0.25,0.45l0.43,0.2l-0.16,0.29ZM194.95,161.59l0.4,0.69l-0.05,0.66l-0.45,-0.68l0.11,-0.67Z", "name": "Utah"}, "US-IN": {"path": "M571.97,219.66l0.08,-0.22l-0.43,-0.53l0.47,-0.45l-0.14,-0.95l0.22,-0.44l0.01,-1.14l0.89,-0.52l0.0,-0.61l-0.25,-0.2l0.56,-0.2l0.32,-0.5l-0.07,-0.45l-0.83,-0.86l0.54,-0.86l0.26,0.17l0.6,-0.29l0.73,-0.02l0.52,-1.43l0.55,-0.27l0.52,-0.71l0.07,-0.67l1.49,-0.72l0.15,-0.61l-0.28,-0.75l0.62,-0.64l0.27,-1.02l0.87,-0.34l0.6,-1.53l-0.68,-2.23l0.3,-0.6l-0.02,-0.99l-0.75,-0.85l-0.38,-1.29l-0.86,-0.74l0.03,-0.4l1.02,-1.08l0.01,-0.78l-0.33,-1.08l1.05,-0.55l0.3,-0.45l0.18,-42.67l0.65,0.27l0.59,0.61l1.97,0.36l1.49,-0.15l2.68,-0.86l2.88,-1.45l31.4,0.02l-0.42,48.46l-0.77,0.91l0.16,0.85l0.6,0.67l-0.74,0.79l0.01,0.5l0.59,0.44l0.67,0.06l-0.32,0.43l-0.06,0.75l-1.62,0.0l-3.69,1.75l-1.16,-0.84l-2.84,0.11l-0.44,0.19l-0.22,0.69l0.66,2.63l-1.51,1.33l-1.15,0.26l-0.55,0.7l-0.62,2.04l-1.11,0.57l-0.93,-0.32l-0.5,0.33l-1.2,1.91l-0.42,2.63l-1.64,0.75l-0.75,-0.65l-1.12,-0.14l-1.08,-0.6l-0.22,-0.24l0.04,-0.89l-0.21,-0.46l-0.98,-0.73l-0.74,-0.19l-0.44,0.2l-0.12,0.52l0.53,0.59l-0.44,0.12l-0.77,-0.39l-0.38,0.23l-0.1,0.46l0.37,0.74l-1.04,0.41l-0.22,0.62l0.02,1.33l-1.04,0.42l-0.11,0.62l-0.26,-0.55l-1.47,-0.03l-0.61,-0.64l-0.43,-0.87l-0.45,-0.13l-1.7,1.02l-1.51,0.39l-1.32,2.22l-0.6,-0.96l-2.42,-0.93l-0.93,-0.61l-0.95,-0.26l-1.7,0.56l-0.3,-0.27l-0.13,-0.61l-0.52,-0.23l-0.58,0.44l0.01,0.78l0.34,0.81l-0.37,0.58l-0.23,0.06l0.12,-0.91l-0.37,-0.43l-0.53,-0.05l-1.42,0.49l-1.69,-0.96l-0.53,0.19l-0.3,0.62l0.44,1.34l-0.48,0.49l-0.95,-0.43ZM593.79,218.58l-0.06,0.21l-0.07,0.04l0.12,-0.25Z", "name": "Indiana"}, "US-IL": {"path": "M518.86,173.55l0.84,-0.23l0.44,-0.61l-0.02,-1.95l-0.59,-0.85l0.14,-0.27l0.71,-0.5l2.36,-0.64l0.74,-0.5l0.76,-1.37l0.34,-1.73l1.77,-1.93l0.35,-0.79l0.09,-1.07l-0.38,-1.7l-0.59,-0.76l-1.35,-0.99l0.05,-1.44l0.83,-1.91l0.45,-0.28l4.46,-0.34l0.81,-0.28l0.89,-0.87l2.52,-0.62l1.52,-1.2l0.23,-0.61l-0.05,-0.76l0.53,-1.36l1.49,-1.09l0.38,-0.64l0.75,-3.66l-0.53,-1.96l-3.62,-2.44l-0.11,-1.24l-0.4,-0.79l-3.19,-2.29l43.47,0.37l-0.33,2.19l0.24,2.28l1.02,2.27l1.12,0.93l0.39,2.24l0.87,2.45l1.11,1.7l-0.18,43.34l-1.25,0.81l-0.18,0.62l0.42,0.95l-0.01,0.5l-0.87,0.78l-0.19,0.97l0.24,0.5l0.74,0.59l0.33,1.19l0.72,0.76l-0.31,1.47l0.68,1.97l-0.41,1.12l-0.55,0.11l-0.62,0.68l-0.13,0.85l-0.68,0.9l0.18,0.73l-1.4,0.73l-0.29,0.38l0.18,0.56l-0.35,0.49l-0.62,0.35l-0.42,0.92l-0.33,-0.07l-0.44,0.4l-0.26,-0.18l-0.54,0.24l-0.78,1.32l0.06,0.75l0.67,0.71l-1.16,0.74l0.07,0.7l-0.24,0.1l-0.2,0.54l0.02,2.3l-0.63,-0.11l-0.42,0.2l0.04,0.46l0.58,0.59l-0.29,0.1l-0.11,0.64l0.69,0.33l-0.0,0.26l-1.39,1.42l-0.37,0.97l0.4,1.12l0.56,0.6l0.2,0.8l-3.08,0.64l-1.16,0.54l-1.15,0.07l-0.83,0.77l-0.39,1.69l0.18,0.77l1.03,1.67l-0.25,0.96l-0.31,0.29l-0.86,-0.07l-5.39,-2.57l-0.96,-0.17l-0.83,0.11l-1.28,0.73l-1.66,2.32l-0.04,0.48l-0.33,-0.2l-0.2,-0.66l-0.36,-0.19l-1.01,0.23l-0.13,0.53l0.21,0.46l-0.72,-0.58l0.04,-0.56l-1.21,-1.93l-0.27,-0.96l-0.61,-0.36l0.0,-0.3l0.97,-1.0l0.29,-0.88l-0.2,-0.88l-1.08,-1.75l0.11,-1.25l-0.24,-1.4l-1.94,-1.01l-1.19,-1.87l-1.68,-0.83l-1.43,-1.24l-1.41,-0.25l-1.56,-0.94l-1.13,-1.14l-0.8,-0.49l-1.9,-2.16l-0.15,-1.56l2.8,-5.38l-0.0,-1.91l1.09,-1.61l-0.28,-0.8l-2.33,-1.44l-1.48,-0.34l-0.85,-0.43l-1.24,0.28l-0.92,1.11l-0.44,0.19l-0.4,-0.14l-0.99,-1.61l-0.26,-1.28l0.21,-0.73l-0.41,-0.79l-0.12,-1.38l-0.66,-1.21l-0.8,-0.83l-3.58,-2.4l-0.78,-1.43l-3.91,-3.26l-0.51,-1.62l-0.86,-1.07l0.1,-1.31l-0.78,-1.3l-0.4,-2.98l0.34,-2.4l0.65,-0.98Z", "name": "Illinois"}, "US-AK": {"path": "M78.48,405.02l0.26,-0.21l0.65,-0.01l0.35,-0.11l0.11,-0.08l0.15,-0.28l-0.02,-0.19l0.16,-0.1l-0.05,-0.14l0.12,-0.08l0.36,0.19l0.27,0.01l0.41,-0.12l0.32,-0.2l0.27,-0.1l0.21,-0.18l0.05,-0.13l0.12,-0.04l0.05,-0.19l0.25,-0.26l0.57,-0.29l0.33,-0.09l0.46,-0.23l0.15,0.01l-0.01,0.08l0.42,0.22l1.18,0.12l1.04,-0.29l0.2,-0.63l-0.26,-0.23l-0.63,-0.24l0.75,-0.35l0.39,-0.09l0.21,-0.1l0.4,-0.03l0.15,0.15l0.17,0.08l0.37,-0.21l0.02,0.03l0.18,-0.07l0.19,-0.22l0.61,-0.33l0.12,-0.14l0.49,-0.11l0.83,-0.11l0.85,-0.05l0.28,0.21l0.11,0.02l-0.22,0.23l-0.04,0.11l-0.1,0.5l0.05,0.32l-0.58,0.14l-0.39,0.19l-0.05,0.09l0.34,0.61l0.75,0.02l0.32,0.37l0.34,0.19l0.41,0.08l1.0,-0.1l0.3,0.11l0.57,0.03l0.38,-0.06l0.31,-0.12l0.43,-0.0l0.04,0.25l0.21,0.25l0.46,-0.04l0.12,-0.15l0.25,-0.06l0.25,0.11l0.37,0.01l0.5,-0.2l0.54,0.11l0.08,0.22l0.07,0.01l0.01,0.11l0.37,0.1l0.43,-0.09l0.24,-0.37l-0.06,-0.12l0.11,-0.07l0.17,-0.27l-0.01,-0.07l0.5,-0.74l0.1,0.0l0.36,0.26l0.3,0.05l-0.14,0.17l0.23,0.36l0.38,0.07l0.38,-0.14l0.33,-0.48l0.09,-0.36l-0.01,-0.3l-0.06,-0.12l-0.39,-0.47l0.69,0.38l0.28,0.04l0.53,-0.01l0.55,-0.12l0.67,-0.05l0.29,-0.14l0.13,-0.18l0.07,-0.25l-0.01,-0.58l-0.06,-0.22l-0.27,-0.35l0.02,-0.47l-0.11,-0.05l-0.31,-0.04l-0.34,0.13l-0.28,-0.0l-0.21,0.08l-0.16,0.15l-0.16,-0.05l-0.36,-0.26l-0.37,-0.12l-0.99,0.11l-0.26,0.07l-0.15,0.1l-0.34,0.51l-0.08,-0.0l-0.29,-0.03l-0.12,-0.08l-0.13,-0.25l-0.22,-0.05l-0.58,-0.41l0.02,-0.2l0.17,-0.2l0.07,-0.3l0.2,-0.18l0.43,0.01l0.29,-0.16l0.05,-0.54l-0.3,-0.26l-0.19,-0.03l-0.32,-0.17l-0.24,-0.02l-0.19,-0.11l-0.27,-0.05l-0.54,0.03l-0.58,0.13l-0.21,-0.19l-0.01,-0.28l-0.17,-0.23l-0.36,-0.12l-0.38,0.09l-0.21,0.45l0.05,0.04l-0.28,0.31l-0.06,-0.0l-0.04,-0.1l-0.35,-0.1l-0.62,0.01l-0.25,0.04l-0.06,0.07l-0.41,-0.17l-1.83,-0.26l-0.06,-0.66l-0.18,-0.62l-0.51,-0.9l-0.34,-0.44l-0.37,-0.33l-1.07,-0.58l-0.9,-0.7l-0.24,-0.1l-0.32,-0.05l-1.29,-0.86l-0.74,-0.39l-1.7,-0.46l-0.51,-0.54l-0.85,-0.46l0.02,-0.31l0.14,-0.18l0.1,-0.32l0.13,-0.14l0.11,-0.23l-0.0,-0.27l0.1,-0.46l0.05,-0.57l-0.03,-0.28l0.3,0.08l0.63,-0.04l0.58,0.11l2.14,-0.12l0.92,-0.2l1.62,-0.11l0.68,-0.18l0.72,-0.3l1.21,-0.72l1.1,-1.09l0.05,0.03l0.25,-0.15l0.3,-0.34l0.2,-0.39l0.02,-0.39l0.15,-0.34l0.04,-0.75l0.12,-0.04l0.22,-0.22l0.06,-0.15l-0.06,-0.4l1.41,-1.04l0.25,-0.46l0.25,-0.24l0.12,-0.21l0.25,-0.18l0.17,-0.08l0.12,0.11l0.89,-0.1l0.33,-0.18l0.15,0.01l0.42,-0.27l-0.02,-0.06l0.04,-0.05l0.95,-0.03l0.46,-0.11l0.47,-0.21l0.19,0.11l0.28,-0.26l0.39,-0.12l0.83,-0.52l0.16,-0.19l0.39,-0.16l0.37,-0.25l0.13,0.3l0.31,0.12l-0.22,0.29l0.27,0.59l0.13,0.02l0.36,-0.11l0.12,0.11l0.4,0.63l0.45,0.15l0.28,-0.38l0.0,-0.19l-0.07,-0.23l-0.17,-0.19l-0.01,-0.41l-0.14,-0.26l0.02,-0.08l0.38,0.01l0.55,-0.2l0.32,0.04l0.5,-0.2l0.22,-0.22l0.0,-0.44l-0.41,-0.17l-0.38,0.08l-0.51,-0.04l-0.44,0.16l-0.16,-0.13l-0.03,-0.15l-0.16,-0.23l0.15,-0.07l0.05,-0.11l0.47,-0.45l0.23,-0.06l0.2,0.27l0.24,0.08l0.35,0.33l0.67,-0.05l0.02,-0.27l0.51,-0.08l0.1,-0.18l0.83,0.1l1.31,-0.17l0.1,-0.12l0.99,-0.02l0.62,-0.19l1.17,-0.59l1.14,-0.76l0.57,-0.59l0.23,-0.31l0.67,-0.61l0.32,-0.2l0.13,0.2l0.31,0.13l0.19,0.19l0.92,0.04l-0.06,0.17l0.43,0.4l0.35,-0.07l0.24,-0.14l0.12,0.06l0.28,-0.07l0.47,0.12l0.02,0.03l-0.4,0.25l-0.1,0.15l-0.21,0.09l-0.69,0.05l-0.2,0.06l0.02,0.05l-0.36,0.26l-0.22,0.42l0.34,0.34l0.23,0.01l0.0,0.06l0.13,0.04l0.02,0.53l0.49,0.39l0.35,-0.12l0.17,-0.19l0.02,-0.14l0.23,-0.06l0.54,-0.01l0.29,-0.14l0.23,-0.32l0.02,-0.32l0.3,-0.27l0.07,-0.02l0.17,0.11l0.29,0.02l0.23,-0.15l0.32,0.01l0.29,-0.19l0.13,-0.36l0.13,0.0l0.42,0.31l-0.06,0.17l-0.18,0.04l-0.31,0.25l0.36,0.64l0.21,-0.02l0.26,0.31l0.14,0.04l0.31,0.01l0.4,-0.08l0.24,0.03l0.04,0.16l0.17,0.14l0.15,0.05l0.2,0.01l0.37,-0.12l0.67,-0.49l0.11,-0.15l1.18,0.07l0.65,-0.11l0.28,-0.18l0.16,0.02l0.35,0.17l0.29,-0.03l0.25,0.24l0.23,0.08l0.21,-0.01l0.08,0.1l0.32,0.15l0.36,-0.14l0.14,-0.16l0.02,-0.13l0.44,0.11l-0.26,0.27l-0.28,0.18l-0.12,0.34l0.05,0.24l-0.2,0.11l-0.18,0.2l0.17,0.6l0.5,0.12l0.34,-0.07l1.32,-0.08l-0.09,0.14l0.3,0.61l0.89,0.08l0.89,-0.02l0.29,0.07l0.48,0.3l0.34,-0.01l0.34,-0.39l-0.0,-0.06l0.32,-0.02l0.55,-0.13l0.31,0.01l0.07,-0.03l0.01,-0.16l0.23,-0.02l0.37,0.12l-0.01,0.08l0.43,0.4l0.61,-0.17l0.4,-0.0l0.19,-0.05l0.64,-0.35l0.28,0.07l0.33,-0.09l0.59,-0.02l0.09,0.1l0.37,0.06l0.33,-0.09l0.76,0.19l0.16,0.17l0.21,0.1l0.24,-0.04l0.32,0.12l0.32,-0.03l0.39,0.16l0.33,0.48l0.58,0.03l0.29,-0.11l0.21,-0.17l0.09,0.01l0.2,0.18l0.18,0.08l0.19,0.01l0.09,0.06l0.36,-0.04l0.07,0.39l0.55,0.2l0.97,0.07l1.09,0.22l0.84,-0.05l0.13,-0.11l1.38,0.07l0.66,-0.02l0.57,0.19l0.78,-0.01l0.71,0.39l0.04,-0.1l0.11,0.24l0.21,-0.05l0.26,0.16l0.43,0.13l0.02,0.16l0.31,0.07l0.35,-0.05l0.67,0.14l0.34,-0.08l0.61,0.09l0.53,-0.08l0.33,-0.25l0.28,-0.1l0.67,-0.0l0.2,0.31l0.45,-0.11l0.2,-0.37l0.17,-0.1l0.19,-0.0l0.24,-0.09l0.3,0.07l0.83,-0.07l0.15,0.22l0.53,0.07l0.07,-0.05l0.05,-0.24l0.15,0.07l0.27,0.0l0.11,0.09l0.21,0.06l0.32,-0.06l0.69,0.3l0.15,0.28l0.28,0.05l0.29,0.12l0.13,0.24l0.43,0.31l0.64,0.09l0.16,0.24l0.19,0.09l0.27,0.02l0.17,-0.07l0.73,0.23l0.43,0.26l0.26,0.33l0.23,0.13l0.42,0.1l0.34,-0.07l0.17,-0.16l0.17,0.04l0.02,52.47l0.29,0.38l1.69,0.5l0.46,-0.19l0.07,-0.12l1.32,0.53l0.4,-0.06l0.92,-0.72l1.52,-0.07l-0.3,0.83l0.08,0.41l0.47,0.51l-0.17,-0.01l-0.51,-0.56l-0.28,-0.14l-0.17,-0.18l-0.37,-0.05l-0.07,0.03l-0.15,0.19l-0.03,-0.02l-0.23,0.37l-0.33,0.22l-0.41,0.44l-1.31,0.53l-0.16,0.03l-0.94,-0.03l-0.77,-0.17l-0.48,-0.22l-0.75,-0.24l0.08,-0.18l0.03,-0.3l-0.06,-0.32l-0.12,-0.21l0.03,-0.06l-0.23,-0.22l-0.21,-0.08l-0.26,-0.24l-0.45,0.12l-0.23,0.31l0.06,0.37l-0.38,0.13l-0.97,-0.34l-1.76,-0.25l-0.56,-0.14l-0.55,-0.05l-1.47,0.23l-1.49,0.1l-0.92,0.25l-0.14,-0.23l-0.46,-0.33l-0.0,-0.19l-0.14,-0.23l-0.3,-0.11l-0.2,0.08l-0.36,-0.05l-0.15,0.05l-0.42,-0.11l-0.1,0.04l-0.31,-0.32l-0.39,-0.18l0.15,-0.15l0.13,-0.39l-0.04,-0.23l-0.09,-0.02l0.05,-0.18l0.11,-0.12l0.31,-0.08l0.16,-0.14l0.09,-0.16l0.02,-0.34l-0.19,-0.29l-0.39,-0.04l-0.46,0.16l-0.27,0.31l-0.27,0.2l-0.1,0.21l-0.42,0.22l-0.29,0.44l-0.19,0.11l-0.2,0.2l-0.17,-0.02l-0.16,-0.1l-0.22,-0.24l-0.57,-0.2l0.35,-0.45l0.0,-0.43l-0.48,-0.25l-0.4,0.18l-0.05,-0.1l-0.11,-0.01l-0.15,-0.17l-0.17,-0.05l-0.11,-0.32l-0.26,-0.17l-0.06,-0.16l-0.45,-0.27l-0.34,-0.04l-0.11,0.04l-0.34,0.32l-0.12,-0.12l-0.2,0.07l-0.11,-0.05l-0.06,-0.09l-0.01,-0.27l0.24,-0.09l0.02,-0.05l0.61,0.02l0.33,-0.1l0.14,-0.65l-0.29,-0.26l-0.33,-0.09l-1.02,0.02l-0.19,0.09l-0.25,0.24l-0.4,0.24l-0.22,0.2l-0.15,-0.1l-0.43,-0.05l-0.34,0.16l-0.15,-0.14l-0.32,0.21l-0.08,-0.07l-0.1,0.02l0.04,-0.19l-0.14,-0.26l-0.1,-0.06l-0.06,-0.33l-0.22,-0.08l-0.26,0.03l-0.2,-0.59l-0.39,-0.07l-0.24,0.14l-0.27,0.38l-0.25,0.2l-0.23,0.28l-0.45,-0.14l-0.99,0.34l-0.0,0.23l-0.34,0.44l0.34,0.43l-0.5,0.07l-0.49,0.23l-0.22,0.39l0.16,0.2l-0.16,0.38l0.37,0.4l0.24,0.0l-0.34,0.27l-0.19,0.31l-0.02,0.08l0.19,0.44l0.43,0.05l0.56,-0.39l0.13,0.04l0.07,0.18l0.16,0.03l-0.05,0.24l-0.38,0.2l-0.08,0.19l0.02,0.15l-0.15,0.18l0.24,0.38l-0.05,0.26l-0.12,-0.04l-0.26,0.31l-0.08,0.01l-0.0,0.06l-0.04,-0.02l-0.03,0.05l-0.33,-0.06l-0.38,0.07l-0.23,-0.13l-0.18,-0.01l-0.12,-0.38l-0.42,-0.05l-0.24,0.09l-0.18,0.14l-0.05,-0.22l-0.21,-0.26l-0.31,-0.09l-0.24,0.06l-0.26,0.31l-0.05,0.32l0.04,0.32l-0.15,0.06l-0.07,-0.08l-0.31,-0.15l-0.42,0.16l-0.13,0.4l-0.28,0.11l0.02,0.27l-0.32,-0.09l-0.36,0.17l-0.09,0.23l0.04,0.18l-0.19,0.05l-0.21,-0.18l-0.1,0.03l-0.27,0.2l-0.34,0.53l-0.11,-0.18l-0.13,-0.01l-0.23,0.06l-0.38,0.22l-0.24,0.37l0.16,0.27l-0.37,0.23l-0.04,0.09l-0.35,0.19l-0.15,0.2l-0.13,-0.06l-0.26,0.02l-0.36,-0.11l-0.21,-0.01l-0.19,0.06l-0.07,0.29l-0.33,-0.05l-0.38,0.15l-0.16,0.13l-0.25,0.08l-0.37,-0.16l0.22,-0.12l-0.04,-0.25l0.12,-0.03l0.21,-0.16l0.42,0.03l0.18,0.12l0.25,0.06l0.39,-0.28l-0.0,-0.31l0.12,-0.02l0.2,-0.18l0.1,-0.01l0.33,-0.39l-0.01,-0.08l0.2,-0.32l0.28,-0.21l0.01,-0.63l-0.34,-0.17l-0.45,0.07l-1.31,0.75l-0.63,-0.21l-0.17,-0.11l0.46,-1.1l0.98,-0.93l0.18,-0.37l0.05,-0.39l0.1,-0.04l0.19,-0.25l0.09,-0.9l-0.04,-0.18l-0.15,-0.22l-0.11,-0.31l0.17,-0.13l0.68,-0.1l1.07,-0.74l1.01,-0.53l0.23,0.32l0.36,0.2l0.63,0.11l0.25,-0.04l0.63,-0.28l0.13,0.01l0.38,0.18l0.41,0.02l0.21,0.09l1.13,0.18l0.3,0.16l0.26,-0.01l0.25,-0.58l-0.2,-0.33l-0.18,-0.17l-0.3,-0.16l-0.33,-0.06l-0.37,0.08l-0.46,-0.23l-0.47,-0.07l-0.9,-0.48l0.19,-0.21l0.17,-0.35l0.28,-0.13l0.18,-0.26l1.3,-0.39l0.22,-0.14l0.05,-0.07l-0.18,-0.63l-0.84,-0.09l-0.87,0.17l-0.38,0.19l-0.56,0.47l-0.15,0.25l-0.06,0.32l-0.77,-0.05l-0.18,-0.12l-0.35,0.16l-0.11,-0.01l0.03,-0.1l-0.48,-0.5l-0.08,0.02l-0.24,0.16l-0.15,0.28l-0.17,0.02l-0.13,0.18l-0.44,0.16l-0.28,0.05l-0.37,0.21l-0.18,0.19l-0.27,0.44l-0.53,0.15l-0.22,-0.02l-0.36,0.07l-0.22,0.1l-0.41,0.33l-0.23,0.09l-0.35,0.46l-0.07,0.29l0.03,0.17l-0.22,0.07l-0.31,0.24l-0.15,0.05l-0.13,0.13l-0.14,0.25l-0.44,0.28l-0.33,0.34l-0.16,0.34l0.04,0.38l-0.22,0.31l-0.22,0.08l-0.18,0.13l-0.4,-0.01l-0.06,-0.08l-0.18,-0.05l-0.25,-0.21l-0.11,-0.03l-0.53,0.02l-0.33,0.15l-0.08,0.07l-0.12,0.39l0.4,0.34l0.24,-0.07l0.06,0.12l0.27,0.22l0.39,0.14l0.36,0.31l-0.21,0.23l-0.08,0.21l-0.23,0.08l-0.58,-0.02l-0.71,0.1l-0.31,0.16l-0.19,0.25l-0.01,0.09l-0.39,-0.08l-0.25,0.39l-0.01,0.21l-0.14,-0.12l-0.09,0.01l-0.56,0.46l-0.04,0.07l0.12,0.23l-0.32,-0.04l-0.26,0.12l-0.17,0.43l0.15,0.12l-0.23,0.16l-0.44,0.07l-0.39,0.24l0.08,0.4l-0.09,0.17l-0.04,0.31l-0.33,0.28l0.07,0.14l-0.11,0.17l0.03,0.09l0.17,0.16l0.07,0.36l0.24,0.24l0.34,0.04l0.24,-0.13l0.14,-0.14l0.44,0.08l0.51,-0.03l0.14,0.19l0.32,0.18l0.21,0.05l0.2,-0.02l0.09,0.18l-0.16,0.44l-0.35,0.15l-0.26,0.31l-0.36,0.06l-0.42,-0.01l-0.3,0.2l-0.07,0.27l-0.08,0.04l0.01,0.1l-0.16,0.0l-0.35,0.19l-0.01,0.47l-0.04,0.04l-0.58,0.27l-0.16,0.14l-0.07,0.2l0.01,0.18l-0.12,-0.02l-0.01,0.04l0.12,0.02l-0.0,0.01l-0.46,0.03l-0.09,0.31l-0.15,0.02l-0.12,0.25l-0.29,0.06l-0.22,0.18l-0.55,-0.05l-0.4,0.1l-0.06,0.04l-0.05,0.23l-0.05,0.01l-0.16,0.4l-0.22,-0.02l-0.53,0.29l-0.15,0.34l-0.25,-0.16l-0.34,-0.05l-0.11,0.03l-0.2,0.14l-0.09,0.14l-0.1,0.42l-0.26,0.06l-0.04,0.31l-0.33,0.12l-0.5,-0.09l-0.13,0.17l-0.1,0.03l-0.08,0.27l-0.14,-0.01l-0.37,0.18l-0.04,0.07l-0.31,0.14l-0.37,0.31l-0.3,0.13l-0.19,0.24l-0.03,0.33l0.32,0.36l0.19,0.05l-0.09,0.06l-0.02,0.2l-0.96,0.1l-0.18,0.16l-0.07,0.19l-0.17,-0.03l-0.2,0.35l-0.12,0.01l-0.33,0.29l-0.29,-0.0l-0.07,0.21l-0.2,-0.18l-0.22,-0.11l-0.4,0.03l-0.28,0.25l-0.07,0.29l-0.22,0.23l-0.17,0.03l-0.0,0.14l-0.38,-0.08l-0.63,0.23l-0.17,0.18l-0.52,0.25l-0.24,0.4l-0.23,-0.04l-0.2,0.03l-0.37,0.2l-0.38,0.39l-0.05,0.11l-0.27,0.18l-0.18,0.23l-0.05,0.14l0.1,0.34l-0.06,0.03l-0.1,0.31l-0.04,-0.03l-0.02,0.11l-0.04,-0.01l-0.01,0.05l0.07,0.02l-0.07,0.06l0.07,0.17l-0.08,0.03l-0.2,-0.06l-0.31,0.17l-0.14,0.21l-0.22,0.06l-0.28,-0.01l-0.36,0.16l-0.3,0.07l-0.36,0.07l-0.14,-0.18l-0.07,0.0l-0.32,0.07l-0.19,0.14l-0.03,0.1l-0.74,-0.07l-0.48,0.29l-0.11,-0.03l-0.32,0.14l-0.12,0.22l-0.06,-0.09l0.11,-0.29l-0.05,-0.07l-0.17,-0.14l-0.27,-0.08l-0.51,-0.24l-0.01,-0.04l0.23,-0.33l0.06,-0.32l0.23,-0.42l0.37,-0.25l0.21,-0.25l0.56,-0.28l0.59,-0.47l0.29,-0.15l0.48,-0.18l0.13,0.03l0.31,-0.08l0.63,-0.3l0.24,-0.03l0.31,-0.32l-0.03,-0.07l0.21,-0.08l0.22,0.04l0.13,-0.14l0.38,0.15l0.38,-0.01l0.16,0.09l0.52,-0.47l-0.04,-0.31l-0.12,-0.28l-0.0,-0.45l0.19,-0.29l0.95,-0.99l0.33,-0.18l0.34,-0.02l0.14,-0.21l0.29,-0.24l0.18,-0.25l0.41,-0.22l0.07,0.22l0.26,0.12l0.77,0.02l0.27,-0.09l0.18,-0.14l0.12,-0.27l-0.01,-0.2l-0.14,-0.18l-0.41,-0.31l-0.17,0.05l-0.1,-0.25l-0.25,-0.17l0.23,-0.93l0.09,-0.93l0.39,-0.12l0.17,-0.13l0.31,0.05l0.32,0.15l0.37,-0.63l-0.16,-0.2l-0.22,-0.14l-0.56,-0.17l-0.26,-0.01l-0.16,0.05l-0.04,-0.19l0.27,-0.56l0.26,-0.13l0.38,-0.42l0.5,-0.38l0.47,-0.13l0.29,-0.39l-0.3,-0.28l0.01,-0.24l0.11,-0.18l0.03,-0.16l0.26,-0.12l0.17,-0.24l0.05,-0.49l0.16,-0.2l-0.05,-0.52l-0.52,-0.03l-0.25,0.18l-0.2,0.3l-0.08,0.33l-0.35,0.17l-0.21,0.37l-0.44,0.19l-0.44,0.09l-0.83,0.32l-0.72,0.29l-0.55,0.29l-0.59,0.15l-0.12,-0.05l-0.03,-0.23l-0.21,-0.33l-0.38,-0.21l0.08,-0.27l0.17,-0.25l0.42,0.07l0.1,0.08l0.13,0.36l0.21,0.2l0.05,0.03l0.28,-0.17l0.01,0.08l0.04,-0.01l0.11,-0.13l0.05,0.05l0.03,-0.03l-0.05,-0.05l0.11,-0.05l0.09,-0.18l-0.18,-0.2l0.01,-0.17l-0.11,-0.23l-0.37,-0.39l-1.08,-0.29l-0.33,-0.43l-0.64,0.24l-0.02,0.27l0.16,0.29l-0.14,0.29l-0.44,-0.23l-0.27,0.09l-0.17,0.65l0.07,0.17l-0.26,0.17l-0.05,0.07l0.04,0.07l-0.2,0.31l0.09,0.43l0.41,0.82l0.04,0.23l-0.37,-0.06l-0.01,-0.09l-0.05,0.03l-0.14,-0.16l0.04,-0.03l-0.31,-0.46l-0.71,-0.92l-0.29,-0.29l-0.33,-0.21l-0.04,-0.24l-0.14,-0.22l-0.29,-0.13l-0.48,0.07l-0.37,0.24l0.03,0.18l-0.09,0.14l-0.15,-0.2l-0.14,-0.09l-0.23,-0.06l-0.26,0.03l-0.09,-0.04l-0.03,-0.25l-0.23,-0.31l-0.03,-0.12l-0.34,-0.19l-0.36,0.02l-0.17,0.07l-1.26,0.83l-0.38,0.01l-0.17,0.05l-0.73,0.38l-0.19,0.0l-0.14,-0.1l-0.2,0.07l-0.19,0.21l-0.04,0.25l-0.23,0.35l-0.52,0.22l-0.08,-0.08l0.33,-0.29l-0.02,-0.57l-0.1,-0.1l-0.25,-0.09l0.0,-0.32l0.51,-0.33l0.26,-0.37l-0.12,-0.37l-0.33,-0.2l-0.36,0.0l-0.14,0.09l-0.54,0.01l-0.03,-0.08l0.12,-0.24l0.04,-0.43l0.38,-0.29l0.26,-0.13l0.18,-0.23l-0.04,-0.42l-0.45,-0.58l-0.14,-0.44l-0.41,-0.6l-0.27,-0.31l-0.06,-0.38l-0.35,-0.32l-0.04,-0.1l0.08,-0.19l0.06,-0.47l0.14,-0.13l-0.17,-0.42l-0.26,-0.09l-0.15,0.02l-0.1,0.03l-0.06,0.15l-0.11,-0.1l0.2,-0.32l0.09,-0.29l0.17,-0.12l0.14,-0.23l0.03,-0.24l0.24,-0.17l0.21,0.02l0.37,-0.18l0.13,-0.16l0.02,-0.72l-0.1,-0.05l-0.31,-0.02l-0.28,0.13l-0.19,-0.17l-0.37,-0.08l-0.35,0.27l0.08,0.3l-0.29,0.15l-0.12,0.2l-0.09,0.36l-0.24,0.39l-0.16,0.07l-0.05,0.11l-0.21,0.22l-0.25,0.13l-0.06,0.1l0.05,0.02l-0.16,0.19l-0.32,0.23l0.22,0.46l0.53,0.16l-0.04,0.31l0.06,0.22l-0.13,0.02l-0.24,-0.08l-0.56,0.34l-0.89,0.4l-0.74,0.14l-1.0,0.15l-0.84,0.01l-0.68,-0.16l0.28,-0.4l-0.31,-0.28l0.03,-0.06l-0.05,-0.0l-0.04,-0.15l-0.88,-0.39l-0.37,-0.53l-0.36,-0.21l-0.07,-0.48l-0.52,-0.03l-0.13,0.1l-0.67,-0.22l0.25,-0.32l0.06,-0.29l-0.09,-0.26l-0.18,-0.16l-0.17,-0.05l0.22,-0.16l0.11,-0.16l0.04,-0.33l0.34,-0.27l0.06,0.08l0.28,0.18l0.64,0.03l0.38,0.12l-0.28,0.29l-0.14,0.23l-0.02,0.07l0.05,0.02l-0.06,0.51l0.08,0.07l0.4,0.06l0.08,-0.03l0.51,-0.48l0.39,-0.06l0.2,-0.17l0.14,-0.32l0.18,-0.1l0.02,0.59l0.19,0.29l0.18,0.12l0.23,0.05l0.39,-0.06l0.27,-0.11l0.62,-0.39l0.18,-0.18l0.09,-0.18l-0.0,-0.36l-0.06,-0.12l0.08,-0.15l-0.16,-0.16l-0.3,-0.17l-0.0,-0.4l-0.22,-0.24l-0.28,-0.07l-0.12,-0.35l-0.12,-0.04l-0.29,0.01l-0.21,0.08l-0.12,0.15l-0.19,0.06l-0.24,0.17l-0.15,0.22l-1.2,-0.05l-0.43,0.05l-0.1,-0.18l-0.2,-0.14l-0.46,-0.07l-0.24,0.05l-0.1,-0.07l0.25,-0.11l0.16,-0.66l-0.37,-0.18l-0.31,0.05l-0.41,-0.02l0.02,-0.47l-0.27,-0.21l0.03,-0.16l0.22,-0.09l0.22,-0.27l0.46,-0.06l0.14,-0.17l0.18,-0.08l0.18,-0.18l0.21,-0.73l-0.14,-0.17l-0.21,-0.12l-0.23,-0.03l-0.39,0.28l-0.22,0.31l-0.4,0.1l-0.22,0.14l-0.17,0.21l-0.3,0.16l-0.09,0.22l-0.3,0.26l0.05,0.04l-0.1,0.3l-0.3,0.22l-0.14,0.29l-0.04,-0.25l0.06,-0.19l-0.36,-0.28l-0.5,-0.11l0.25,-0.22l0.09,-0.38l-0.06,-0.23l-0.14,-0.19l-0.31,-0.16l0.32,-0.11l0.0,-0.67l-0.11,-0.04l0.13,-0.07l0.32,-0.01l0.31,-0.14l-0.12,-0.47l0.12,-0.09l-0.12,-0.17l-0.22,-0.16l-0.11,-0.24l0.17,-0.4l0.32,-0.24l0.49,-0.65l0.39,-0.39l0.18,-0.3l0.52,-0.44l0.3,0.0l0.26,0.29l0.23,0.07l-0.08,0.2l0.4,0.29l0.34,-0.09l0.54,-0.41l0.02,-0.37l-0.04,-0.09l-0.18,-0.16l0.02,-0.17l-0.26,-0.15l0.69,-0.64l-0.17,-0.68l-0.37,0.01l-0.38,0.28l-0.24,-0.53l0.32,-0.52l0.27,-0.01l0.18,0.09l0.25,-0.05l0.37,0.09l0.3,-0.11l0.13,-0.47l-0.17,-0.33l-0.2,-0.16l-0.18,-0.07l0.03,-0.03l0.76,-0.21l0.41,0.03l0.81,0.25l0.07,0.16l-0.25,0.11l-0.22,0.26l-0.05,0.2l0.19,0.45l0.48,-0.07l0.1,-0.1l0.38,-0.17l0.29,-0.24l0.29,0.31l0.41,0.04l0.14,-0.07l0.7,-0.06l0.9,-0.54l0.18,-0.2l0.06,-0.15l0.37,-0.1l0.35,-0.26l0.72,-0.88l0.24,-0.19l0.33,0.29l1.72,-0.21l0.38,0.07l0.19,-0.06l0.09,0.03l0.28,-0.03l0.15,-0.09l0.64,-0.13l0.18,-0.09l0.45,-0.38l0.15,-0.22l0.15,-0.07l0.27,-0.3l0.17,-0.11l0.3,-0.46l0.09,-0.43l-0.01,-0.19l-0.16,-0.52l-0.4,-0.75l-0.06,-0.75l-0.09,-0.35l-0.16,-0.23l-0.47,-0.3l-0.17,-0.18l0.06,-0.1l-0.08,-0.08l0.27,-0.03l0.24,-0.12l0.11,-0.11l-0.01,-0.06l0.64,-0.47l0.18,-0.33l0.06,-0.45l-0.07,-0.27l-0.42,-0.59l-0.14,-0.11l-0.22,-0.08l0.13,-0.13l-0.18,-0.41l-0.36,-0.11l-0.24,0.07l-0.24,-0.02l-0.28,0.07l-0.15,0.25l-0.35,0.22l-0.27,0.42l-0.2,0.02l-0.25,-0.07l-0.29,-0.2l-0.4,-0.05l-0.41,0.31l0.03,0.06l-0.38,0.24l-0.34,-0.03l-0.14,0.05l-0.07,0.1l-0.36,0.2l-0.18,0.25l-0.78,0.34l-0.44,0.36l-0.14,0.25l-0.17,-0.28l-0.61,-0.34l-0.72,-0.58l-0.5,0.11l-0.44,0.25l-0.15,0.22l-0.7,-0.18l-0.58,-0.01l-0.49,0.11l-0.85,0.0l-0.27,-0.1l-0.28,0.02l-0.8,0.37l-0.3,-0.07l-0.5,0.08l-0.21,-0.1l-0.3,0.24l-0.06,-0.0l0.03,0.03l-0.05,-0.01l-0.11,0.13l0.01,0.06l-1.33,-0.33l-1.47,-0.2l-0.47,-0.13l-0.59,-0.07l-0.49,-0.23l-0.25,-0.32l0.22,-0.13l0.12,-0.27l-0.22,-0.77l-0.31,-0.23l-0.58,-0.24l-0.01,-0.05l0.37,-0.1l0.34,-0.35l0.1,-0.31l0.07,-0.03l0.75,0.16l0.26,-0.02l0.2,-0.08l0.11,-0.61l-0.13,-0.15l-0.27,-0.19l-0.44,-0.16l-0.47,-0.05l-0.12,0.04l-0.8,-0.28l-1.13,-0.12l-0.1,0.06l-0.8,-0.18l-0.6,-0.05l-0.54,-0.17l-0.21,-0.19l-0.88,-0.38ZM96.16,411.44l-0.0,0.01l0.0,0.04l-0.02,-0.03l0.02,-0.01ZM86.52,429.18l-0.01,0.04l0.08,0.26l-0.09,-0.07l-0.01,-0.22l0.03,-0.02ZM105.13,456.7l0.01,0.0l-0.0,0.02l-0.01,-0.02ZM104.02,457.09l-0.05,0.02l-0.08,0.43l-0.26,-0.21l0.07,-0.02l0.05,-0.32l0.07,0.07l0.19,0.03ZM103.12,457.55l-0.18,0.02l-0.09,0.13l-0.43,-0.01l-0.24,0.12l-0.16,0.17l-0.04,-0.25l-0.05,-0.05l-0.21,-0.11l-0.19,-0.04l-0.17,-0.16l-0.53,-0.25l-0.24,-0.01l-0.63,0.13l-0.08,0.16l-0.15,0.08l-0.36,0.43l-0.05,0.3l0.04,0.11l-0.03,0.21l-0.45,0.54l-0.4,0.02l-0.29,0.36l-0.28,0.11l-0.24,0.2l-0.29,-0.23l-0.21,-0.39l0.16,-0.11l0.09,-0.2l-0.01,-0.21l-0.07,-0.19l0.83,-0.86l0.3,-0.15l0.17,-0.16l0.6,-0.32l0.37,-0.27l1.29,-0.31l0.84,0.04l0.14,0.25l0.34,0.31l0.35,0.43l0.28,-0.03l0.16,0.19l0.11,0.04ZM101.32,458.43l-0.1,0.04l-0.1,-0.07l0.2,0.03ZM100.96,458.34l-0.01,0.0l0.0,-0.0l0.0,0.0ZM96.09,460.15l-0.21,0.37l-0.06,0.0l-0.05,-0.33l-0.13,-0.08l0.36,-0.22l0.12,0.1l-0.02,0.17ZM93.49,461.59l-0.11,0.14l-0.04,0.2l-0.31,0.14l-0.56,-0.12l-1.19,0.07l-0.32,0.1l-0.59,0.41l-0.14,0.19l-0.03,0.21l-0.14,0.07l-0.48,0.05l-0.15,0.07l-0.31,-0.03l-0.17,-0.3l0.41,-0.14l0.24,-0.19l0.68,-1.09l0.23,0.13l0.48,0.03l0.24,-0.08l0.18,-0.26l0.42,-0.09l0.37,-0.26l0.43,-0.08l0.43,0.03l0.31,0.3l0.03,0.32l0.09,0.21ZM129.29,436.86l0.03,0.01l-0.05,0.04l-0.06,-0.02l0.09,-0.04ZM148.48,429.66l0.01,0.18l-0.23,0.15l0.07,0.21l-0.21,0.07l-0.22,0.18l0.13,-0.26l-0.02,-0.12l0.48,-0.41ZM179.19,436.27l0.21,0.08l0.16,0.47l0.24,0.3l3.42,2.62l0.31,1.03l-0.09,0.31l0.41,0.51l0.29,-0.02l0.22,-0.08l0.56,-0.41l0.34,-0.18l-0.39,0.45l-0.08,0.27l0.47,0.39l0.29,-0.11l0.23,-0.22l0.18,0.0l0.07,0.12l0.36,-0.06l0.31,0.25l0.16,0.28l0.06,0.02l0.07,0.15l-0.04,0.04l0.11,0.54l0.3,0.17l0.28,-0.02l0.1,-0.06l0.12,0.04l0.26,-0.08l0.05,0.06l-0.14,0.21l0.06,0.09l-0.23,-0.07l-0.04,0.06l-0.35,-0.23l-0.42,0.13l-0.08,0.29l-0.33,0.13l-0.01,0.06l-0.36,-0.31l-0.1,0.05l-0.13,-0.1l-0.29,-0.09l-0.39,0.05l-0.14,-0.13l-0.31,-0.14l-0.58,-0.39l0.1,-0.51l-0.15,-0.17l-0.12,-0.08l-0.27,-0.03l-0.36,0.14l-0.64,-0.48l-0.05,-0.05l-0.09,-0.39l-0.21,-0.3l-0.82,-0.64l-0.3,-0.14l-0.25,-0.19l-0.16,0.0l-0.09,-0.44l-0.36,-0.13l-0.59,0.11l-1.03,-0.51l-0.38,-0.12l-0.2,-0.18l-0.18,-0.07l-0.08,-0.14l-0.33,-0.07l-0.31,-0.16l-0.26,0.01l-0.18,-0.12l-0.27,-0.09l0.14,-0.09l0.01,-0.25l0.09,0.04l0.21,-0.23l0.07,0.49l0.38,0.2l0.35,-0.08l0.25,-0.37l0.01,-0.36l-0.1,-0.18l-0.04,-0.44l0.34,0.01l0.36,0.21l0.33,-0.03l0.08,-0.04l0.2,-0.46l-0.23,-0.17ZM186.32,440.51l-0.14,-0.1l0.17,-0.09l-0.02,0.18ZM188.31,441.49l-0.01,-0.02l0.02,0.01l-0.01,0.01ZM188.23,440.71l-0.15,0.1l-0.1,0.39l-0.24,-0.01l0.05,-0.31l-0.46,-0.4l-0.21,0.06l-0.23,-0.25l0.22,-0.01l0.31,-0.17l0.42,-0.6l0.07,-0.24l-0.02,-0.47l0.26,-0.06l0.23,-0.16l0.26,-0.38l0.04,-0.39l0.72,-0.12l1.42,-0.63l0.3,0.22l0.26,0.12l0.13,0.23l0.18,0.17l0.22,0.08l0.12,0.11l0.0,0.12l-0.15,0.19l0.11,0.58l0.12,0.07l0.01,0.26l0.26,0.34l0.24,0.15l0.63,0.13l0.15,0.25l0.4,0.32l0.35,0.09l0.11,0.15l-0.03,0.17l0.29,0.42l0.05,0.19l0.27,0.32l0.14,0.11l1.34,0.61l0.25,0.29l-0.36,0.04l-0.3,0.13l-0.17,0.24l-0.02,0.12l-0.32,0.39l0.07,0.15l-0.21,0.18l-0.09,0.18l-0.61,-0.49l-0.24,-0.08l-0.4,-0.05l-0.16,-0.09l-0.05,-0.3l-0.12,-0.18l-0.19,-0.13l-0.01,-0.09l-0.07,-0.04l-0.12,-0.2l0.07,-0.12l-0.07,-0.26l0.02,-0.28l-0.08,-0.29l-0.33,-0.15l0.06,-0.07l-0.04,-0.03l-0.12,0.03l0.01,-0.08l-0.04,-0.01l-0.01,0.09l-0.07,-0.08l-0.1,0.04l-0.11,-0.61l-0.14,-0.3l-0.11,-0.52l-0.43,-0.69l0.11,-0.76l-0.11,-0.34l-0.7,0.01l-0.18,0.59l-0.18,-0.02l-0.38,0.28l0.18,0.47l-0.13,0.34l0.52,0.64l0.02,0.68l0.49,0.89l0.04,0.3l0.14,0.24l-0.1,0.32l0.44,0.87l0.11,0.36l-0.11,0.17l-0.16,-0.05l-0.09,-0.12l-0.1,-0.37l-0.3,-0.57l-0.33,-0.17l-0.07,0.0l-0.38,0.31l-0.2,0.02l-0.24,0.1l0.06,-0.18l-0.03,-0.28l0.11,-0.17l-0.26,-0.36l-0.1,-0.03l-0.29,-0.54l0.56,-0.13l0.25,-0.6l-0.05,-0.08l-0.17,-0.15l-0.24,-0.08l-0.47,-0.03l-0.14,0.15l-0.16,-0.5l-0.22,-0.2l-0.2,-0.06l-0.32,0.08l-0.08,0.49ZM197.15,443.3l0.52,0.44l-0.07,0.32l0.31,0.52l0.67,0.7l0.32,0.67l-1.31,-0.17l0.01,-0.06l-0.21,-0.22l0.09,-0.7l-0.52,-0.12l-0.2,0.07l-0.39,0.63l-0.09,-0.12l0.01,-0.12l-0.12,-0.26l0.07,-0.23l0.21,-0.23l0.05,-0.23l-0.06,-0.23l0.09,-0.1l0.08,-0.24l0.27,-0.03l0.25,-0.28ZM199.35,446.49l1.4,2.05l0.67,0.78l0.31,0.5l-0.24,0.37l0.24,0.61l0.66,0.16l-0.14,0.43l0.23,0.49l0.52,0.2l0.04,0.19l0.17,0.28l0.04,0.43l0.34,0.25l0.47,0.03l0.36,-0.04l1.58,0.9l0.38,0.12l0.55,0.06l0.15,0.07l0.46,0.44l0.49,0.15l0.12,0.31l0.11,0.14l0.19,0.11l0.62,0.16l0.37,-0.03l0.06,0.13l0.01,0.28l-0.37,0.42l-0.16,0.39l0.06,0.43l0.09,0.14l-0.06,0.16l-0.0,0.33l0.07,0.22l0.26,0.47l0.01,0.35l0.06,0.16l-0.19,0.14l-0.06,0.19l-0.14,0.17l-0.46,0.84l-0.2,0.27l-0.29,0.19l-0.28,-0.02l-0.04,-0.25l-0.14,-0.2l0.2,-0.19l0.14,-0.25l0.32,-0.29l0.32,-0.42l0.1,-0.2l-0.4,-0.54l-0.3,0.11l-0.43,-0.2l-0.29,0.16l-0.02,-0.25l0.07,-0.51l-0.1,-0.9l-0.16,-0.27l-0.08,-0.38l-0.32,-0.08l-0.13,-0.21l-0.18,-0.16l0.17,-0.1l0.08,-0.21l0.12,-0.12l0.05,-0.51l-0.49,-0.14l-0.31,0.16l-0.38,0.35l-0.36,0.15l-0.47,-0.07l-0.08,0.06l0.01,0.04l-0.21,-0.01l-0.15,0.13l-0.13,0.01l-0.42,0.26l-0.23,0.02l0.03,-0.17l-0.07,-0.53l0.47,-0.04l0.48,0.08l0.27,-0.11l0.18,-0.18l-0.02,-0.03l0.26,-0.23l-0.24,-0.44l-0.08,-0.03l-0.24,-0.02l-0.28,0.1l-0.74,-0.08l-0.18,-0.53l-0.3,-0.18l-0.36,-0.07l-0.1,-0.24l-0.17,-0.17l-0.28,-0.13l0.09,-0.15l-0.37,-0.6l-0.15,0.02l0.19,-0.16l0.0,-0.68l-0.39,-0.09l-0.23,0.09l-0.23,0.18l-0.45,-0.26l-0.09,-0.17l0.16,-0.21l-0.18,-0.82l-0.44,-0.14l-0.33,0.22l-0.12,-0.01l-0.26,-0.15l0.03,-0.15l-0.29,-0.26l0.24,-0.06l0.21,-0.13l0.18,-0.36l-0.0,-0.1l-0.32,-0.29l0.22,-0.08l0.17,-0.19l-0.15,-0.53l-0.24,-0.1l-0.17,-0.21l-0.08,0.04l-0.43,-0.43l-0.3,-0.12l-0.19,-0.17l-0.3,-0.11l-0.0,-0.12l0.25,0.11l0.85,0.15l0.06,-0.01l0.18,-0.43ZM207.02,460.63l-0.05,-0.06l0.08,0.04l-0.03,0.01ZM207.22,459.6l-0.02,0.02l-0.05,-0.02l0.06,-0.0ZM203.19,456.71l0.02,0.11l0.19,0.08l-0.1,0.18l-0.36,-0.02l0.21,-0.13l0.06,-0.22ZM202.7,457.28l-0.04,-0.15l0.06,-0.02l-0.02,0.18ZM202.49,454.42l0.21,0.0l0.05,0.12l-0.04,0.0l-0.22,-0.13ZM201.69,455.19l0.08,-0.04l0.33,0.08l-0.15,0.14l-0.27,-0.18ZM201.13,454.97l-0.11,-0.02l0.1,-0.05l0.01,0.07ZM199.18,448.65l-0.17,0.11l-0.25,0.03l0.01,-0.17l-0.15,-0.3l-0.11,-0.03l0.1,-0.06l0.11,0.04l0.45,0.38ZM195.21,449.44l-0.03,0.1l-0.2,0.03l-0.14,0.11l-0.06,0.24l-0.15,0.06l-0.03,-0.07l0.04,-0.06l-0.11,-0.25l0.08,-0.16l0.31,0.1l0.27,-0.34l0.02,0.23ZM194.43,450.12l-0.07,0.04l-0.01,-0.09l0.08,-0.04l0.0,0.09ZM194.46,450.04l-0.03,-0.01l0.07,-0.0l-0.04,0.02ZM194.52,449.99l0.02,-0.01l-0.0,0.02l-0.01,-0.01ZM195.14,448.74l-0.13,-0.29l-0.0,-0.71l-0.37,-0.07l-0.37,0.1l-0.12,-0.13l-0.05,-0.32l-0.1,-0.21l0.04,-0.29l-0.09,-0.54l-0.21,-0.71l0.11,-0.22l0.52,-0.06l0.22,0.12l0.04,0.12l-0.08,0.12l0.1,0.17l-0.08,0.08l0.14,0.46l-0.05,0.23l0.07,0.28l0.04,0.05l0.3,0.01l0.46,0.63l-0.04,0.23l0.05,0.06l0.37,0.13l-0.4,0.03l-0.09,0.12l0.02,0.12l-0.12,0.09l0.11,0.29l-0.17,0.25l-0.12,-0.13ZM192.51,441.36l0.03,0.05l-0.04,0.01l0.01,-0.04l-0.01,-0.02ZM188.54,443.73l-0.06,0.02l-0.09,-0.12l0.12,-0.01l0.03,0.1ZM177.07,436.53l-0.08,-0.29l0.08,-0.06l0.11,0.15l-0.07,0.22l-0.03,-0.03ZM147.86,377.56l0.0,0.0l-0.01,0.02l-0.01,-0.01l0.02,-0.02ZM101.92,400.49l-0.49,-0.18l-0.15,-0.03l0.12,-0.08l0.21,0.13l0.21,0.05l0.1,0.11ZM97.86,398.24l-0.56,-0.05l-0.2,-0.37l0.43,-0.04l0.34,0.46ZM204.23,458.42l0.06,-0.05l0.03,0.19l-0.06,-0.1l-0.04,-0.04ZM204.67,457.73l-0.03,-0.23l0.18,-0.05l-0.02,0.22l-0.13,0.06ZM205.03,456.97l0.14,-0.12l-0.02,-0.37l0.38,-0.14l0.42,0.57l0.06,0.21l0.21,0.26l0.06,0.17l-0.04,0.11l0.06,0.1l-0.12,0.08l-0.02,0.46l-0.07,0.1l-0.16,-0.11l-0.08,-0.33l-0.13,-0.27l-0.06,-0.35l-0.49,-0.26l-0.19,0.16l0.12,-0.18l-0.06,-0.1ZM198.75,454.62l0.0,-0.0l0.0,0.0l-0.0,-0.0ZM199.13,455.84l0.41,0.06l0.06,-0.04l0.28,0.16l0.26,0.03l0.67,0.6l0.01,0.07l0.18,0.21l0.06,0.25l-0.07,0.04l-0.03,0.15l-0.13,0.08l-0.15,0.24l0.11,0.17l-0.2,0.07l-0.26,0.23l0.07,0.25l-0.04,0.06l0.05,0.12l-0.04,0.02l0.02,0.05l0.04,-0.02l0.14,0.3l0.42,-0.1l0.47,0.28l0.18,-0.07l0.24,0.1l-0.13,0.38l0.06,0.31l0.26,0.22l0.28,-0.02l-0.05,0.16l-0.3,0.16l-0.04,-0.14l-0.31,-0.04l-0.21,-0.19l-0.13,-0.3l-0.02,-0.13l0.04,-0.03l-0.4,-0.51l-0.46,0.15l-0.15,-0.57l-0.34,-0.13l-0.19,-0.37l-0.1,-0.04l0.08,-0.06l0.28,-0.07l-0.02,-0.72l-0.26,-0.07l-0.22,0.02l-0.82,0.24l0.34,-0.16l0.36,-0.47l0.04,-0.27l-0.03,-0.27l-0.19,-0.26l-0.17,0.06l0.06,-0.15ZM202.04,460.79l0.03,-0.05l0.03,0.07l-0.01,-0.01l-0.05,-0.01ZM202.39,461.11l0.07,0.01l-0.0,0.06l-0.06,-0.05l0.0,-0.02ZM201.99,459.07l0.0,-0.0l0.0,0.0l-0.0,0.0ZM200.31,452.57l0.09,0.06l0.03,0.03l-0.13,0.03l0.01,-0.12ZM199.87,453.94l0.07,-0.03l0.37,0.05l-0.0,0.18l-0.15,0.04l-0.29,-0.23ZM195.6,452.13l-0.15,-0.18l0.24,0.02l0.12,-0.12l0.1,0.05l0.03,0.13l-0.08,0.14l-0.27,-0.05ZM197.53,452.12l0.09,-0.37l-0.06,-0.31l-0.39,-0.28l-0.01,-0.17l-0.36,-0.16l0.92,0.22l0.44,0.18l0.06,0.11l-0.25,0.12l0.0,0.4l0.05,0.28l0.12,0.23l0.16,0.14l-0.01,0.18l0.36,0.24l0.07,0.1l-0.22,0.0l-0.14,-0.11l-0.34,-0.03l-0.36,0.26l0.02,-0.16l-0.14,-0.23l0.11,0.01l0.0,-0.07l-0.02,-0.17l-0.11,-0.18l0.02,-0.2ZM198.73,453.22l-0.02,0.02l0.01,-0.03l0.01,0.01ZM199.19,451.81l-0.14,-0.26l-0.14,-0.11l0.04,-0.22l0.12,-0.0l0.26,0.23l-0.13,0.15l-0.01,0.21ZM188.93,446.97l0.38,-0.64l-0.54,-0.48l0.35,-0.18l-0.09,-0.34l0.08,0.03l0.46,-0.17l0.08,-0.25l0.12,-0.07l0.25,0.17l0.21,0.02l0.07,0.06l-0.03,0.04l-0.41,0.03l-0.17,0.06l-0.02,0.21l-0.15,-0.02l-0.43,0.44l0.24,0.37l0.09,0.04l0.09,0.13l0.19,0.12l0.57,0.18l0.17,0.09l0.13,0.14l-0.47,-0.26l-0.29,-0.07l-0.42,0.56l0.09,0.16l-0.05,0.09l0.07,0.1l-0.16,-0.19l-0.2,-0.06l-0.11,-0.21l-0.1,-0.07ZM190.97,445.99l0.09,-0.16l0.27,-0.17l0.7,0.08l-0.48,0.09l-0.03,0.45l-0.56,-0.29ZM192.57,447.43l0.03,0.22l0.13,0.3l0.0,0.17l-0.18,-0.01l-0.71,-0.45l0.15,-0.01l0.19,-0.11l0.39,-0.12ZM192.79,449.92l0.02,0.11l0.1,0.1l0.08,0.35l0.1,-0.04l0.06,0.1l-0.06,-0.01l-0.01,0.06l0.05,0.44l0.15,0.34l0.03,0.39l0.22,0.5l0.02,0.47l-0.16,0.05l-0.04,0.29l0.05,0.25l0.08,0.14l0.03,0.32l-0.03,0.1l0.05,0.21l-0.58,-0.9l0.14,-0.06l0.16,-0.3l0.17,-0.18l0.07,-0.44l-0.38,-0.24l-0.14,0.01l-0.0,-0.1l-0.17,-0.22l-0.19,-0.09l-0.24,0.08l-0.26,-0.37l-0.16,0.03l-0.01,-0.12l0.44,-0.21l0.06,-0.35l-0.03,-0.1l-0.28,-0.27l-0.23,-0.02l0.17,-0.22l-0.26,-0.37l-0.14,-0.05l-0.28,-0.38l-0.08,0.01l-0.01,-0.19l0.28,-0.14l0.01,0.11l0.61,0.11l-0.01,0.06l0.24,0.36l0.07,0.23l0.3,0.21ZM189.68,447.75l0.18,0.25l0.1,-0.02l0.02,0.12l-0.39,-0.26l0.09,-0.09ZM190.19,448.37l0.06,0.01l-0.05,0.02l-0.02,-0.03ZM190.68,447.0l0.24,0.08l0.05,0.12l-0.23,-0.14l-0.07,-0.06ZM148.81,435.84l0.0,0.03l-0.02,-0.0l0.01,-0.03ZM130.34,445.32l0.4,-0.36l-0.1,-0.21l0.41,-0.02l-0.1,0.37l-0.16,-0.09l-0.35,0.28l-0.02,0.08l-0.08,-0.04ZM131.25,444.46l0.01,-0.13l-0.12,-0.41l0.21,-0.01l0.05,-0.06l0.06,0.29l0.32,0.23l0.19,-0.03l0.05,0.05l-0.08,0.34l-0.12,0.0l-0.35,-0.38l-0.22,0.1ZM124.41,449.07l0.06,-0.22l0.11,-0.08l0.0,-0.24l0.06,0.02l0.13,-0.09l0.27,0.02l0.06,-0.12l0.41,-0.18l-0.03,-0.15l0.03,-0.04l0.29,-0.09l0.09,0.03l-0.14,0.15l0.3,0.41l0.39,0.03l0.11,0.42l0.11,0.15l0.18,0.12l0.2,0.3l0.22,0.17l-0.38,0.14l-0.09,0.08l-0.09,-0.07l-0.31,-0.03l-0.13,-0.08l-0.51,-0.06l-0.49,0.03l-0.25,0.08l-0.3,-0.52l-0.17,-0.12l-0.15,-0.04ZM127.65,449.83l0.11,-0.02l0.01,0.22l-0.12,-0.2ZM128.34,449.53l-0.21,-0.01l0.0,-0.29l-0.12,-0.14l-0.26,-0.16l-0.18,-0.34l-0.01,-0.07l0.19,-0.03l0.08,-0.28l0.4,-0.11l0.1,-0.25l0.27,-0.01l0.07,-0.2l0.24,0.0l0.13,-0.1l0.28,0.12l0.39,-0.6l0.01,-0.1l0.17,0.02l0.02,0.19l0.18,0.26l0.39,0.14l0.17,-0.06l0.17,-0.14l0.08,-0.35l0.21,0.0l0.19,-0.16l0.08,-0.14l0.21,-0.01l-0.35,0.37l0.04,0.5l0.29,0.09l0.22,0.41l-0.18,0.05l-0.14,-0.09l-0.24,-0.01l-0.24,-0.14l-0.72,-0.07l-0.26,0.03l-0.07,0.03l-0.01,0.17l-0.38,0.35l-0.06,0.32l-0.15,-0.04l-0.31,0.33l0.01,0.28l-0.67,0.25ZM127.66,447.01l-0.24,-0.06l-0.25,-0.02l0.1,-0.1l0.21,-0.09l0.17,0.14l0.0,0.13ZM80.59,434.8l0.2,-0.04l0.94,0.12l0.31,-0.04l0.29,-0.24l0.09,-0.26l0.12,-0.05l0.27,0.05l0.37,-0.26l0.13,-0.15l0.14,0.23l0.28,-0.08l0.27,-0.15l0.35,0.1l0.07,0.18l0.16,0.05l0.35,0.04l0.23,-0.03l0.19,-0.1l0.08,0.05l0.05,0.31l-0.08,0.3l0.26,0.52l-0.09,0.03l0.11,0.24l-0.18,0.12l-0.01,-0.04l-0.27,0.1l-0.09,-0.06l-0.39,-0.01l-0.07,0.04l0.01,0.12l-0.19,0.08l-0.06,-0.05l-0.32,-0.01l-0.2,0.04l-0.13,0.09l-0.39,-0.12l-0.54,0.01l-0.19,-0.13l-0.21,-0.05l-0.17,-0.13l-0.67,-0.3l0.0,-0.11l-0.06,-0.04l-0.21,-0.03l-0.03,-0.04l-0.24,0.06l-0.09,-0.05l-0.12,-0.17l-0.23,-0.14ZM84.92,464.82l0.0,-0.0l0.0,0.02l-0.0,-0.0l-0.0,-0.01ZM81.67,467.52l-0.0,-0.07l0.0,-0.03l0.0,0.0l-0.01,0.09ZM82.43,467.18l0.03,-0.05l0.06,-0.02l-0.06,0.06l-0.03,0.01ZM82.59,467.01l0.01,0.02l-0.04,0.03l0.03,-0.06ZM82.55,466.45l-0.09,-0.1l-0.35,-0.05l-0.5,-0.19l-0.3,-0.03l0.42,-0.19l-0.06,-0.0l0.42,-0.02l0.12,0.06l0.02,0.24l0.33,0.18l-0.02,0.1ZM75.57,469.7l-0.03,-0.15l0.16,-0.14l0.12,-0.08l0.17,0.04l0.16,-0.03l-0.19,0.25l-0.39,0.11ZM76.94,468.55l-0.05,-0.3l0.33,-0.25l0.45,-0.11l0.33,0.15l0.01,0.05l-0.3,0.11l-0.48,0.29l-0.28,0.06ZM65.05,416.31l0.1,-0.13l-0.01,0.05l0.32,0.19l-0.08,0.1l0.26,0.13l0.8,-0.07l0.32,0.06l0.07,0.09l0.25,0.06l-0.27,0.09l-0.17,0.13l-0.3,0.08l-0.11,0.07l0.04,0.07l-0.06,0.05l-0.35,0.15l-0.16,-0.03l-0.19,-0.1l-0.41,-0.1l-0.15,-0.2l-0.06,-0.18l0.02,-0.26l0.14,-0.26ZM68.08,416.71l0.42,-0.21l0.21,-0.17l0.31,-0.03l0.3,-0.15l0.14,0.05l0.26,-0.01l0.4,0.3l0.22,0.07l-0.07,0.2l0.07,0.47l0.62,0.09l0.33,0.15l0.07,0.09l0.21,0.05l0.45,-0.01l0.11,0.23l0.14,0.14l0.21,0.1l0.38,0.04l0.36,-0.08l0.12,0.13l-0.33,0.12l-0.28,0.17l-0.01,0.11l-0.4,0.22l-0.16,0.21l-0.32,-0.34l-0.28,-0.19l-0.46,-0.15l-0.03,0.02l-0.24,-0.12l-0.12,-0.12l-0.18,-0.01l-0.08,-0.2l-0.14,-0.17l-0.37,-0.15l-0.42,-0.3l-0.77,-0.3l-0.4,-0.06l-0.28,-0.2ZM74.42,418.15l0.04,0.01l0.45,0.07l-0.06,0.08l-0.23,-0.01l-0.26,-0.1l0.06,-0.06ZM56.48,473.36l-0.0,-0.01l0.03,0.01l-0.02,-0.0ZM47.78,475.84l0.0,-0.0l0.0,0.0l-0.0,0.0ZM11.64,470.76l-0.08,-0.02l-0.06,-0.11l0.37,-0.01l-0.23,0.14Z", "name": "Alaska"}, "US-NJ": {"path": "M766.67,187.23l0.54,-0.39l0.22,-0.71l0.59,-0.6l0.07,-0.61l0.72,-0.81l1.36,-0.67l2.71,-0.64l0.7,-0.57l0.08,-0.58l-0.16,-0.2l0.49,-0.19l0.76,-1.04l1.53,-1.1l2.83,-1.23l0.35,-0.52l-0.24,-0.87l-3.18,-3.16l-0.43,-1.01l-0.46,-0.16l-0.43,0.15l-0.34,-0.36l-0.22,-1.6l-0.31,-0.65l-1.03,-0.42l-0.45,0.04l-0.13,-0.5l0.08,-2.41l0.27,-0.31l0.88,-0.27l0.91,-1.81l-0.12,-0.52l-1.1,-1.42l1.55,-0.9l0.86,-1.19l0.59,-0.38l0.86,-1.08l0.61,-1.63l0.96,-0.94l1.03,-0.38l11.9,6.54l-0.69,2.02l-0.68,1.04l-0.35,1.34l-0.65,0.53l-0.05,-0.22l-0.59,-0.24l-0.43,0.28l-0.31,0.61l-0.57,0.45l-0.51,1.35l-0.6,0.81l-0.16,1.28l0.45,0.71l0.92,0.35l1.23,-0.07l2.14,0.78l0.11,1.58l-1.32,3.57l0.12,0.43l-0.57,0.23l-0.14,0.42l0.18,0.29l-0.86,0.48l-0.06,0.29l0.32,0.31l-0.3,0.36l0.2,0.69l-1.05,2.95l0.36,0.58l-0.6,0.92l-1.5,1.22l-0.33,0.7l-0.82,-0.16l-0.66,0.31l0.1,1.09l0.28,0.36l-0.61,0.06l-0.34,0.26l-0.39,1.07l0.73,0.58l-0.29,0.14l-0.04,-0.39l-0.44,-0.26l-0.51,0.08l-0.77,1.1l-1.09,0.1l-0.49,0.43l0.28,0.67l0.61,0.2l-0.82,0.77l-0.6,1.13l-0.77,0.38l0.03,0.52l0.25,0.14l-1.09,0.99l-0.15,0.73l-1.71,0.95l0.19,-1.22l0.8,-1.6l0.11,-0.71l-0.33,-0.84l-0.75,-0.44l-1.06,0.03l-0.66,-0.45l-1.56,0.39l-0.11,-0.63l-1.01,-0.71l-0.23,-0.41l-0.9,-0.18l-0.42,-0.7l-0.65,-0.1l-2.4,-2.27l0.35,-1.38l-0.66,-0.94Z", "name": "New Jersey"}, "US-ME": {"path": "M836.32,80.6l0.84,-0.72l0.37,-0.01l0.86,1.81l0.75,0.26l0.42,-0.41l0.05,-0.66l0.57,-0.64l0.02,-1.58l0.18,-0.35l0.29,-0.05l1.27,0.8l0.81,-0.16l0.37,-0.39l-0.08,-0.75l-1.01,-0.73l-0.22,-0.57l0.61,-1.13l1.45,-1.47l2.72,-1.34l0.33,-0.88l-0.21,-0.9l1.49,-1.08l0.86,-1.18l0.07,-0.92l-0.87,-0.56l0.38,-1.21l-0.22,-0.45l0.79,-0.63l0.17,-0.57l-0.12,-0.7l-0.46,-0.63l0.66,-1.42l0.58,-0.46l0.15,-0.84l1.81,-1.32l1.03,-5.53l11.67,-14.61l2.37,0.45l-0.13,1.67l0.2,1.4l0.41,0.53l2.29,1.21l2.37,-0.94l1.93,-0.21l0.9,-0.72l0.93,-0.39l0.59,-0.02l0.68,0.29l0.79,-0.21l0.72,-1.15l0.55,-0.13l1.37,0.45l0.65,0.69l2.49,1.62l0.79,1.16l1.13,1.12l0.82,0.48l0.37,21.66l0.38,0.74l-0.54,0.68l-0.05,0.34l0.37,0.76l-0.57,1.14l0.08,1.3l0.5,0.61l0.71,0.3l0.34,-0.1l0.89,0.82l0.9,0.37l2.54,0.28l0.05,0.83l-0.9,0.66l-0.15,0.41l0.22,0.85l0.76,1.2l-0.59,1.45l-0.05,0.86l2.04,2.24l0.92,0.21l0.71,-0.49l0.12,-0.43l1.09,0.57l0.25,0.59l0.69,0.71l0.02,0.73l0.86,1.14l-0.11,0.38l-0.47,-0.3l-0.48,0.24l-0.1,0.69l-0.68,-0.37l-0.44,0.24l-0.06,0.65l0.58,0.67l0.2,0.91l0.39,0.31l0.39,-0.31l0.06,-0.37l0.43,-0.07l0.01,0.24l0.61,0.32l0.54,-0.62l0.18,0.38l-0.56,0.57l-0.56,-0.01l-0.86,1.12l-1.38,1.21l-0.6,-0.24l-0.43,0.29l-0.2,-1.06l-0.65,-0.19l-0.46,0.36l-0.59,-0.13l-0.16,0.46l0.26,0.83l-0.37,-0.57l-0.35,-0.1l-0.5,0.5l0.07,0.46l-1.03,-0.62l-0.43,0.13l-0.61,0.53l-0.11,0.46l0.39,0.24l-0.12,0.83l-0.2,0.09l-0.19,-0.58l-0.46,-0.21l-0.52,0.26l-0.57,0.87l0.05,-1.42l-1.06,-0.34l-0.89,0.42l-0.85,1.19l0.22,0.7l-0.4,-0.09l-0.46,0.31l-0.49,-0.61l-0.38,0.17l-0.18,0.39l-0.46,0.08l-0.12,0.66l0.69,0.7l-0.36,0.08l-0.4,0.7l-0.49,-0.83l-0.06,-1.22l-0.83,-0.71l-0.43,0.08l-0.3,-0.48l-0.59,0.14l-0.14,0.27l-0.39,-0.4l-0.72,-0.16l-0.43,0.3l-0.09,0.36l0.23,0.46l0.33,0.14l-0.06,0.23l-0.5,-0.2l-0.63,0.2l-0.31,0.54l-0.14,-0.98l-0.47,-0.33l-0.62,-0.03l-0.36,0.57l0.21,0.79l-0.26,-0.04l-0.42,0.36l-0.57,-0.09l-0.44,0.18l0.44,1.19l-0.26,0.9l0.29,0.63l-0.8,-0.63l-0.96,-0.08l-0.92,-0.67l0.1,-0.72l0.37,0.12l0.46,-0.26l-0.21,-0.96l-0.57,-0.34l-0.38,0.18l0.53,-1.4l-0.02,-0.58l-0.3,-0.32l-1.1,-0.09l-0.6,1.64l-0.4,0.01l-0.87,0.64l-1.09,0.42l-0.15,0.51l0.7,1.52l-0.9,0.58l-1.42,3.17l0.03,1.02l0.27,0.3l-0.71,0.29l-0.2,0.52l-0.66,0.31l-0.4,-0.4l-0.3,0.02l-0.73,0.67l-0.57,-0.24l-0.02,-1.06l-0.61,-0.39l-0.79,0.7l-0.15,0.61l-0.58,0.36l-0.65,2.04l-0.57,-1.09l0.51,-0.94l-0.03,-0.62l-0.68,-0.19l-0.17,0.17l-0.74,1.64l-0.32,-0.28l0.61,-1.2l-0.33,-0.54l-0.77,0.22l-1.68,2.32l-0.14,-1.66l0.55,-0.83l-0.02,-0.47l-0.71,-0.17l-1.67,1.54l-0.2,0.52l0.33,0.64l0.75,-0.03l0.22,1.85l-0.07,-0.54l-0.43,-0.36l-0.68,0.07l-0.32,0.3l0.05,0.24l-1.27,-0.48l-3.0,2.03l-1.09,1.46l0.08,0.53l-0.42,-0.0l-0.41,0.4l0.36,0.54l0.92,0.07l0.05,0.75l-0.8,0.04l-0.32,0.29l-0.37,-0.16l-0.63,0.33l-0.46,0.85l0.17,1.33l-0.23,0.47l-1.12,0.85l-1.06,0.25l-0.7,0.77l-0.5,1.07l0.12,0.84l-1.19,2.17l-0.64,-0.5l-0.29,0.03l-0.26,0.39l-0.74,-0.89l0.19,-0.93l-0.19,-0.76l-0.77,-0.56l-1.61,-2.2l0.31,-3.04l-1.96,-33.02ZM854.36,108.58l-0.04,-0.01l0.11,-0.35l0.0,0.2l-0.08,0.16ZM855.7,108.79l0.22,0.68l-0.19,0.34l-0.21,-0.46l0.19,-0.56ZM858.89,106.86l0.07,0.68l-0.13,0.1l-0.31,-0.24l0.37,-0.55ZM871.89,98.35l-0.11,0.07l0.03,-0.12l0.07,0.05ZM877.72,99.01l0.38,-0.86l0.61,-0.45l-0.02,-0.41l0.53,-0.28l0.64,0.08l1.0,1.49l-1.09,0.39l-0.61,-0.3l-0.39,0.31l0.11,1.22l-0.82,-0.42l-0.02,-0.54l-0.33,-0.25ZM873.34,101.55l0.01,-0.47l0.33,-0.44l-0.04,-0.4l0.45,0.42l-0.4,0.14l-0.2,0.56l0.15,0.25l-0.3,-0.05ZM871.03,103.63l0.09,0.02l0.34,0.05l-0.24,0.22l-0.19,-0.29Z", "name": "Maine"}, "US-MD": {"path": "M705.36,194.02l0.15,-8.34l18.87,0.0l-0.75,0.78l-0.87,-0.11l-1.58,0.37l-0.09,0.62l-0.42,0.35l0.07,0.63l-0.97,-0.12l-0.73,0.2l-1.35,-0.25l-0.84,-0.47l0.18,-0.2l-0.19,-0.56l-0.42,-0.38l-0.51,-0.07l-0.83,1.38l-2.03,2.0l-1.17,-0.57l-1.06,0.32l-0.63,0.95l-1.84,1.27l-0.54,0.77l-0.89,0.21l-1.52,1.25ZM726.9,185.68l35.38,0.01l1.19,22.74l0.4,0.37l7.95,0.01l-0.15,0.26l0.76,0.49l-0.12,0.51l0.28,0.35l0.41,0.08l-0.1,0.21l-0.63,1.06l-0.49,-0.24l-0.86,0.54l-0.78,2.07l-0.56,0.03l-0.48,0.48l-0.37,1.16l-3.55,0.43l-0.51,0.52l-1.72,-0.16l-0.89,0.34l-0.23,-0.44l0.12,-0.24l0.5,-0.14l1.21,-1.3l-0.26,-0.61l-0.31,-0.02l0.05,-0.49l-0.27,-0.28l-2.11,0.01l1.55,-0.68l0.01,-0.73l-1.13,-0.36l0.87,-1.73l0.04,-0.85l-0.5,-0.21l-0.37,0.13l-0.84,1.25l-0.15,-0.55l-0.56,-0.22l-0.4,0.21l-0.88,1.1l0.25,0.87l-0.47,-0.64l-0.46,-0.17l-1.19,-1.51l-0.26,-0.17l-0.62,0.16l-0.38,-0.55l-0.1,-0.24l0.38,-0.17l0.3,-0.92l0.8,-0.31l0.31,-1.1l1.58,0.5l0.66,-0.03l0.6,-0.25l0.38,-0.59l0.19,-0.7l-0.16,-0.57l-0.39,-0.14l-0.78,0.94l-0.37,-0.01l-0.43,-0.28l-0.29,-0.45l0.13,-0.3l-0.43,-0.4l-0.49,0.06l-0.07,-0.54l-0.69,-0.09l0.07,-0.24l0.97,0.0l0.55,-0.7l-0.03,-0.54l-0.72,-0.15l-0.27,0.29l-0.07,-0.13l0.03,-0.21l0.96,-0.5l-0.08,-0.71l-0.42,-0.16l0.01,-0.36l-0.35,-0.36l-0.35,0.05l-0.31,-0.44l0.83,-0.45l0.2,-1.19l1.03,-1.09l0.15,-0.78l-0.45,-0.11l-0.79,0.41l-0.43,-0.26l-0.77,0.6l-0.47,-0.57l1.22,-2.67l0.48,-0.14l0.37,-0.61l4.06,-0.1l0.28,-0.67l-0.4,-0.35l-2.11,-0.14l0.85,-0.73l1.3,0.26l0.46,-0.4l-0.21,-0.47l-0.46,-0.26l0.45,-0.53l0.33,-0.9l-0.51,-0.49l-0.53,0.22l-0.86,0.91l0.3,-1.01l-0.48,-0.49l-0.46,0.17l-0.42,0.57l-1.62,0.21l-0.67,1.28l0.07,0.43l0.63,0.39l-1.63,1.13l0.21,-1.27l-0.51,-0.54l-0.72,0.46l-0.28,1.12l-0.68,-0.35l-1.19,0.28l-0.15,0.71l0.72,0.33l-0.31,0.32l-0.81,0.02l-0.12,0.25l-0.39,-0.12l-0.48,0.56l0.67,1.13l-1.43,-0.96l-1.23,0.22l-0.01,0.73l1.27,0.78l0.61,0.93l0.67,0.06l0.26,0.58l-0.78,-0.26l-1.35,0.88l0.11,0.78l1.08,0.88l-0.49,0.02l-0.32,0.35l0.01,0.42l0.39,0.61l-0.34,0.41l0.32,1.34l-0.55,0.73l0.07,0.54l0.52,0.68l0.08,3.03l0.37,0.82l1.46,1.7l0.18,0.62l-0.52,0.01l-0.4,-0.72l-1.23,-0.54l-1.17,-1.33l-0.46,-2.75l-0.15,-0.45l-0.38,-0.27l-0.44,0.57l0.34,3.41l0.74,1.31l1.65,0.99l0.69,1.1l0.53,0.24l0.83,-0.1l-0.25,0.83l0.16,0.49l0.97,1.09l-0.15,0.76l-0.66,-0.4l-0.16,-1.11l-0.48,-0.53l-0.44,-0.05l-0.22,0.39l0.09,0.59l-0.14,-0.15l-0.44,0.13l-0.41,-0.8l-1.11,-0.82l-2.26,0.03l-0.44,-0.64l-0.3,-1.33l-0.99,-0.85l-0.48,0.05l-0.09,0.47l0.6,1.55l-0.14,-0.08l-1.16,-1.25l-0.45,-1.34l-0.54,-0.82l-0.69,0.24l-0.3,0.66l-0.16,-0.61l-0.72,-0.0l-0.25,0.17l0.09,0.72l-0.19,0.36l-0.77,0.27l-0.35,-0.53l-0.14,-0.79l0.41,-1.25l0.8,-0.32l0.1,-0.68l0.7,-0.18l0.53,-1.24l1.19,-0.62l0.24,-0.84l-0.21,-0.78l1.6,-1.48l-0.0,-0.59l-2.07,-1.88l-0.54,0.0l-0.8,0.74l-1.61,-0.57l-0.29,-0.77l-0.9,-0.63l-2.18,-0.42l-0.89,-0.9l0.83,-0.95l-0.16,-0.92l-1.01,-0.49l-0.67,-0.71l-1.38,-0.4l-1.07,-0.06l-0.25,-0.22l0.16,-1.04l-0.36,-0.52l-0.44,-0.17l0.34,-0.89l-0.43,-0.4l-0.42,0.05l-0.11,-0.52l-0.29,-0.22l0.27,-0.53l-0.3,-0.64l-0.61,-0.24l-1.79,0.2l-1.53,-1.32ZM762.54,214.51l-0.03,0.03l-0.03,0.01l0.01,-0.04l0.05,-0.01ZM759.92,210.95l-0.03,0.08l-0.05,-0.04l0.08,-0.03ZM755.71,205.81l-0.01,0.01l0.01,-0.01l0.0,0.0ZM755.2,199.06l-0.31,0.34l-0.53,0.05l0.32,-1.02l0.58,0.49l-0.06,0.15ZM751.61,197.48l0.11,0.02l0.84,0.39l-0.39,0.12l-0.56,-0.53ZM755.64,202.25l-0.24,0.12l-0.55,-0.29l0.35,-0.39l0.43,0.56Z", "name": "Maryland"}, "US-AR": {"path": "M471.67,293.63l0.69,-30.28l-2.73,-19.4l68.75,0.0l0.55,1.32l0.82,0.61l-0.06,1.37l-0.73,0.37l-0.27,0.72l-1.35,0.64l-0.35,0.81l-0.79,0.37l-1.3,1.99l-0.05,0.65l0.48,0.29l9.79,-0.25l0.57,0.71l-0.96,0.15l-0.58,0.75l0.2,0.53l0.6,0.32l-3.35,1.79l-0.07,0.78l0.58,0.84l-0.45,0.4l-0.14,0.5l0.41,0.74l-1.25,0.46l-0.25,1.17l-1.47,1.57l-0.05,1.35l0.51,2.49l-0.12,0.16l-0.93,-0.1l-0.35,0.21l-0.58,1.31l-1.41,0.63l-0.1,0.52l0.59,0.78l-0.01,0.44l-1.03,0.83l-1.88,0.75l-0.26,0.56l0.27,0.78l-0.14,0.15l-1.06,-0.08l-0.45,0.53l-0.46,1.51l0.27,1.31l-0.24,2.39l-1.16,0.74l-1.38,0.0l-0.16,0.49l0.21,0.75l-0.19,0.29l-0.84,0.16l-0.65,1.35l-1.37,0.82l-0.12,0.81l0.23,0.35l0.91,0.41l-0.06,0.42l-1.06,0.13l-2.05,0.82l-0.05,0.63l0.77,0.69l-0.47,0.88l0.34,1.1l-0.91,0.31l-1.91,1.97l0.41,0.69l0.8,0.44l-0.03,0.34l-1.09,0.27l-0.2,0.45l0.39,0.73l1.3,0.9l-0.08,1.31l-0.58,0.74l-0.14,0.75l0.22,0.34l0.87,0.39l0.23,1.68l-1.0,0.67l-0.12,1.64l-44.02,0.05l-0.09,-9.07l-1.01,-0.81l-0.8,0.08l-0.68,-0.31l-0.84,0.25l-1.03,-0.32l-0.55,0.52l-0.32,-0.01l-0.45,-0.39l-0.52,-0.02l-0.61,-0.92Z", "name": "Arkansas"}, "US-MA": {"path": "M809.43,142.43l-0.35,-0.36l-10.34,-0.4l-0.15,-0.17l3.69,-12.11l30.22,0.94l1.94,-1.08l0.75,-1.12l0.99,-0.04l0.87,-0.69l1.45,-0.56l1.26,0.27l-0.78,0.3l0.22,0.62l0.93,0.61l-0.34,0.42l0.18,0.83l0.79,0.54l-0.13,0.25l0.28,0.33l0.86,0.19l0.23,0.26l-0.24,0.34l-1.74,0.35l-1.14,0.52l-0.38,0.9l0.33,0.26l-0.54,0.12l-0.29,0.42l-0.56,0.28l-0.22,0.43l0.07,0.5l-0.98,0.29l-0.18,0.24l0.12,1.39l1.13,0.73l0.08,0.47l0.25,0.18l1.03,-0.23l0.37,0.11l0.49,-0.41l1.1,0.39l0.57,0.57l0.01,0.58l1.23,1.59l-0.41,0.9l-0.4,0.14l-0.08,0.64l1.22,1.07l1.12,0.18l0.26,1.09l-0.14,0.98l0.64,0.85l1.1,0.67l1.37,0.28l0.3,0.42l1.02,0.09l4.1,-1.44l0.35,-0.39l0.46,0.19l-0.04,1.52l-3.48,0.35l-1.11,0.43l-0.13,-0.16l-1.85,0.36l-0.44,-0.23l-0.53,0.25l-0.77,1.05l-2.11,0.51l-0.03,-2.15l0.32,-0.34l0.16,-0.78l-0.42,-0.4l-0.56,0.19l-0.81,-0.33l-0.45,0.39l-0.05,0.76l-0.45,0.56l-0.38,-0.06l-0.89,0.74l-0.51,-0.34l-0.6,0.32l-0.37,0.96l0.02,0.56l-1.03,0.44l-0.37,-0.79l-0.44,-0.11l-0.26,0.41l-0.22,-0.04l-0.2,-0.9l0.14,-0.84l-0.28,-0.45l-0.51,-0.15l1.07,-1.83l-0.06,-0.45l-0.44,-0.11l-0.41,0.21l-0.69,1.11l-0.7,-0.01l-1.11,-0.87l-0.17,-0.23l0.07,-1.63l-0.14,-0.26l-0.53,-0.17l-0.1,-1.89l-0.39,-0.37l-6.25,0.09l-0.21,-0.2l-14.89,-0.21l-0.41,0.36ZM842.82,131.33l-0.03,-0.02l0.08,-0.66l0.34,0.25l-0.39,0.42ZM853.25,145.65l-0.14,-0.56l0.02,-0.01l0.18,0.56l-0.05,0.01ZM852.83,144.13l-0.71,-0.3l-0.37,-1.21l0.95,1.1l0.13,0.41ZM849.72,141.8l-0.05,0.07l-0.07,-0.09l0.12,0.02ZM851.6,156.68l1.07,-0.67l0.15,0.25l0.05,0.23l-0.39,0.19l-0.89,0.0ZM840.6,155.31l0.17,-0.0l0.1,-0.02l-0.13,0.12l-0.14,-0.1ZM841.44,154.95l0.52,-0.77l1.12,-0.74l0.05,0.23l0.48,0.05l-0.04,0.34l0.2,0.17l0.63,0.18l0.04,0.23l-2.02,0.04l-0.98,0.27Z", "name": "Massachusetts"}, "US-AL": {"path": "M566.41,349.72l-1.28,-25.24l6.18,-52.37l0.02,-0.28l-0.89,-0.69l-0.43,-0.73l39.27,0.42l6.26,35.66l0.47,1.16l0.05,0.87l0.77,1.39l0.26,1.55l1.54,2.21l0.53,1.5l-0.38,1.63l1.34,1.11l-0.25,0.4l-0.47,0.04l-0.28,0.55l-0.55,0.15l-0.37,0.4l-0.5,1.78l0.02,1.17l-0.93,1.67l-0.36,1.42l0.53,2.46l0.8,1.33l0.22,1.27l-0.34,1.01l0.1,0.51l-0.28,0.43l-0.2,1.91l-0.31,0.6l0.13,1.67l0.97,1.11l0.63,1.6l-40.05,0.01l-0.47,0.48l-0.0,0.91l-0.39,0.89l0.01,0.6l1.9,2.43l1.51,0.93l-0.58,2.02l0.55,1.63l-0.87,1.13l-1.07,0.63l-0.87,-0.69l-0.4,0.44l0.36,1.13l-2.09,0.46l0.13,-0.38l-0.19,-0.57l-0.81,-0.81l0.15,-0.58l-0.14,-0.34l-0.48,-0.24l-0.52,0.41l-0.38,-0.33l-0.34,-0.98l0.5,-1.38l-0.57,-1.68l-0.37,-0.44l-0.64,-0.24l-0.17,-0.69l-0.49,-0.22l-0.43,0.56l-0.52,1.94l-0.37,0.61l-0.39,1.8l-0.13,2.03l-0.32,-0.02l-0.22,-0.57l-0.45,-0.16l-1.32,-0.39l-0.3,0.15l-0.38,-0.24l-0.67,0.13Z", "name": "Alabama"}, "US-MO": {"path": "M451.6,169.51l25.16,0.47l16.16,-0.13l21.04,-0.68l0.66,1.1l0.82,0.4l0.26,0.5l1.07,0.66l0.2,0.63l0.96,0.79l-0.74,1.99l-0.13,1.76l0.43,3.1l0.76,1.25l-0.11,1.3l0.92,1.25l0.31,1.34l0.38,0.54l3.88,3.24l0.84,1.48l3.63,2.44l0.63,0.66l0.53,0.98l0.11,1.35l0.38,0.67l-0.22,0.53l0.28,1.59l0.76,1.43l0.65,0.67l0.93,0.21l0.83,-0.4l0.89,-1.07l0.54,-0.11l0.77,0.41l1.39,0.3l1.47,0.76l0.66,0.64l-1.06,1.5l0.02,1.87l-2.8,5.39l-0.09,0.89l0.48,1.66l1.84,1.98l0.87,0.54l1.17,1.18l1.71,1.02l1.31,0.2l1.38,1.2l1.65,0.81l1.15,1.84l1.74,0.83l0.18,1.06l-0.1,1.35l1.14,1.91l0.11,0.57l-1.15,1.42l0.03,1.26l0.61,0.31l0.23,0.85l0.97,1.39l0.18,1.1l0.3,0.32l1.65,0.92l0.55,-0.25l0.1,-0.45l0.59,0.92l0.38,0.16l0.58,-0.12l-0.07,1.4l-0.45,0.88l0.31,1.31l-1.32,2.95l-0.44,0.01l-1.1,-1.03l-0.61,0.04l-0.45,0.64l-0.6,2.0l-0.41,0.44l0.16,-0.71l-0.42,-0.97l-0.85,-0.25l-0.75,0.5l-0.08,0.92l0.38,0.53l-0.1,0.54l0.38,1.12l-0.18,0.24l-1.11,0.21l-0.23,0.4l0.09,0.5l0.5,0.62l-1.35,0.14l-0.2,0.62l1.12,1.63l-0.81,0.5l-0.76,1.63l-9.37,0.24l1.07,-1.61l0.81,-0.4l0.25,-0.69l1.34,-0.63l0.34,-0.75l0.57,-0.24l0.33,-0.48l0.01,-1.92l-0.87,-0.72l-0.1,-0.61l-0.89,-1.08l-69.04,0.0l0.08,-47.55l-0.95,-0.61l-1.11,-0.08l-1.35,-0.66l-0.14,-0.78l-0.68,-0.52l-0.27,-0.57l0.0,-0.79l-0.29,-0.55l-0.49,-0.1l-0.26,-0.48l-1.01,-0.59l-0.54,-0.92l-0.63,-0.58l0.68,-0.37l0.14,-1.01l1.1,-0.99l0.13,-0.64l0.92,0.18l0.55,-0.33l0.16,-0.43l-0.25,-0.58l0.02,-0.96l-0.89,-0.63l0.01,-0.56l-0.3,-0.41l-1.09,-0.06l-1.27,0.75l-0.73,-0.61l-0.68,-0.17l-0.23,-0.42l-0.6,-0.26l-1.57,-1.39l-0.96,-0.27l0.21,-1.31l-1.13,-1.45l0.1,-0.89l-0.34,-0.33l-0.94,-0.18l-0.52,-0.73l-0.69,-0.25l-0.5,-2.01l-0.51,-0.84l0.03,-0.6l-0.38,-0.48l-0.77,-0.26l-0.03,-0.34Z", "name": "Missouri"}, "US-MN": {"path": "M428.9,7.99l28.82,0.0l0.08,1.07l0.6,0.7l0.9,0.44l1.91,-0.37l1.2,-1.29l0.91,-0.25l2.17,2.15l1.8,0.33l0.27,1.14l1.85,1.38l1.86,0.54l2.85,-0.23l0.28,0.22l0.09,0.57l0.66,0.42l5.47,0.31l0.39,0.24l0.47,1.5l0.69,0.59l4.57,-0.45l0.84,-0.55l0.13,-0.63l2.66,-0.58l4.24,0.25l1.46,0.75l3.55,0.85l-1.14,0.6l-0.06,0.82l0.48,0.44l0.71,0.13l1.45,-0.16l0.94,0.18l0.25,0.53l0.12,1.42l1.49,2.23l0.69,0.09l1.14,-0.63l-0.07,-1.37l0.18,-0.22l1.74,-0.29l1.18,0.06l0.23,0.13l0.55,1.41l0.55,0.56l2.04,0.88l1.61,0.29l0.49,0.53l-0.17,0.26l0.1,0.53l0.56,0.36l1.37,0.16l-0.06,0.28l0.42,0.52l1.5,-0.06l1.12,0.3l0.92,-0.4l1.49,-0.19l3.17,-2.1l2.83,-1.2l0.18,0.88l0.53,0.42l0.36,1.12l0.93,0.55l2.43,-0.41l0.85,0.41l0.72,-0.23l5.73,-0.4l0.58,0.22l1.21,1.63l1.23,0.66l0.59,0.05l1.8,-0.6l1.17,0.25l-0.81,0.73l-5.26,2.34l-6.95,1.97l-4.09,1.92l-2.49,2.06l-1.05,0.44l-7.72,7.28l-1.04,0.47l-1.25,1.32l-1.42,0.81l-0.78,0.8l-1.54,0.75l-3.09,2.12l-1.05,1.54l-0.6,0.35l-0.23,0.85l-0.83,-0.06l-0.49,0.46l-0.02,10.93l-0.59,0.44l-0.31,0.57l-1.06,-0.01l-0.6,0.69l-0.86,0.08l-0.68,0.69l-2.2,0.91l-1.1,1.6l-0.01,0.66l-1.9,2.01l-0.17,1.83l0.32,0.87l0.29,0.24l1.88,0.27l0.42,1.14l0.81,1.1l-0.67,1.62l-0.67,0.68l-0.22,0.76l-0.15,1.51l0.36,1.19l-0.81,1.06l0.48,1.31l0.19,1.46l-0.3,0.63l0.01,1.33l-0.61,1.15l0.1,0.5l1.39,0.9l1.65,1.64l0.68,0.38l2.98,0.55l0.83,0.75l0.87,1.34l2.82,0.64l2.27,1.85l2.07,3.29l2.46,1.76l0.64,0.23l1.42,0.0l1.0,0.7l0.85,0.15l0.68,1.23l0.99,0.49l0.17,0.32l0.09,1.77l0.55,1.17l-0.19,1.37l0.14,2.75l-80.36,0.02l-0.0,-34.0l-0.67,-1.19l-0.82,-0.73l-0.57,-0.35l-2.01,-0.43l-0.89,-1.71l-1.4,-1.61l0.21,-0.52l2.96,-1.99l1.08,-1.88l0.5,-2.2l-0.3,-1.41l0.3,-1.39l-0.12,-1.61l-0.48,-0.95l-0.1,-2.1l-1.77,-2.38l-0.09,-0.61l-0.34,-0.42l-0.15,-1.95l-0.64,-0.9l0.22,-1.47l-0.31,-1.37l0.23,-1.56l0.4,-0.82l-0.18,-0.55l-0.52,-0.28l-0.35,-0.9l-0.01,-3.28l-0.33,-1.79l0.11,-2.48l-0.41,-0.76l0.25,-1.27l-0.16,-0.97l0.11,-1.3l-0.38,-0.51l-0.25,-1.17l-0.89,-2.0l-0.52,-0.6l-0.39,-1.26l0.08,-1.11l-0.49,-0.5l-1.31,-3.47l-0.11,-1.45l0.22,-1.5l-0.43,-1.8l0.32,-1.02l-0.52,-2.16l0.86,-2.35l-0.13,-0.96l-1.85,-5.46ZM461.11,0.56l1.34,0.51l1.19,-0.06l0.22,0.35l-0.0,1.03l-0.44,0.83l-1.75,0.65l-0.15,-0.46l-0.41,-0.15l-0.01,-2.71Z", "name": "Minnesota"}, "US-CA": {"path": "M6.7,168.8l0.41,-1.17l0.54,0.28l0.53,-0.22l0.2,-1.06l0.51,-0.85l1.11,-0.47l0.41,-0.56l-0.32,-0.66l-0.88,-0.06l0.72,-2.53l-0.65,-1.25l-0.08,-0.71l1.09,-3.1l0.49,-2.8l-0.32,-1.54l0.13,-0.2l-0.17,-0.58l-0.32,-0.26l-0.04,-0.76l-0.52,-1.02l-0.04,-0.78l-0.74,-0.87l-1.0,-0.63l0.7,-1.32l0.05,-2.19l64.72,0.0l0.01,54.73l0.15,0.57l29.2,23.69l22.85,19.77l31.53,28.04l0.21,2.18l0.76,0.65l0.41,1.33l0.83,0.42l1.02,1.89l0.07,0.74l0.72,1.01l-0.12,0.51l0.17,0.64l3.1,2.06l0.65,0.5l0.07,0.33l-1.44,1.37l-2.51,1.37l-0.49,0.68l-0.28,1.04l-1.31,1.09l-0.2,0.77l0.41,0.72l-0.32,0.49l0.39,2.5l-0.41,0.61l-0.23,1.97l-0.65,0.71l-0.73,1.44l-1.33,0.29l-0.32,0.56l0.36,0.62l-0.29,1.14l0.6,0.82l0.14,0.9l-0.28,2.25l0.64,0.75l2.06,0.35l0.75,0.75l0.16,1.84l-0.87,0.72l-0.17,1.11l-1.96,-0.21l-1.0,0.62l-36.8,3.1l-0.01,-0.77l0.27,-0.1l0.2,-0.47l-0.32,-0.83l-0.62,-0.67l-0.97,-0.37l-0.46,0.08l-0.01,-0.86l-0.4,-0.75l0.42,-0.67l0.03,-0.53l-0.92,-3.28l-0.87,-1.72l-2.26,-2.89l-3.66,-2.66l-1.41,-1.35l-2.38,-1.29l-2.23,-2.05l-2.04,-0.36l-0.69,0.29l-0.28,0.86l-0.56,-0.44l-0.78,-0.04l-0.14,-0.17l0.38,-0.66l-0.13,-1.29l-0.73,-1.56l-1.2,-1.39l-0.98,-0.43l-3.8,0.54l-0.8,-0.38l-2.33,-0.5l-1.38,-0.76l-0.61,0.02l-1.05,-0.76l-0.86,-1.96l-0.91,-0.21l-1.83,-1.53l-2.18,-1.0l-1.15,-0.12l-0.78,0.16l-0.56,0.4l-1.15,-0.6l-1.07,0.22l-2.44,-1.01l-0.9,0.18l-1.45,-0.29l-4.2,0.43l-0.74,-1.12l-0.65,-0.51l-1.32,-0.31l0.67,-2.09l-0.46,-1.06l0.25,-1.67l-0.79,-0.96l0.62,-2.11l-0.19,-1.97l-1.12,-0.84l-1.14,0.03l-1.42,-0.74l0.03,-1.19l0.65,-0.22l0.16,-0.51l-0.84,-1.66l-0.73,-0.5l-1.42,-0.39l-2.3,-2.79l-1.82,-0.67l-0.84,-2.06l-0.68,-0.43l-1.22,-1.3l-0.22,-1.1l-0.55,-0.96l-1.19,-0.54l-1.24,-2.18l-0.53,-0.52l-2.11,-1.16l-0.3,-0.61l-0.47,-0.34l-0.49,-2.55l-0.39,-0.9l0.3,-0.23l0.09,-0.42l-0.18,-0.43l-0.53,-0.36l0.26,-0.45l0.58,0.38l0.69,-0.16l0.6,-0.83l0.21,-1.1l0.71,-0.16l0.06,-0.69l-0.46,-0.27l0.13,-1.04l-1.83,-2.69l-0.65,-0.26l-0.9,0.26l-1.79,-0.04l-1.13,-0.64l-1.3,-1.43l-1.03,-0.75l-1.15,-1.61l0.25,-2.02l-0.16,-0.95l-0.75,-1.85l-0.43,-0.46l-0.5,-0.08l-0.03,-0.89l0.38,-1.02l-0.36,-2.17l0.24,-0.53l0.95,-0.04l0.22,0.93l-0.2,1.69l0.31,0.78l1.34,0.83l0.49,-0.02l0.78,0.88l1.21,0.42l0.57,0.73l0.87,0.15l0.7,-0.33l-0.08,-0.67l-0.35,-0.5l-0.72,-0.29l-0.25,-0.4l-0.96,-2.79l-0.63,-0.48l0.04,-0.6l-1.5,-0.54l0.21,-0.92l-0.15,-0.86l-1.37,-0.99l0.49,-0.67l0.69,-0.11l0.95,-0.81l1.33,0.57l1.59,-0.6l5.43,0.88l0.53,-0.18l0.31,-1.21l0.56,-0.15l0.77,0.73l0.66,0.22l1.07,0.81l0.54,-0.38l-0.07,-0.36l-0.55,-0.68l-1.79,-1.22l-1.47,0.04l0.08,-0.45l-0.39,-0.47l-0.43,0.18l-0.72,0.98l-1.68,0.16l-0.36,0.31l-0.21,-0.38l-0.94,-0.1l0.1,-0.59l-0.18,-0.3l-0.86,-0.22l-0.83,0.42l-0.37,0.79l-0.88,0.51l-1.39,-0.46l-0.54,-0.62l-1.65,-0.86l-0.53,0.16l-0.42,0.58l-0.84,0.08l-0.38,0.47l0.11,1.57l0.28,0.55l-0.3,1.28l0.38,0.39l-0.22,0.6l0.14,0.44l-2.52,-1.88l-0.46,-0.02l-0.12,0.29l-0.85,-0.63l-0.43,-0.8l-1.32,-0.69l-0.56,-0.73l-0.55,-0.03l0.25,-1.08l0.24,0.62l1.0,1.03l0.49,0.12l0.22,-0.45l-0.16,-0.56l-2.04,-2.65l-0.26,-0.69l-1.25,-0.92l-0.12,-0.65l-0.78,-1.42l-0.57,-0.53l-2.3,-1.26l-2.65,-3.25l-1.36,-1.07l-2.57,-2.67l-0.03,-0.3l0.49,-0.59l0.14,-0.64l-0.22,-1.66l-0.91,-1.64l-0.93,-2.81l0.52,-2.58l0.45,-0.74l-0.41,-1.27l0.02,-1.33l-0.75,-1.24l-0.36,-1.61l-2.23,-2.98l-1.14,-0.73l-0.15,-0.65l-0.67,-0.88l-3.58,-2.62l0.15,-1.17l-0.83,-2.1l0.61,-2.07l0.59,-1.14ZM97.75,298.07l1.14,0.41l0.74,0.97l-0.65,-0.28l-0.94,0.2l-0.28,-1.3ZM97.08,306.81l1.02,1.01l0.39,0.23l-0.94,-0.39l-0.47,-0.84ZM80.99,300.74l0.1,-0.04l0.76,0.4l-0.32,-0.05l-0.53,-0.32ZM75.73,286.91l0.84,0.33l0.95,-0.0l1.05,0.45l-2.13,0.27l-0.63,-0.28l-0.09,-0.76ZM79.78,287.45l0.43,-0.32l0.21,0.15l-0.19,0.09l-0.45,0.09ZM70.61,287.96l2.0,-0.32l0.31,0.52l0.51,0.24l-0.83,0.55l-0.99,0.11l-0.47,-0.25l-0.53,-0.86Z", "name": "California"}, "US-IA": {"path": "M438.84,115.24l82.4,-0.03l0.72,2.23l1.85,1.0l0.02,0.46l-1.03,1.44l-0.26,0.94l0.42,4.43l0.79,1.17l0.22,1.53l0.57,0.99l0.71,0.6l4.72,1.13l1.01,1.79l-0.38,0.8l0.22,0.67l3.26,2.32l0.6,2.13l3.45,2.28l0.41,1.43l-0.71,3.48l-1.76,1.51l-0.67,1.6l0.0,1.09l-1.32,1.02l-2.49,0.6l-0.96,0.92l-0.55,0.16l-4.43,0.32l-0.92,0.55l-0.74,1.41l-0.38,2.18l0.29,0.96l1.41,0.93l0.37,0.47l0.23,0.65l0.04,1.55l-0.22,0.54l-1.83,2.01l-0.41,1.87l-0.6,1.11l-2.83,0.94l-1.06,0.79l-0.28,0.9l0.6,0.77l0.0,1.72l-0.54,0.14l-1.18,-0.78l-0.22,-0.66l-1.14,-0.79l-0.25,-0.45l-0.8,-0.36l-0.2,-0.69l-0.84,-0.65l-21.24,0.69l-14.35,0.12l-7.2,0.04l-19.64,-0.5l-0.17,-0.87l-1.21,-0.69l-0.27,-0.54l0.58,-0.87l-0.14,-0.86l0.26,-1.16l-0.26,-1.88l-0.51,-0.57l0.18,-3.14l-0.96,-0.56l0.08,-0.55l0.71,-0.83l-0.03,-0.47l-1.19,-0.51l0.39,-2.12l-0.29,-0.37l-0.93,-0.2l0.25,-0.58l-0.09,-0.42l-0.67,-0.41l-0.7,0.18l0.08,-0.71l-0.34,-0.56l-0.03,-1.06l0.31,-0.46l0.25,-1.72l-1.4,-1.93l0.18,-0.87l-0.18,-0.74l-1.66,-1.38l-0.28,-1.5l-1.01,-0.84l0.11,-1.84l-0.99,-1.64l0.26,-1.38l-0.22,-0.98l-0.53,-0.46l-0.78,-0.18l-0.32,-1.24l-0.41,-0.61l0.02,-0.57l-1.32,-1.06l-0.38,-0.58l0.6,-1.23l0.54,-0.4l0.37,-1.57l0.44,-0.73l0.1,-1.46l0.52,-0.55l0.26,-1.05l-0.43,-2.0l-0.42,-0.25l-0.79,-0.05l-0.04,-0.53l0.41,-0.49l0.05,-1.56l-0.89,-1.22l0.0,-0.66Z", "name": "Iowa"}, "US-MI": {"path": "M591.56,147.18l0.95,-0.52l1.06,-1.03l0.87,-1.25l1.7,-3.51l1.79,-2.4l1.67,-4.11l0.85,-4.52l-0.13,-5.66l-1.5,-3.87l0.62,-0.35l0.42,-0.66l-0.49,-0.52l-1.14,0.35l-2.82,-6.77l0.26,-1.1l1.25,-1.65l0.14,-0.86l-0.38,-2.16l0.08,-0.67l-1.02,-1.55l0.04,-0.49l2.08,-2.12l1.8,-3.43l0.24,-0.9l-0.14,-1.53l0.47,-2.26l-0.53,-1.47l0.43,-0.48l0.81,-0.34l0.8,0.09l0.63,-0.34l0.24,-3.05l1.08,0.05l0.89,-1.17l1.14,0.58l0.67,-0.2l1.16,-2.17l0.99,-0.93l0.81,-1.39l0.57,-0.08l-0.69,0.63l0.33,1.48l-0.56,0.59l-0.4,0.88l0.64,0.48l-0.87,2.24l0.68,1.38l0.28,0.16l0.45,-0.13l0.44,0.57l0.65,-0.12l1.23,-1.85l1.21,-2.97l0.25,-1.82l-0.23,-3.06l0.73,-0.79l2.4,-1.14l2.85,-0.09l1.07,-0.41l0.38,-0.52l-0.17,-0.61l-1.74,-0.33l-0.57,-0.49l-0.46,-0.93l0.0,-1.2l0.26,-0.47l1.28,-0.93l0.79,-0.93l0.08,-0.66l1.7,0.04l0.92,-0.73l2.59,1.36l1.29,0.99l0.79,0.23l2.08,-0.06l1.33,0.55l1.0,1.07l0.35,1.09l0.69,0.54l2.46,0.1l1.53,1.14l1.9,0.36l0.69,0.68l1.2,0.4l1.36,0.15l0.62,0.34l0.91,0.79l-0.21,0.36l0.05,0.65l0.8,1.3l0.6,0.29l0.19,0.8l-0.25,0.41l-0.6,-0.33l-1.02,0.35l-0.57,1.6l0.59,1.29l1.4,1.1l0.44,1.26l0.25,2.04l-0.42,1.46l-0.21,4.9l-0.23,0.46l-0.59,0.08l-0.66,0.78l-0.75,-0.06l-0.91,0.59l-0.37,0.78l-0.25,2.2l-0.32,0.41l-0.0,0.41l-1.16,0.24l-0.32,0.68l-1.88,0.09l-0.82,0.42l-1.01,2.16l0.13,0.46l-0.25,0.39l-0.25,1.5l0.07,0.77l0.37,0.69l0.77,0.66l2.67,1.13l0.87,0.07l1.26,-0.89l0.85,-1.16l0.58,0.27l0.39,-0.15l1.33,-2.09l0.28,-0.83l0.76,-0.81l0.03,-0.45l0.44,-0.21l0.75,-0.88l1.43,-0.12l1.16,-0.42l1.01,-0.81l0.94,-0.24l1.93,0.83l0.97,0.77l0.78,1.07l0.79,2.02l0.88,5.33l0.51,1.49l0.33,3.31l0.79,3.3l0.91,1.67l0.02,0.41l-1.05,2.81l0.17,0.95l-0.18,1.21l-0.94,2.24l-0.42,0.32l-0.31,-1.07l0.16,-0.68l-0.4,-0.4l-0.93,-0.32l-0.44,-0.0l-1.66,0.91l-0.22,0.75l0.33,0.62l-0.8,0.32l-0.43,0.64l-0.18,0.93l0.21,0.67l-0.26,0.91l-0.58,0.54l-1.7,0.53l-1.33,1.4l-1.04,3.06l-0.2,0.95l0.13,0.41l-0.4,0.71l-0.43,0.09l-0.18,0.76l-0.6,0.16l-0.55,0.85l-0.58,0.37l-0.7,1.01l-0.2,0.85l-0.61,0.57l-19.97,0.68l-0.0,-0.68l-0.4,-0.4l-30.67,-0.02ZM610.84,88.0l-0.04,-0.14l0.09,-0.11l-0.04,0.22l-0.01,0.04ZM535.15,55.52l5.24,-1.66l4.06,-2.9l6.12,-0.65l1.51,-0.61l1.33,-0.88l1.42,-1.31l1.01,0.14l1.64,-0.49l1.31,-1.92l3.31,-2.28l-0.13,1.01l0.17,0.59l0.5,0.39l1.34,0.33l-0.24,0.97l0.12,0.34l0.65,0.18l0.46,0.59l0.03,0.58l-0.59,2.16l0.3,0.89l-0.37,0.37l0.16,0.53l0.7,0.06l1.41,-1.62l-0.01,-0.24l0.58,-0.16l0.65,-0.53l-0.55,0.95l0.51,0.51l0.92,-0.5l0.7,-1.03l1.11,-0.28l3.24,0.13l1.54,0.36l0.69,0.36l0.4,0.61l0.67,0.08l0.2,0.39l0.64,0.08l0.35,1.01l2.17,2.76l0.95,0.43l0.34,1.44l0.69,0.39l1.9,0.28l0.78,-0.27l1.1,0.08l0.6,-0.52l0.98,-0.27l0.89,1.12l1.02,0.7l1.04,-0.1l0.84,-0.66l0.48,0.5l0.91,0.3l0.35,0.38l0.69,-0.22l2.07,-2.09l3.16,-1.32l2.01,-1.26l0.91,0.23l3.54,-0.64l5.32,0.48l0.82,-0.14l2.82,-1.26l1.38,-0.39l2.64,0.04l-0.47,2.82l0.18,0.68l-0.53,0.96l0.56,0.87l0.61,0.19l0.82,-0.26l0.4,0.36l1.71,0.58l1.22,-0.22l1.23,-0.63l0.58,0.5l0.12,0.69l0.78,0.31l1.41,-0.52l1.23,-1.23l0.72,0.08l0.72,0.78l0.76,1.63l0.22,1.43l0.34,0.51l-1.01,0.81l0.35,0.9l0.42,0.39l1.44,-0.18l0.5,0.49l0.6,0.11l-0.17,0.67l0.19,0.44l0.84,0.91l0.92,0.26l0.5,0.41l-1.29,0.35l-3.3,-0.64l-1.05,0.02l-0.65,-0.26l-0.57,0.2l-1.35,-0.36l-0.44,0.26l-0.53,-0.01l-0.55,-0.78l-1.63,-0.29l-0.63,0.32l-0.29,1.06l-0.62,0.6l0.02,1.85l-0.9,-0.33l-0.75,-0.94l-0.75,-0.22l-0.4,-0.6l-1.31,-1.13l-2.34,-0.86l-1.63,-0.19l-0.97,-0.58l-0.57,0.19l-0.65,-0.32l-0.64,0.25l-1.13,-0.1l-0.66,0.31l-1.59,2.07l-3.64,0.18l-0.69,0.62l-2.06,-0.58l-2.96,0.45l-0.82,0.65l-0.94,2.14l-0.82,0.14l-0.95,0.66l-0.68,0.16l-0.07,-0.44l0.47,-1.17l-0.04,-0.36l-0.59,-0.61l-1.05,0.17l-0.92,0.73l-0.93,-0.47l-0.7,0.06l-0.41,0.3l-0.02,0.75l-1.02,1.67l-1.32,0.38l0.08,-1.2l-0.32,-0.96l0.49,-0.84l0.09,-0.62l-0.13,-0.39l-0.63,-0.24l-0.52,0.45l-0.33,1.05l-0.58,0.74l-0.58,2.23l-1.25,0.67l-1.69,2.5l-0.98,2.26l-3.27,4.36l-0.81,0.6l-0.01,0.78l-1.23,-1.23l0.4,-1.47l0.86,-1.44l-0.32,-0.81l-0.57,-0.34l-1.42,0.58l-1.22,-0.01l0.18,-1.06l0.61,-0.45l0.39,-0.76l-0.22,-1.2l0.34,-0.36l0.09,-0.59l-0.43,-0.91l0.23,-0.77l-1.73,-1.6l-1.1,-0.17l-0.54,-0.45l-0.89,0.08l-0.61,-0.25l0.5,-1.11l-0.78,-1.44l-1.07,-0.57l-2.25,-0.33l-0.66,-0.39l-0.69,0.04l-1.8,-0.63l-1.15,0.11l-0.48,0.25l-1.42,-0.53l-1.68,-0.02l-4.42,-2.19l-15.43,-3.72l-1.22,-2.66l-0.47,-0.55l-1.44,-0.61l-0.39,-0.42l-0.79,0.17l-0.07,-0.2ZM594.86,71.41l-0.05,0.36l-0.5,0.22l-0.92,1.15l-0.03,0.49l-0.37,-0.25l-0.18,-0.28l0.46,-0.42l0.74,-1.34l0.85,0.05ZM637.67,67.18l2.1,-1.04l0.29,-0.53l-0.13,-0.56l1.03,0.3l0.59,1.21l0.75,0.26l-0.43,0.84l-0.42,0.11l-1.46,-0.53l-0.85,0.29l-1.46,-0.37ZM630.86,57.21l0.68,-0.59l0.48,0.13l-0.55,1.04l0.09,1.05l-0.35,-1.26l-0.37,-0.37ZM632.03,60.7l0.36,0.48l0.09,0.5l-0.51,-0.71l0.06,-0.27ZM626.47,70.68l1.25,0.39l0.4,-0.13l0.34,0.25l-0.22,0.35l-0.82,-0.01l-0.95,-0.85ZM610.55,74.21l-0.79,-0.07l1.02,-2.54l0.28,2.15l-0.51,0.46ZM603.02,83.31l0.44,0.31l-0.17,0.47l-0.34,-0.65l0.07,-0.12ZM593.15,56.73l-0.2,-0.37l0.1,-0.31l0.34,0.29l-0.23,0.39ZM563.06,44.08l0.15,-1.33l1.16,-0.81l1.48,-1.76l2.12,-1.16l0.63,0.09l0.62,-0.47l2.3,-0.57l3.54,0.0l1.03,0.67l-0.59,0.26l-1.34,-0.26l-2.44,0.43l-0.2,0.24l0.22,0.64l0.66,0.18l-1.28,0.69l-0.32,0.5l-0.64,0.3l-0.74,0.75l-0.75,0.17l-0.49,0.69l-0.08,0.58l-1.35,1.09l-0.97,1.8l-0.59,-0.84l0.88,-0.76l0.39,-1.75l-0.56,-0.47l-0.23,0.11l-0.73,0.76l-0.15,0.65l-0.51,-0.35l-1.23,-0.07ZM553.84,30.03l0.66,-0.44l0.23,-0.5l-0.31,-0.21l0.58,-0.38l2.63,-1.31l0.72,-0.1l1.86,-0.82l2.29,-1.36l0.64,-0.12l-0.46,0.49l-0.01,0.75l-0.49,0.38l-4.78,1.88l-1.02,0.8l0.17,0.37l-2.07,0.86l-0.37,-0.01l-0.26,-0.29Z", "name": "Michigan"}, "US-GA": {"path": "M610.09,270.84l37.76,-0.27l-1.38,0.76l-0.7,1.25l-0.71,0.57l-0.62,1.33l-0.08,1.06l0.6,0.75l1.46,0.89l0.86,0.25l2.02,1.96l0.7,0.31l1.68,-0.02l0.44,0.26l0.41,1.37l1.04,1.48l0.49,2.1l1.03,0.87l0.52,1.01l0.45,0.31l0.57,1.52l0.88,0.4l0.84,0.94l1.57,0.88l1.36,1.11l1.53,2.82l1.82,0.79l1.86,1.67l0.02,1.86l0.91,1.01l0.43,-0.06l-0.02,0.88l0.56,0.7l0.63,0.2l0.29,1.01l3.73,2.0l0.28,0.65l-0.12,0.94l1.01,1.62l0.51,1.68l-0.19,0.56l0.28,0.65l-0.1,1.01l0.48,0.61l1.23,0.5l0.92,0.66l0.14,0.43l0.44,0.29l0.5,2.12l0.53,0.55l-0.38,2.04l0.41,1.34l1.01,0.92l1.31,0.03l1.06,0.81l1.09,0.25l-0.49,0.38l-0.42,-0.34l-0.47,0.16l-0.52,0.77l0.31,0.8l-0.28,0.21l-1.07,-0.32l-0.58,-0.56l-0.64,0.26l0.0,0.61l-0.4,0.31l0.23,0.68l0.77,0.12l0.29,0.26l-0.63,0.82l-1.18,-0.02l-1.04,-0.55l-0.48,0.25l-0.09,0.37l0.25,0.48l0.89,0.4l-0.5,0.5l0.14,0.35l-0.29,0.54l0.52,0.56l-0.24,0.19l-0.57,-0.21l-0.88,0.25l-0.22,0.6l0.73,0.53l-0.03,0.72l0.48,0.04l0.95,-0.6l-0.89,1.25l-0.25,-0.44l-0.44,-0.08l-0.53,0.58l0.13,0.61l0.61,0.67l-1.77,-0.32l-0.71,-0.36l-0.6,0.14l-0.06,0.65l0.39,0.34l2.24,0.62l0.72,0.58l-0.55,0.3l-0.99,1.33l-0.12,-1.11l-0.41,-0.2l-0.59,0.18l-0.25,0.4l0.08,0.93l-0.46,0.06l-0.21,0.67l-0.24,0.08l-0.01,0.47l0.88,1.04l-0.72,0.22l-0.33,0.39l0.24,0.49l0.46,0.17l-0.47,1.17l-0.44,0.4l0.63,1.45l-0.08,0.49l-0.64,0.13l-2.11,-0.52l-3.17,-1.34l-1.17,0.09l-0.28,0.51l-0.58,0.14l-0.49,0.94l-0.1,1.69l0.55,1.3l-0.55,3.06l-0.26,0.07l-1.29,-0.04l-0.27,-0.73l0.1,-1.03l-0.57,-0.84l-0.03,-0.68l-0.26,-0.12l-40.95,-2.67l-0.48,-0.48l-0.23,-1.76l-0.7,-1.7l-0.36,-0.34l0.17,-0.5l-0.41,-1.28l-0.84,-1.34l-0.42,-0.28l-0.12,-1.36l0.31,-0.58l0.18,-1.81l0.26,-0.33l-0.05,-0.75l0.34,-1.13l-0.27,-1.5l-0.79,-1.27l-0.5,-2.15l0.31,-1.23l0.96,-1.74l-0.0,-1.22l0.43,-1.6l1.52,-0.82l0.6,-1.18l-0.41,-0.59l-1.06,-0.68l0.39,-0.99l-0.04,-0.68l-0.57,-1.58l-1.49,-2.14l-0.52,-2.33l-0.53,-0.61l-0.01,-0.76l-0.46,-1.13l-6.25,-35.47ZM678.57,328.71l0.34,-0.04l-0.12,0.34l-0.08,-0.13l-0.15,-0.17ZM674.24,342.17l-0.1,-0.24l0.18,-0.35l-0.05,0.47l-0.03,0.12Z", "name": "Georgia"}, "US-AZ": {"path": "M154.94,313.68l0.12,-1.4l0.89,-1.11l0.31,-0.92l0.33,-0.23l1.47,0.28l0.82,-0.14l0.41,-0.45l0.09,-0.95l0.98,-0.97l-0.15,-2.2l-0.56,-0.94l-0.84,-0.44l-1.36,-0.09l-0.76,-0.57l0.35,-1.96l-0.19,-1.11l-0.58,-0.82l0.36,-0.71l-0.18,-0.62l1.17,-0.4l1.61,-2.53l0.23,-1.97l0.45,-0.71l-0.38,-2.49l0.38,-0.61l-0.44,-1.02l1.3,-1.09l0.5,-1.44l2.69,-1.53l1.55,-1.49l0.17,-0.53l-0.27,-0.85l-3.24,-2.36l-0.46,-0.12l0.02,-1.0l-0.74,-1.04l-0.07,-0.75l-1.12,-2.06l-0.81,-0.36l-0.38,-1.27l-0.68,-0.52l-0.29,-2.76l0.37,-0.81l-0.28,-0.55l0.74,-0.49l0.16,-1.2l-0.32,-2.58l-1.14,-2.77l0.27,-0.72l0.03,-1.43l-0.75,-2.3l0.02,-0.9l0.38,-1.25l-0.97,-1.41l-0.15,-0.64l0.3,-0.48l0.1,-1.09l2.13,-0.81l1.67,0.58l1.22,-0.33l1.13,1.65l0.8,0.49l1.38,-0.07l0.86,-0.56l0.6,-1.92l0.68,-1.1l0.04,-13.8l77.02,0.06l-0.01,98.74l-30.99,-0.1l-57.99,-19.96Z", "name": "Arizona"}, "US-MT": {"path": "M139.97,32.58l-0.3,-0.58l-0.6,-0.39l-0.49,-1.28l-1.31,-1.05l-1.65,-2.0l0.01,-19.3l186.21,-0.0l0.14,77.75l-108.87,0.0l-0.4,0.4l-0.01,9.14l-1.76,-1.59l-0.13,-0.77l-1.48,-1.94l-1.31,-0.51l-1.68,1.0l-0.08,0.49l0.23,0.41l-0.66,0.45l-0.18,1.38l-2.44,-0.09l-1.85,0.71l-0.37,-0.4l-0.65,-0.24l-3.32,0.45l-2.49,-0.57l-1.57,0.69l-0.65,1.38l-2.12,-0.52l-2.72,-0.33l-1.23,0.47l-0.99,0.91l-0.23,0.63l-0.98,-0.38l-0.85,-0.65l-0.17,-0.48l0.18,-0.77l-1.08,-1.33l0.34,-0.48l-0.06,-0.46l-1.61,-2.55l-0.76,-0.61l-0.85,-0.3l-0.57,0.03l-0.81,0.46l-0.32,-0.54l-1.2,-0.64l-0.54,-1.07l0.55,-0.67l-0.02,-1.26l-1.11,-1.99l-0.81,-0.21l-0.54,-1.34l-1.88,-2.03l0.02,-1.35l-0.74,-1.01l0.13,-1.29l-0.33,-0.45l-0.52,-0.23l0.33,-0.86l-0.34,-0.69l-1.25,-0.51l-0.23,-0.51l-0.99,-0.69l-0.83,-0.24l-0.42,0.3l-0.03,0.76l-0.62,0.31l-0.96,1.22l-1.7,0.55l-0.59,0.87l-0.48,0.23l-0.41,-0.03l-1.64,-1.37l-1.09,-0.24l-0.11,-0.69l0.61,-0.64l0.08,-1.01l-0.83,-1.29l0.7,-1.05l1.06,-0.22l0.73,-0.85l-0.44,-0.97l0.25,-0.64l-0.1,-0.53l-1.01,-0.46l-0.18,-0.69l0.49,-1.12l-0.71,-0.9l0.65,-0.15l0.34,-0.45l-0.3,-1.57l0.72,-1.45l0.05,-0.94l0.47,-1.03l0.01,-0.63l-0.23,-0.39l0.75,-0.67l0.18,-2.82l-0.27,-0.34l-0.52,-0.14l-1.9,0.58l-1.51,0.06l-0.64,-0.36l0.27,-0.64l-0.44,-0.69l-0.87,-0.38l-0.9,0.47l-0.24,-0.88l-0.9,-0.35l-1.12,-0.82l-0.29,-1.68l-1.33,-1.13l-0.68,-0.25l-0.21,-0.61l-1.34,-1.3l-0.72,-1.05l-1.31,-1.0l-0.87,-1.38l-2.65,-0.86l-1.18,-1.49l-1.59,-0.91l0.57,-0.26l0.15,-0.61l-0.62,-0.5l-0.56,-0.88l0.47,-0.44l0.13,-0.73l-0.59,-0.94l-0.08,-0.9l-0.73,-0.62Z", "name": "Montana"}, "US-MS": {"path": "M515.87,335.38l1.34,-0.07l0.48,-0.44l0.54,-2.14l-0.51,-1.46l1.44,-1.3l0.47,-2.76l0.79,-1.7l1.66,-0.82l1.12,-1.46l1.27,-0.73l0.35,-0.59l0.06,-0.83l-0.47,-0.71l0.99,-0.17l1.02,-1.95l0.89,-0.99l-0.07,-0.74l-1.27,-0.49l-0.24,-0.78l-1.44,-0.93l0.11,-1.66l-0.75,-0.7l-0.29,-0.64l-0.01,-0.2l0.96,-0.14l0.48,-0.53l-0.16,-0.85l-1.12,-0.41l0.33,-1.33l0.96,-1.14l-0.05,-0.44l-0.34,-0.4l-1.06,-0.46l0.1,-2.16l0.77,-0.32l0.29,-0.71l-0.33,-2.06l-1.0,-0.59l0.68,-0.96l0.12,-1.78l-0.68,-0.81l-0.82,-0.46l0.6,-0.12l0.42,-0.37l0.1,-1.0l-0.37,-0.47l-0.63,-0.31l1.41,-1.42l0.81,-0.17l0.4,-0.55l-0.3,-1.3l0.45,-0.73l0.0,-0.38l-0.5,-0.69l1.21,-0.49l1.1,-0.12l0.6,-0.58l0.03,-0.91l-0.23,-0.34l-0.9,-0.47l1.26,-0.72l0.68,-1.34l0.77,-0.01l0.46,-0.85l-0.06,-0.57l1.23,-0.24l1.18,-0.88l0.39,-2.85l-0.27,-1.26l0.43,-1.29l0.62,0.12l0.64,-0.22l0.46,-0.75l-0.28,-0.78l2.52,-1.15l0.62,-0.85l-0.06,-0.97l32.0,0.04l0.6,1.06l0.66,0.44l-6.17,52.3l1.23,26.06l-0.59,0.45l-1.18,-0.37l-0.7,-0.82l-1.2,0.7l-1.0,0.02l-1.67,-1.18l-1.54,-0.31l-0.7,0.2l-0.39,0.4l0.18,0.31l-0.4,0.19l-3.37,0.93l0.01,-0.37l-0.74,-0.48l-0.87,-0.06l-0.62,0.8l0.25,0.41l0.32,0.09l-1.38,0.76l-0.41,0.98l-0.54,0.15l-1.07,-0.17l-0.73,-1.47l0.01,-0.7l-0.62,-1.21l-0.09,-0.82l-1.03,-1.41l-0.89,-0.49l-0.28,-0.58l0.11,-0.52l-0.48,-0.76l0.36,-1.49l0.49,-0.67l0.81,-2.27l0.06,-1.0l-0.39,-0.33l-28.8,-0.0l0.46,-0.65l-0.74,-1.43l0.31,-0.79l-0.07,-0.52l-0.56,-0.6Z", "name": "Mississippi"}, "US-SC": {"path": "M648.79,270.55l4.59,-1.42l0.9,0.11l0.9,-0.5l0.3,-0.42l3.68,-0.92l0.52,-0.62l0.51,0.26l1.15,-0.1l19.0,0.94l-0.19,0.91l0.3,0.57l0.63,0.13l1.26,-0.82l1.95,2.41l-0.05,1.96l0.42,0.57l17.51,0.53l16.38,15.6l-0.12,0.35l-2.42,1.24l-2.75,2.42l-3.12,4.03l-0.36,0.73l-0.21,1.26l-0.74,-0.28l1.19,-1.88l-0.56,-0.37l-0.82,0.56l-0.74,0.99l-0.39,1.22l0.25,0.68l1.11,0.64l0.17,0.68l-0.56,-0.12l-0.44,0.36l-0.72,-0.12l-0.37,0.63l0.64,0.45l-1.06,0.61l-0.26,0.77l-1.17,0.24l-0.28,-0.52l-0.45,-0.17l-1.05,0.49l-0.79,1.2l0.11,0.86l-1.15,0.72l-0.76,1.0l-1.17,0.57l-0.55,-0.41l0.26,-0.32l-0.05,-0.55l-0.27,-0.24l-1.25,0.01l-0.21,0.41l0.12,0.53l-0.38,-0.02l-0.11,0.69l0.31,0.45l1.17,0.68l-0.94,0.71l-1.12,0.0l-0.34,0.43l0.12,0.34l-2.02,0.62l-1.01,-0.86l-0.51,-0.02l-0.24,0.65l0.76,0.71l-1.38,0.87l-0.49,-0.66l-0.58,0.42l-0.03,0.47l-0.53,-0.4l-0.71,-0.14l-0.99,-0.87l-0.52,0.39l0.02,0.34l-1.57,-0.08l-0.49,0.63l0.33,0.4l-0.4,0.5l0.12,1.93l-0.58,-0.49l-0.34,-0.85l-0.17,-0.75l0.14,-0.68l-0.52,-0.29l-0.32,-0.56l-0.61,-0.13l-0.39,0.51l0.52,0.94l-0.09,0.54l0.6,1.55l-0.15,0.66l0.71,0.96l-0.45,0.25l-0.16,0.79l-1.58,2.47l-0.29,-0.41l-0.76,-0.38l-1.3,-0.04l-0.63,-0.63l-0.29,-0.84l0.37,-2.2l-0.63,-0.86l-0.45,-2.02l-0.82,-1.01l-2.35,-1.41l0.02,-2.14l-0.58,-1.87l-0.92,-1.44l0.12,-0.81l-0.46,-1.09l-3.76,-2.05l-0.29,-1.07l-0.92,-0.41l0.1,-0.59l-0.33,-0.79l-0.73,-0.13l-0.48,-0.54l0.21,-0.95l-0.36,-1.09l-2.01,-1.8l-1.74,-0.73l-1.07,-2.3l-0.43,-0.48l-1.47,-1.2l-1.57,-0.88l-0.87,-0.98l-0.67,-0.2l-0.61,-1.57l-0.4,-0.26l-0.59,-1.07l-0.89,-0.7l-0.46,-2.01l-1.06,-1.54l-0.61,-1.64l-0.86,-0.45l-1.71,0.02l-0.35,-0.18l-2.04,-2.11l-0.91,-0.13l-1.34,-0.81l-0.34,-0.44l0.63,-1.61l0.68,-0.54l0.51,-1.04l1.35,-0.77l0.51,-0.71ZM685.22,318.34l0.48,0.03l0.28,0.33l-1.08,1.1l0.33,-0.66l0.0,-0.8ZM686.87,314.23l0.75,0.13l-0.19,0.34l0.37,0.34l1.58,0.18l-0.95,0.59l-0.38,0.58l0.45,0.55l0.73,-0.19l-1.01,0.6l-0.84,0.15l0.19,-1.48l-0.51,-0.41l0.15,-0.89l-0.34,-0.49Z", "name": "South Carolina"}, "US-RI": {"path": "M834.45,149.62l0.28,0.08l-0.11,0.67l0.29,1.63l-0.37,0.3l-0.08,-2.69ZM832.72,152.28l-0.15,-0.24l0.63,-1.1l-0.05,1.18l-0.42,0.16ZM824.57,155.27l0.16,-0.88l0.35,-0.37l0.14,-1.92l-0.07,-8.82l5.67,-0.09l0.11,1.82l0.34,0.41l0.32,0.04l-0.03,0.58l-0.03,0.29l-0.78,0.05l-0.06,0.24l0.05,1.35l0.39,0.51l-0.57,-0.07l-0.64,0.49l0.5,1.05l-0.47,0.91l0.25,0.89l-0.01,1.12l-0.88,1.57l-1.28,-0.15l-3.47,0.98ZM833.02,148.46l0.06,0.35l-0.22,0.17l0.05,-0.22l0.11,-0.3ZM828.1,158.43l0.01,-0.01l0.0,0.0l-0.01,0.0Z", "name": "Rhode Island"}, "US-CT": {"path": "M795.36,159.92l3.38,-1.92l0.09,-0.57l-0.85,-1.29l0.96,-13.65l9.73,0.36l0.44,0.52l0.67,-0.06l0.38,-0.42l14.19,0.21l0.08,8.98l-0.12,1.65l-0.3,0.34l-0.21,1.0l-1.59,-0.15l-1.07,0.44l-0.54,-0.46l-0.47,-0.04l-0.43,0.69l-1.06,-0.22l-1.51,0.72l-0.49,-0.24l0.02,-0.5l-0.3,-0.47l-0.79,-0.29l-0.38,0.6l0.49,0.66l-0.07,0.38l-0.78,-0.22l-1.17,0.47l-1.52,-0.35l-0.89,0.18l-0.42,0.31l-0.76,-0.28l-2.11,0.18l-0.18,-0.63l-0.58,-0.06l-1.38,1.5l-0.62,0.09l-1.12,0.85l-0.7,-0.23l-1.06,0.38l-0.35,0.47l-0.49,-0.09l-1.01,0.4l-3.34,1.84l-0.25,-0.14l-0.71,0.14l-0.8,-1.04Z", "name": "Connecticut"}}, "height": 478.4546304213027, "projection": {"type": "mill", "centralMeridian": -10.0}, "width": 900.0});
// Place all the behaviors and hooks related to the matching controller here.



//--- Sparklines

//--- Flot







// --- EasyPie

//--- Moment

//--- jQuery Vector map (only dashboard v3)



;
