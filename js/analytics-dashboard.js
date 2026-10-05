(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { days: 30, report: null, token: sessionStorage.getItem("osl-report-token") || "", preview: false };
  const leadEvents = ["cta_contact_click", "contact_started", "contact_submitted"];
  const engagementEvents = ["video_play", "article_read_50", "article_read_90", "ai_curve_completed"];
  const number = new Intl.NumberFormat("en-US");
  const pct = (value) => `${(value * 100).toFixed(value >= .1 ? 0 : 1)}%`;
  const total = (bucket, names) => names.reduce((sum, name) => sum + (bucket.totals?.[name] || 0), 0);
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  const text = (tag, value, className) => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };

  function demoReport(days) {
    const byDay = {};
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const pulse = Math.max(1, Math.round(4 + Math.sin(i * .78) * 2 + (days - i) / Math.max(6, days / 2)));
      byDay[date] = { page_view: pulse, cta_contact_click: i % 6 === 0 ? 1 : 0, contact_started: i % 11 === 0 ? 1 : 0, contact_submitted: i % 19 === 0 ? 1 : 0 };
    }
    const current = {
      totals: { page_view: Object.values(byDay).reduce((s,d)=>s+d.page_view,0), cta_contact_click: 9, contact_started: 5, contact_submitted: 2, video_play: 18, article_read_50: 11, article_read_90: 6, ai_curve_completed: 4 }, byDay,
      pages: [{path:"/",pageViews:72,engagement:18,leadSignals:8,contacts:1},{path:"/ai",pageViews:34,engagement:7,leadSignals:4,contacts:1},{path:"/musings/ai-has-a-branding-problem",pageViews:26,engagement:17,leadSignals:1,contacts:0},{path:"/career",pageViews:14,engagement:2,leadSignals:1,contacts:0}],
      channels: [{channel:"Direct / unknown",pageViews:61,leadSignals:5,contacts:1},{channel:"Social",pageViews:42,leadSignals:7,contacts:1},{channel:"Organic search",pageViews:29,leadSignals:3,contacts:0},{channel:"Referral",pageViews:14,leadSignals:1,contacts:0}],
      campaigns: [{campaign:"founder-launch",source:"linkedin",medium:"social",content:"origin-post",pageViews:31,leadSignals:6,contacts:1},{campaign:"ai-perspective",source:"linkedin",medium:"social",content:"article-post",pageViews:11,leadSignals:1,contacts:0}],
      geography:[{location:"Illinois, United States",count:48},{location:"New York, United States",count:27},{location:"California, United States",count:19},{location:"United Kingdom",count:8}], referrers:[{host:"linkedin.com",count:33},{host:"google.com",count:22}],
      recent:[{event:"page_view",timestamp:new Date().toISOString(),path:"/ai",channel:"Social",detail:""},{event:"cta_contact_click",timestamp:new Date(Date.now()-420000).toISOString(),path:"/ai",channel:"Social",detail:"Start a conversation"},{event:"article_read_90",timestamp:new Date(Date.now()-1100000).toISOString(),path:"/musings/ai-has-a-branding-problem",channel:"Organic search",detail:""}]
    };
    return { generatedAt:new Date().toISOString(),days,current,previous:{...current,totals:{...current.totals,page_view:Math.round(current.totals.page_view*.72),cta_contact_click:6,contact_started:3,contact_submitted:1,video_play:12,article_read_50:8,article_read_90:4,ai_curve_completed:2}},definitions:{privacy:"Representative preview only. Live mode is cookie-free and stores no visitor profiles."} };
  }

  async function loadReport() {
    setLoading(true);
    try {
      if (state.preview) state.report = demoReport(state.days);
      else {
        const response = await fetch(`/api/analytics-report?days=${state.days}`, { headers: { Authorization: `Bearer ${state.token}` }, cache: "no-store" });
        if (!response.ok) throw new Error(response.status === 401 ? "That reporting token was not accepted." : response.status === 503 ? "Analytics reporting is not configured in Netlify yet." : `The report could not be loaded (${response.status}).`);
        state.report = await response.json();
      }
      render();
      $("access-dialog").close();
      $("connection-status").textContent = state.preview ? "Preview" : "Live";
      $("reporting-label").textContent = state.preview ? "Representative preview" : "Live first-party report";
      $("live-dot").classList.add("live");
    } catch (error) {
      $("access-error").textContent = error.message;
      if (!$("access-dialog").open) $("access-dialog").showModal();
    } finally { setLoading(false); }
  }

  function setLoading(loading) { $("refresh-button").disabled = loading; $("refresh-button").textContent = loading ? "Loading…" : "Refresh"; }
  function changeLabel(current, previous, fallback) {
    if (!previous) return fallback;
    const delta = (current - previous) / previous;
    return `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}% vs prior period`;
  }
  function setMetric(id, changeId, value, previous, fallback) {
    $(id).textContent = number.format(value); const label = $(changeId); label.textContent = changeLabel(value, previous, fallback); label.className = value > previous ? "up" : value < previous ? "down" : "";
  }

  function render() {
    const { current, previous, generatedAt } = state.report;
    const views = current.totals.page_view || 0, prevViews = previous.totals.page_view || 0;
    const intent = total(current, leadEvents), prevIntent = total(previous, leadEvents);
    const contacts = current.totals.contact_submitted || 0, prevContacts = previous.totals.contact_submitted || 0;
    const engagement = total(current, engagementEvents), prevEngagement = total(previous, engagementEvents);
    setMetric("metric-views","change-views",views,prevViews,"Selected period"); setMetric("metric-intent","change-intent",intent,prevIntent,"CTA, form starts and contacts"); setMetric("metric-contacts","change-contacts",contacts,prevContacts,"Completed inquiries"); setMetric("metric-engagement","change-engagement",engagement,prevEngagement,"Reads, video and AI completions");
    $("updated-at").textContent = `Updated ${new Date(generatedAt).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}`;
    renderTrend(current.byDay); renderRecommendations(current); renderTable("channels-body", current.channels, channelRow, 6); renderTable("campaigns-body", current.campaigns, campaignRow, 7); renderTable("pages-body", current.pages, pageRow, 10); renderGeography(current.geography); renderFunnel(current.totals); renderActivity(current.recent); updateCampaignUrl();
  }

  function renderTrend(byDay) {
    const entries = Object.entries(byDay || {}).sort(([a],[b])=>a.localeCompare(b)); const host = $("trend-chart"); clear(host);
    if (!entries.length) { host.append(text("p","No activity has been recorded in this period.","placeholder")); return; }
    const width=900,height=280,pad={l:48,r:14,t:16,b:30};
    const rawMax=Math.max(1,...entries.map(([,d])=>Math.max(d.page_view||0,leadEvents.reduce((s,e)=>s+(d[e]||0),0))));
    const roughStep=rawMax/3; const magnitude=10**Math.floor(Math.log10(roughStep)); const fraction=roughStep/magnitude;
    const tickStep=Math.max(1,(fraction<=1?1:fraction<=2?2:fraction<=5?5:10)*magnitude); const chartMax=tickStep*3;
    const point=(value,index)=>[pad.l+(index/Math.max(1,entries.length-1))*(width-pad.l-pad.r),pad.t+(1-value/chartMax)*(height-pad.t-pad.b)];
    const viewPoints=entries.map(([,d],i)=>point(d.page_view||0,i)); const leadPoints=entries.map(([,d],i)=>point(leadEvents.reduce((s,e)=>s+(d[e]||0),0),i));
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.setAttribute("viewBox",`0 0 ${width} ${height}`); svg.setAttribute("aria-hidden","true");
    for(let i=0;i<4;i++){const y=pad.t+i*(height-pad.t-pad.b)/3;const tickValue=chartMax-i*tickStep;const line=document.createElementNS(svg.namespaceURI,"line");line.setAttribute("x1",pad.l);line.setAttribute("x2",width-pad.r);line.setAttribute("y1",y);line.setAttribute("y2",y);line.setAttribute("class","chart-grid");const label=document.createElementNS(svg.namespaceURI,"text");label.setAttribute("x",pad.l-9);label.setAttribute("y",y+3);label.setAttribute("text-anchor","end");label.setAttribute("class","chart-label chart-y-label");label.textContent=number.format(tickValue);svg.append(line,label)}
    const makePath=(points,cls)=>{const path=document.createElementNS(svg.namespaceURI,"path");path.setAttribute("d",points.map((p,i)=>`${i?"L":"M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "));path.setAttribute("class",cls);return path};
    const area=makePath([...viewPoints,[viewPoints.at(-1)[0],height-pad.b],[viewPoints[0][0],height-pad.b]],"chart-area");area.setAttribute("d",`${makePath(viewPoints,"").getAttribute("d")} L${viewPoints.at(-1)[0]},${height-pad.b} L${viewPoints[0][0]},${height-pad.b} Z`);svg.append(area,makePath(viewPoints,"chart-line"),makePath(leadPoints,"chart-lead"));
    [0,Math.floor((entries.length-1)/2),entries.length-1].forEach(i=>{const label=document.createElementNS(svg.namespaceURI,"text");label.setAttribute("x",viewPoints[i][0]);label.setAttribute("y",height-7);label.setAttribute("text-anchor",i===0?"start":i===entries.length-1?"end":"middle");label.setAttribute("class","chart-label");label.textContent=new Date(`${entries[i][0]}T12:00:00`).toLocaleDateString([],{month:"short",day:"numeric"});svg.append(label)}); host.setAttribute("aria-label",`Daily page views and lead signals, scaled from 0 to ${number.format(chartMax)} events`); host.append(svg);
  }

  function recommendations(data) {
    const views=data.totals.page_view||0, contacts=data.totals.contact_submitted||0, starts=data.totals.contact_started||0, clicks=data.totals.cta_contact_click||0; const direct=data.channels.find(c=>c.channel==="Direct / unknown")?.pageViews||0; const top=data.pages[0]; const items=[];
    if (views<25) items.push(["Build a reliable baseline","Traffic is still too light for confident optimization. Publish consistently and tag every distributed link for the next 30 days."]);
    if (!data.campaigns.length && views) items.push(["Make campaign attribution non-negotiable","Traffic is arriving without UTM context. Use the builder below for every social post, email and partner link."]);
    else if (direct/views>.45) items.push(["Reduce unattributed traffic",`${pct(direct/views)} of page views are direct or unknown. Consistent UTM links will reveal which outreach actually works.`]);
    if (starts>=3 && contacts/starts<.35) items.push(["Inspect the contact finish line",`${starts} form starts produced ${contacts} completed ${contacts===1?"inquiry":"inquiries"}. Shorten the form or clarify what happens after submission.`]);
    else if (clicks>=3 && starts/clicks<.4) items.push(["Strengthen the contact-page handoff",`${clicks} contact clicks produced ${starts} form starts. Match the page promise more closely to the CTA that brought visitors there.`]);
    if (top && top.pageViews>=10 && !top.leadSignals) items.push(["Give the highest-traffic page a next step",`${top.path} leads attention but has no recorded lead signal. Add one contextual invitation rather than a generic contact prompt.`]);
    const social=data.channels.find(c=>c.channel==="Social"); if(social?.pageViews>=10 && social.leadSignals/social.pageViews>.08) items.push(["Double down on social evidence",`Social is producing ${pct(social.leadSignals/social.pageViews)} lead signals per view. Reuse the message and format behind its best campaign.`]);
    if (!items.length) items.push(["Keep the measurement window clean","No urgent leak is visible. Maintain campaign tags and wait for another full reporting period before making a structural change."]);
    return items.slice(0,3);
  }
  function renderRecommendations(data){const list=$("recommendations");clear(list);recommendations(data).forEach(([title,body])=>{const li=document.createElement("li");li.append(text("strong",title),text("p",body));list.append(li)})}
  function renderTable(id, rows, renderer, limit){const body=$(id);clear(body);if(!rows?.length){const tr=document.createElement("tr");tr.className="empty-row";const td=text("td","No attributable activity yet.");td.colSpan=4;tr.append(td);body.append(tr);return}rows.slice(0,limit).forEach(row=>body.append(renderer(row)))}
  function row(values){const tr=document.createElement("tr");values.forEach(v=>tr.append(text("td",v)));return tr}
  const channelRow=(r)=>row([r.channel,number.format(r.pageViews),number.format(r.leadSignals),r.pageViews?pct(r.leadSignals/r.pageViews):"—"]);
  const campaignRow=(r)=>row([r.campaign,r.source,number.format(r.pageViews),number.format(r.leadSignals)]);
  const pageRow=(r)=>row([r.path,number.format(r.pageViews),number.format(r.engagement),number.format(r.leadSignals)]);
  function renderGeography(rows){const host=$("geography-list");clear(host);if(!rows?.length){host.append(text("p","Geography will appear as new visits are recorded.","placeholder"));return}const max=rows[0].count||1;rows.slice(0,7).forEach(r=>{const item=document.createElement("div");item.className="rank-item";item.append(text("span",r.location),text("b",number.format(r.count)));const bar=document.createElement("span");bar.className="rank-bar";const fill=document.createElement("i");fill.style.width=`${r.count/max*100}%`;bar.append(fill);item.append(bar);host.append(item)})}
  function renderFunnel(totals){const host=$("funnel");clear(host);const steps=[["Contact CTA clicks",totals.cta_contact_click||0],["Form starts",totals.contact_started||0],["Completed contacts",totals.contact_submitted||0]];const max=Math.max(1,...steps.map(s=>s[1]));steps.forEach(([label,value])=>{const item=document.createElement("div");item.className="funnel-step";item.append(text("span",label),text("strong",number.format(value)));const bar=document.createElement("span");bar.className="funnel-bar";const fill=document.createElement("i");fill.style.width=`${value/max*100}%`;bar.append(fill);item.append(bar);host.append(item)})}
  function renderActivity(rows){const host=$("activity-list");clear(host);if(!rows?.length){host.append(text("p","No recent events in this window.","placeholder"));return}rows.slice(0,9).forEach(r=>{const item=document.createElement("div");item.className="activity-item";const time=text("time",new Date(r.timestamp).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}));item.append(time,text("strong",r.event.replaceAll("_"," ")),text("span",r.path));host.append(item)})}
  function updateCampaignUrl(){try{const url=new URL($("utm-url").value||"https://oneshotlens.com/");[["source","utm-source"],["medium","utm-medium"],["campaign","utm-campaign"],["content","utm-content"]].forEach(([key,id])=>{const value=$(id).value.trim();if(value)url.searchParams.set(`utm_${key}`,value);else url.searchParams.delete(`utm_${key}`)});$("campaign-output").textContent=url.toString()}catch{$("campaign-output").textContent="Enter a valid destination URL."}}
  function exportCsv(){if(!state.report)return;const lines=[["OneShotLens analytics",`${state.days} days`],["Generated",state.report.generatedAt],["Metric","Count"],...Object.entries(state.report.current.totals),[],["Page","Views","Engagement","Lead signals"],...state.report.current.pages.map(p=>[p.path,p.pageViews,p.engagement,p.leadSignals])];const csv=lines.map(line=>line.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`oneshotlens-analytics-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href)}

  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll("[data-days]").forEach(button=>button.addEventListener("click",()=>{state.days=Number(button.dataset.days);document.querySelectorAll("[data-days]").forEach(b=>b.classList.toggle("active",b===button));if(state.report)loadReport()}));
    $("access-form").addEventListener("submit",event=>{event.preventDefault();state.preview=false;state.token=$("token-input").value.trim();sessionStorage.setItem("osl-report-token",state.token);loadReport()});
    $("preview-button").addEventListener("click",()=>{state.preview=true;loadReport()}); $("refresh-button").addEventListener("click",loadReport); $("export-button").addEventListener("click",exportCsv);
    ["utm-url","utm-source","utm-medium","utm-campaign","utm-content"].forEach(id=>$(id).addEventListener("input",updateCampaignUrl));
    $("copy-campaign").addEventListener("click",async()=>{await navigator.clipboard.writeText($("campaign-output").textContent);$("copy-campaign").textContent="Copied";setTimeout(()=>$("copy-campaign").textContent="Copy URL",1400)});
    if(state.token)loadReport();else $("access-dialog").showModal();
  });
})();
