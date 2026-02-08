"""
Embedded HTML templates - used when templates/ folder is not deployed (e.g. Render).
Ensures the app works even without the templates folder in the repo.
"""

CAPTURE_HTML = r'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pallet Ticket Capture</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 25px; text-align: center; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .main-row { display: flex; gap: 20px; margin-bottom: 20px; align-items: flex-start; flex-wrap: wrap; }
        .camera-col { flex: 0 0 auto; min-width: 320px; }
        .data-col { flex: 1; min-width: 280px; }
        .section { background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .camera-select { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
        .camera-select label { font-weight: bold; display: block; margin-bottom: 8px; color: #333; }
        .camera-select select { width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; background: white; }
        .camera-frame { position: relative; width: 100%; max-width: 360px; min-height: 400px; margin: 0 auto 20px; border: 4px solid #333; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3); background: #000; aspect-ratio: 3/4; }
        .camera-frame.capture-good { border-color: #4CAF50; box-shadow: 0 0 30px rgba(76, 175, 80, 0.6); animation: captureFlash 0.5s ease; }
        @keyframes captureFlash { 0% { box-shadow: 0 0 40px rgba(76, 175, 80, 0.9); } 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.3); } }
        .camera-frame video, .camera-frame #videoPlaceholder { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
        #video { background: #000; display: none; }
        #videoPlaceholder { width: 100%; height: 100%; min-height: 400px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; text-align: center; padding: 20px; }
        .countdown-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; font-size: 120px; font-weight: bold; color: white; text-shadow: 0 0 20px rgba(0,0,0,0.8); z-index: 10; }
        .countdown-overlay.active { display: flex; }
        .countdown-overlay.green { background: rgba(76, 175, 80, 0.85); font-size: 80px; }
        .camera-status { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: rgba(0,0,0,0.75); color: white; font-size: 14px; font-weight: 600; text-align: center; z-index: 5; }
        .camera-status.ready { background: rgba(33, 150, 243, 0.9); }
        .camera-status.processing { background: rgba(245, 124, 0, 0.9); }
        .camera-status.success { background: rgba(56, 142, 60, 0.9); }
        .camera-status.error { background: rgba(211, 47, 47, 0.9); }
        #canvas { display: none; }
        .status { text-align: center; padding: 15px; margin: 20px 0; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .status.ready { background: #E3F2FD; color: #1976D2; }
        .status.processing { background: #FFF3E0; color: #F57C00; }
        .status.success { background: #E8F5E9; color: #388E3C; }
        .status.error { background: #FFEBEE; color: #D32F2F; }
        .controls { text-align: center; padding: 20px; }
        button { padding: 15px 30px; font-size: 18px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; margin: 10px; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
        .btn-start { background: #4CAF50; color: white; font-size: 20px; padding: 18px 40px; }
        .btn-stop { background: #f44336; color: white; }
        .btn-secondary { background: #2196F3; color: white; }
        .btn-test { background: #9E9E9E; color: white; font-size: 14px; }
        .btn-test.test-mode-on { background: #FF9800; font-weight: bold; }
        .error-box { background: #FFEBEE; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336; display: none; }
        .info { background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }
        .label-data { background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .label-data h3 { margin-bottom: 15px; color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
        .label-data-list { display: flex; flex-direction: column; gap: 8px; }
        .label-data-item { display: flex; flex-direction: column; padding: 10px 12px; background: #f9f9f9; border-radius: 6px; border-left: 3px solid #2196F3; }
        .label-data-item .field-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .label-data-item .field-value { font-size: 15px; font-weight: 600; color: #333; }
        .label-data-empty { color: #999; font-style: italic; padding: 20px; }
        .raw-ocr { margin-top: 15px; padding: 12px; background: #f5f5f5; border-radius: 6px; border: 1px solid #ddd; }
        .raw-ocr summary { cursor: pointer; font-weight: bold; color: #666; }
        .raw-ocr pre { margin-top: 10px; font-size: 12px; white-space: pre-wrap; max-height: 150px; overflow-y: auto; }
        .diag-collapse { background: #1e1e1e; color: #d4d4d4; border-radius: 10px; margin-bottom: 20px; overflow: hidden; }
        .diag-collapse summary { padding: 12px 16px; cursor: pointer; font-weight: bold; list-style: none; }
        .diag-collapse summary::-webkit-details-marker { display: none; }
        .diag-collapse summary::before { content: '▸ '; }
        .diag-collapse[open] summary::before { content: '▾ '; }
        .diag-collapse .diag-body { padding: 0 16px 16px; }
        .batch-summary { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 20px; }
        .batch-summary-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #2196F3; }
        .batch-summary-item .batch-id { font-weight: bold; font-size: 16px; }
        .batch-summary-item .batch-qty { font-weight: bold; color: #1976D2; }
        .batch-summary-item .batch-desc { color: #555; font-size: 14px; }
        .labels-table-wrap { overflow-x: auto; max-height: 420px; overflow-y: auto; }
        .labels-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .labels-table th { background: #2196F3; color: white; padding: 10px 8px; text-align: left; position: sticky; top: 0; z-index: 1; }
        .labels-table td { padding: 8px; border-bottom: 1px solid #eee; }
        .labels-table tr:hover { background: #f5f9ff; }
        .labels-table-empty { color: #999; font-style: italic; padding: 20px; text-align: center; }
        .test-badge { background: #ff9800; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header"><h1>Pallet Ticket Capture</h1><p>Automated capture and OCR processing</p></div>
    <div class="container">
        <div class="info"><h3>Instructions:</h3><p>1. Select camera 2. Click START CAMERA 3. Allow camera access 4. Move label into frame, hold steady for countdown, remove label after capture</p></div>
        <div class="error-box" id="errorBox"></div>
        <div class="controls">
            <button id="startBtn" class="btn-start" onclick="startCamera()">START CAMERA</button>
            <button id="stopBtn" class="btn-stop" onclick="stopCamera()" style="display:none;">STOP CAMERA</button>
            <button class="btn-secondary" onclick="window.open('/report','_blank')">Daily Report</button>
            <button id="testModeBtn" class="btn-test" onclick="toggleTestMode()">Test Mode: OFF</button>
        </div>
        <div class="main-row">
            <div class="camera-col section"><div class="camera-select"><label>Camera:</label><select id="cameraSelect"><option value="">Loading...</option></select></div><div class="camera-frame" id="cameraFrame"><video id="video" autoplay playsinline></video><div id="videoPlaceholder">Camera not started. Click START CAMERA to begin</div><div class="countdown-overlay" id="countdownOverlay"></div><div class="camera-status ready" id="cameraStatus">Ready</div></div><canvas id="canvas"></canvas></div>
            <div class="data-col section label-data"><h3>Labels captured</h3><div class="labels-table-wrap"><table class="labels-table" id="labelsTable"><thead><tr><th>Batch ID</th><th>Mode</th><th>Capture Time</th><th>Handwritten #</th><th>SSCC</th><th>Quantity</th><th>Running Total</th></tr></thead><tbody id="labelsTableBody"><tr><td colspan="7" class="labels-table-empty">No labels yet – capture to see list</td></tr></tbody></table></div><details class="raw-ocr" style="margin-top:12px;"><summary>Raw OCR (last capture)</summary><pre id="rawOcrText">Nothing yet</pre></details></div>
        </div>
        <details class="diag-collapse"><summary>Process / Diagnostics</summary><div class="diag-body"><pre id="processLog" style="min-height:80px;max-height:180px;overflow-y:auto;padding:12px;background:#2d2d2d;border-radius:6px;border:1px solid #444;white-space:pre-wrap;font-family:monospace;">Loading...</pre><button type="button" onclick="loadDiagnostics()" style="margin-top:8px;padding:6px 12px;font-size:12px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;">Refresh diagnostics</button></div></details>
        <div id="status" class="status ready" style="display:none;"></div>
    </div>
    <script>
    var video,canvas,stream,isRunning=false,isProcessing=false,availableCameras=[],captureState='ready',stableFrameCount=0,exitFrameCount=0,prevFramePixels=null,testMode=false;
    var SHARPNESS_THRESHOLD=50,STABLE_FRAMES_NEEDED=5,EXIT_FRAMES_NEEDED=6,MOTION_THRESHOLD=15;
    window.addEventListener('DOMContentLoaded',function(){video=document.getElementById('video');canvas=document.getElementById('canvas');if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){alert('Camera not supported');return;}navigator.mediaDevices.enumerateDevices().then(function(d){var v=d.filter(function(x){return x.kind==='videoinput';});var s=document.getElementById('cameraSelect');s.innerHTML='';v.forEach(function(dev,i){var o=document.createElement('option');o.value=dev.deviceId;o.textContent=dev.label||'Camera '+(i+1);s.appendChild(o);});});testMode=localStorage.getItem('palletTestMode')==='true';updateTestModeBtn();loadDiagnostics();loadLabelsList();setTimeout(startCamera,800);});
function loadDiagnostics(){var el=document.getElementById('processLog');if(!el)return;el.textContent='Fetching...\n';fetch('/api/diagnostics').then(function(r){if(!r.ok)throw new Error(r.status);return r.json();}).then(function(d){var t='--- System Status ---\n';t+='OCR: '+(d.ocr_ready?'YES':'NO')+'\n';t+='Sheets connected: '+(d.sheets_connected?'YES':'NO')+'\n';t+='Sheets ID set: '+(d.sheets_id_set?'YES':'NO')+'\n';t+='Drive creds: '+(d.drive_creds_available?'YES':'NO')+'\n';t+='Drive folder ID: '+(d.drive_root_folder_id_set?'YES':'NO')+'\n';t+='---\nAfter capture, process details appear here.';el.textContent=t;}).catch(function(e){el.textContent='Diagnostics failed: '+e.message;});}
    function toggleTestMode(){testMode=!testMode;localStorage.setItem('palletTestMode',testMode);updateTestModeBtn();}
    function updateTestModeBtn(){var b=document.getElementById('testModeBtn');if(b){b.textContent=testMode?'Test Mode: ON':'Test Mode: OFF';b.classList.toggle('test-mode-on',testMode);}}
    function updateStatus(t,m){var s=document.getElementById('status');s.className='status '+t;s.textContent=m;var c=document.getElementById('cameraStatus');if(c){c.className='camera-status '+t;c.textContent=m;}}
    function startCamera(){var sel=document.getElementById('cameraSelect');var cid=sel.value;var c={video:{width:{ideal:720},height:{ideal:960},aspectRatio:{ideal:3/4}}};if(cid)c.video.deviceId={exact:cid};navigator.mediaDevices.getUserMedia(c).then(function(s){stream=s;video.srcObject=s;video.onloadedmetadata=function(){video.play().then(function(){document.getElementById('videoPlaceholder').style.display='none';video.style.display='block';document.getElementById('startBtn').style.display='none';document.getElementById('stopBtn').style.display='inline-block';isRunning=true;updateStatus('ready','Ready - move label into view');startFrameSampling();});};}).catch(function(e){alert('Camera error: '+e.message);});}
    function stopCamera(){isRunning=false;captureState='ready';if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}video.srcObject=null;video.style.display='none';document.getElementById('videoPlaceholder').style.display='flex';document.getElementById('startBtn').style.display='inline-block';document.getElementById('stopBtn').style.display='none';}
    function startFrameSampling(){if(!isRunning)return;try{canvas.width=video.videoWidth;canvas.height=video.videoHeight;var ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0);analyzeFrame();}catch(e){}setTimeout(startFrameSampling,400);}
    function getPixels(id){var d=id.data,w=id.width,h=id.height,p=[],step=12;for(var y=0;y<h;y+=step)for(var x=0;x<w;x+=step){var i=(y*w+x)*4;p.push((d[i]+d[i+1]+d[i+2])/3);}return p;}
    function motion(id,prev){if(!prev)return 999;var c=getPixels(id);if(c.length!==prev.length)return 999;var s=0;for(var i=0;i<c.length;i++)s+=Math.abs(c[i]-prev[i]);return s/c.length;}
    function sharpness(id){var d=id.data,w=id.width,h=id.height,v=0,m=0,n=0;for(var y=1;y<h-1;y+=10)for(var x=1;x<w-1;x+=10){var idx=(y*w+x)*4;var g=(d[idx]+d[idx+1]+d[idx+2])/3;var ni=(y*w+(x+1))*4;var ng=(d[ni]+d[ni+1]+d[ni+2])/3;m+=Math.abs(g-ng);n++;}if(n===0)return 0;m/=n;for(var y=1;y<h-1;y+=10)for(var x=1;x<w-1;x+=10){var idx=(y*w+x)*4;var g=(d[idx]+d[idx+1]+d[idx+2])/3;var ni=(y*w+(x+1))*4;var ng=(d[ni]+d[ni+1]+d[ni+2])/3;v+=Math.pow(Math.abs(g-ng)-m,2);}return v/n;}
    function analyzeFrame(){if(isProcessing||!isRunning)return;try{var ctx=canvas.getContext('2d',{willReadFrequently:true});var id=ctx.getImageData(0,0,canvas.width,canvas.height);var sh=sharpness(id);if(captureState==='capturing'||captureState==='countdown')return;if(captureState==='wait_exit'){if(sh<SHARPNESS_THRESHOLD*0.7){exitFrameCount++;if(exitFrameCount>=EXIT_FRAMES_NEEDED){captureState='ready';exitFrameCount=0;prevFramePixels=null;updateStatus('ready','Ready for next label');}}else exitFrameCount=0;return;}if(captureState==='ready'){prevFramePixels=getPixels(id);if(sh>SHARPNESS_THRESHOLD){captureState='label_in_view';stableFrameCount=0;updateStatus('processing','Hold steady...');}return;}if(captureState==='label_in_view'||captureState==='checking'){if(sh<SHARPNESS_THRESHOLD){captureState='ready';stableFrameCount=0;prevFramePixels=null;return;}var mot=motion(id,prevFramePixels);prevFramePixels=getPixels(id);if(mot<MOTION_THRESHOLD){stableFrameCount++;captureState='checking';if(stableFrameCount>=STABLE_FRAMES_NEEDED){captureState='countdown';captureWithCountdown();}}else{stableFrameCount=0;updateStatus('processing','Hold steady...');}}}catch(e){}}
    function captureWithCountdown(){if(isProcessing)return;isProcessing=true;captureState='capturing';var frame=document.getElementById('cameraFrame'),overlay=document.getElementById('countdownOverlay');if(stream)stream.getTracks().forEach(function(t){t.enabled=false;});var fc=document.createElement('canvas');fc.width=canvas.width;fc.height=canvas.height;fc.getContext('2d').drawImage(canvas,0,0);var v=document.getElementById('video'),ph=document.getElementById('videoPlaceholder');ph.style.backgroundImage='url('+fc.toDataURL('image/jpeg')+')';ph.style.backgroundSize='cover';ph.style.display='flex';ph.innerHTML='';var doCap=function(){overlay.classList.add('green');overlay.textContent='OK';updateStatus('processing','Processing...');setTimeout(function(){overlay.classList.remove('active','green');overlay.textContent='';if(stream)stream.getTracks().forEach(function(t){t.enabled=true;});v.style.display='block';ph.style.backgroundImage='';ph.style.display='none';captureState='wait_exit';exitFrameCount=0;updateStatus('success','Captured! Remove label');var w=fc.width,h=fc.height,m=800;if(w>m||h>m){var sc=m/Math.max(w,h);w=Math.round(w*sc);h=Math.round(h*sc);}var cc=document.createElement('canvas');cc.width=w;cc.height=h;cc.getContext('2d').drawImage(fc,0,0,w,h);submitTicket(cc.toDataURL('image/jpeg',0.7));},500);};overlay.classList.add('active');overlay.classList.remove('green');var cd=function(n){if(n>0){overlay.textContent=n;updateStatus('processing','Hold... '+n);setTimeout(function(){cd(n-1);},1000);}else{frame.classList.add('capture-good');doCap();}};cd(3);}
    var capturedRecords=[];
    function submitTicket(img){updateStatus('processing','Running OCR...');fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:img,test_mode:testMode})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,status:r.status,data:d};});}).then(function(_){var d=_.data;if(d.duplicate){if(d.record)document.getElementById('rawOcrText').textContent=d.record.raw_ocr_text||'(none)';updateStatus('error','Duplicate - use Test Mode');captureState='ready';isProcessing=false;return;}if(d.success){if(d.record){capturedRecords.push(d.record);loadLabelsList();document.getElementById('rawOcrText').textContent=d.record.raw_ocr_text||'(none)';}var m=d.message||'Submitted!';if(d.sheets_error)m+=' Sheet: '+d.sheets_error;updateStatus('success',m);isProcessing=false;var pl=document.getElementById('processLog');if(pl){var tx=(pl.textContent||'').replace(/After capture.*/,'');tx+='--- Last capture ---\n';tx+='OCR: done\n';tx+='Drive: '+(d.drive_uploaded?'OK':'skipped')+'\n';tx+='Sheets: '+(d.sheets_submitted?'OK':'FAILED')+(d.sheets_error?' - '+d.sheets_error:'')+'\n';pl.textContent=tx;pl.scrollTop=pl.scrollHeight;}}else{throw new Error(d.message||d.error||'Failed');}}).catch(function(e){updateStatus('error','Error: '+e.message);captureState='ready';isProcessing=false;});}
    function escapeHtml(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
    function loadLabelsList(){fetch('/api/pending').then(function(r){return r.json();}).then(function(d){renderLabelsTable(d.records||[]);}).catch(function(){var t=document.getElementById('labelsTableBody');if(t)t.innerHTML='<tr><td colspan="7" class="labels-table-empty">Error loading labels</td></tr>';});}
    function renderLabelsTable(records){var tbody=document.getElementById('labelsTableBody');if(!tbody)return;if(!records.length){tbody.innerHTML='<tr><td colspan="7" class="labels-table-empty">No labels yet – capture to see list</td></tr>';return;}var byBatch={};records.forEach(function(r){var b=(r.batch_no||'').toString().trim()||'(no batch)';if(!byBatch[b])byBatch[b]=[];byBatch[b].push(r);});Object.keys(byBatch).sort().forEach(function(bid){byBatch[bid].sort(function(a,b){var ha=parseInt(a.handwritten_number,10),hb=parseInt(b.handwritten_number,10);if(!isNaN(ha)&&!isNaN(hb))return ha-hb;return String(a.handwritten_number||'').localeCompare(String(b.handwritten_number||''));});});var h='',run=0;Object.keys(byBatch).sort().forEach(function(bid){run=0;byBatch[bid].forEach(function(r){var qty=parseInt(r.quantity,10)||0;run+=qty;var sscc=(r.sscc||'').toString().substring(0,20);var ct=r.timestamp?new Date(r.timestamp).toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'}):'—';var mb=(r.test_mode||(r.notes||'').indexOf('TEST MODE')>=0)?'<span class="test-badge">TEST</span>':'';h+='<tr><td>'+escapeHtml(bid)+'</td><td>'+mb+'</td><td>'+escapeHtml(ct)+'</td><td>'+escapeHtml(String(r.handwritten_number||''))+'</td><td>'+escapeHtml(sscc)+'</td><td>'+escapeHtml(String(r.quantity||''))+'</td><td>'+run+'</td></tr>';});});tbody.innerHTML=h;}
    </script>
</body>
</html>'''

REVIEW_HTML = r'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pallet Ticket Review</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:20px;}
        .header{background:linear-gradient(135deg,#4CAF50 0%,#388E3C 100%);color:white;padding:25px;border-radius:10px;margin-bottom:20px;}
        .records-table{background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:20px;}
        .table-row{display:grid;grid-template-columns:auto 1fr 1fr 1fr auto;gap:15px;padding:15px;border-bottom:1px solid #eee;cursor:pointer;align-items:center;}
        .table-row:hover{background:#f9f9f9;}
        .table-row.header-row{font-weight:bold;background:#f0f0f0;cursor:default;}
        .thumbnail{width:80px;height:80px;object-fit:cover;border-radius:6px;}
        .status-badge{padding:6px 12px;border-radius:6px;font-size:12px;font-weight:bold;}
        .status-pending{background:#fff3cd;color:#856404;}
        .status-captured{background:#d4edda;color:#155724;}
        .status-approved{background:#d4edda;color:#155724;}
        .status-rejected{background:#f8d7da;color:#721c24;}
        .review-panel{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;display:none;overflow-y:auto;padding:20px;}
        .review-panel.active{display:block;}
        .review-content{background:white;margin:20px auto;max-width:900px;border-radius:10px;padding:30px;box-shadow:0 8px 24px rgba(0,0,0,0.3);}
        .review-image{width:100%;max-width:700px;margin:20px auto;display:block;border-radius:8px;}
        .review-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin:20px 0;}
        .field-group{display:flex;flex-direction:column;}
        .field-label{font-weight:bold;margin-bottom:5px;color:#555;}
        .field-value{padding:10px;border:2px solid #ddd;border-radius:6px;background:#f9f9f9;}
        .review-actions{display:flex;gap:15px;margin-top:25px;padding-top:25px;border-top:2px solid #eee;}
        .btn-approve,.btn-reject{flex:1;padding:15px;border:none;border-radius:8px;font-size:18px;font-weight:bold;cursor:pointer;color:white;}
        .btn-approve{background:#4CAF50;}
        .btn-reject{background:#f44336;}
        .empty-state{text-align:center;padding:60px 20px;color:#999;font-size:18px;}
    </style>
</head>
<body>
    <div class="header"><h1>Pallet Ticket Review</h1><button onclick="loadRecords()" style="margin-top:10px;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">Refresh</button><span id="statusMsg" style="margin-left:15px;color:rgba(255,255,255,0.9);"></span></div>
    <div class="records-table">
        <div class="table-row header-row"><div>Image</div><div>Timestamp</div><div>Item No</div><div>Description</div><div>Status</div></div>
        <div id="recordsBody"><div class="empty-state">Loading...</div></div>
    </div>
    <div class="review-panel" id="reviewPanel"><div class="review-content"><div id="reviewContent"></div></div></div>
    <script>
    var records=[],currentRecord=null;
    window.addEventListener('DOMContentLoaded',loadRecords);
    function loadRecords(){fetch('/api/pending').then(function(r){return r.json();}).then(function(d){records=d.records||[];document.getElementById('statusFilter')&&(records=records.filter(function(r){return r.status===(document.getElementById('statusFilter').value||'PENDING');}));displayRecords(records);document.getElementById('statusMsg').textContent=records.length+' records';}).catch(function(){document.getElementById('statusMsg').textContent='Error loading';});}
    function displayRecords(recs){var t=document.getElementById('recordsBody');if(!recs.length){t.innerHTML='<div class="empty-state">No records</div>';return;}t.innerHTML=recs.map(function(r,i){var ts=r.timestamp?new Date(r.timestamp).toLocaleString():'N/A',item=r.sscc||r.item_number||'N/A',desc=r.item_description||'N/A',st=r.status||'PENDING',img=r.image_path?'<img src="'+r.image_path+'" class="thumbnail" onerror="this.style.display=\'none\'">':'<div class="thumbnail" style="background:#ddd;display:flex;align-items:center;justify-content:center;color:#999;">No Image</div>';return'<div class="table-row" onclick="openReview('+i+')">'+'<div>'+img+'</div><div>'+ts+'</div><div>'+item+'</div><div>'+desc+'</div><div><span class="status-badge status-'+st.toLowerCase()+'">'+st+'</span></div></div>';}).join('');}
    function openReview(i){currentRecord=records[i];var p=document.getElementById('reviewPanel'),c=document.getElementById('reviewContent');var img=currentRecord.image_path?'<img src="'+currentRecord.image_path+'" class="review-image">':'<p>No image</p>';var fields=[['SSCC',currentRecord.sscc],['Item Number',currentRecord.item_number],['Description',currentRecord.item_description],['Batch',currentRecord.batch_no],['Quantity',currentRecord.quantity],['Date',currentRecord.date],['Time',currentRecord.time],['Handwritten',currentRecord.handwritten_number]];var fhtml=fields.map(function(x){return'<div class="field-group"><div class="field-label">'+x[0]+'</div><div class="field-value">'+(x[1]||'N/A')+'</div></div>';}).join('');var st=(currentRecord.status||'').toUpperCase();var showActions=st==='PENDING'&&currentRecord._rowNumber;var actionsHtml=showActions?'<div class="review-actions"><button class="btn-approve" onclick="approveRecord()">APPROVE</button><button class="btn-reject" onclick="showReject()">REJECT</button></div><textarea id="rejectReason" placeholder="Reason..." style="width:100%;padding:10px;margin-top:10px;display:none;border:2px solid #ddd;border-radius:6px;"></textarea><button id="confirmReject" class="btn-reject" style="display:none;margin-top:10px;width:100%;" onclick="confirmReject()">Confirm Reject</button>':'<p style="margin-top:20px;color:#155724;font-weight:bold;">Captured – no review required</p>';c.innerHTML='<div style="display:flex;justify-content:space-between;margin-bottom:20px;"><h2>Label Details</h2><button onclick="closeReview()" style="padding:10px 20px;background:#f44336;color:white;border:none;border-radius:6px;cursor:pointer;">Close</button></div>'+img+'<div class="review-fields">'+fhtml+'</div><div style="margin:20px 0;padding:15px;background:#f9f9f9;border-radius:6px;"><h3>Raw OCR</h3><pre style="white-space:pre-wrap;font-size:12px;max-height:200px;overflow-y:auto;">'+(currentRecord.raw_ocr_text||'')+'</pre></div>'+actionsHtml;p.classList.add('active');}
    function closeReview(){document.getElementById('reviewPanel').classList.remove('active');currentRecord=null;}
    function showReject(){document.getElementById('rejectReason').style.display='block';document.getElementById('confirmReject').style.display='block';}
    function approveRecord(){if(!currentRecord||!currentRecord._rowNumber){alert('Row number not available');return;}fetch('/api/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_number:currentRecord._rowNumber})}).then(function(r){return r.json();}).then(function(d){if(d.success){alert('Approved!');closeReview();loadRecords();}else alert('Error: '+d.error);}).catch(function(e){alert('Error: '+e.message);});}
    function confirmReject(){var reason=document.getElementById('rejectReason').value.trim();if(!reason){alert('Enter reason');return;}if(!currentRecord||!currentRecord._rowNumber){alert('Row number not available');return;}fetch('/api/reject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_number:currentRecord._rowNumber,reason:reason})}).then(function(r){return r.json();}).then(function(d){if(d.success){alert('Rejected!');closeReview();loadRecords();}else alert('Error: '+d.error);}).catch(function(e){alert('Error: '+e.message);});}
    </script>
</body>
</html>'''

REPORT_HTML = r'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Report - Pallet Ticket Capture</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:20px;}
        .header{background:linear-gradient(135deg,#673AB7 0%,#512DA8 100%);color:white;padding:25px;border-radius:10px;margin-bottom:20px;text-align:center;}
        .header h1{font-size:24px;margin-bottom:10px;}
        .section{background:white;border-radius:10px;padding:25px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:600px;margin-left:auto;margin-right:auto;}
        .section p{margin:15px 0;color:#555;line-height:1.6;}
        .btn{display:inline-block;padding:15px 30px;font-size:16px;font-weight:bold;border:none;border-radius:8px;cursor:pointer;text-decoration:none;color:white;margin:10px 5px 10px 0;}
        .btn-primary{background:#673AB7;}
        .btn-primary:hover{background:#5E35B1;}
        .btn-cleanup{background:#F44336;}
        .btn-back{background:#757575;}
        .note{background:#FFF3E0;border-left:4px solid #FF9800;padding:15px;margin:20px 0;border-radius:6px;font-size:14px;}
        .report-range{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:20px 0;}
        .range-group{display:flex;flex-direction:column;gap:6px;}
        .range-group label{font-weight:600;font-size:13px;color:#333;}
        .range-group input{padding:10px;font-size:14px;border:2px solid #ddd;border-radius:6px;}
        .range-group input:focus{outline:none;border-color:#673AB7;}
        .filter-by{margin:15px 0;padding:15px;background:#f9f9f9;border-radius:8px;}
        .filter-by label{display:flex;align-items:center;gap:10px;cursor:pointer;margin:8px 0;}
        .filter-by input[type="radio"]{accent-color:#673AB7;}
    </style>
</head>
<body>
    <div class="header"><h1>Daily Compliance Report</h1><p>Summary first (pallets, quantity) then images. Reports run Tue-Fri 7am. Default: last 24h by capture time. Images kept 7 days.</p></div>
    <div class="section">
        <p>Generate a PDF report. Default: labels captured in the last 24 hours (by capture time). Adjust dates/times if needed.</p>
        <div class="filter-by"><strong>Filter by:</strong>
            <label><input type="radio" name="filterBy" value="capture" checked>Capture time (when label was photographed) — default for reports</label>
            <label><input type="radio" name="filterBy" value="label">Label creation time (date/time printed on pallet label)</label>
        </div>
        <div class="report-range">
            <div class="range-group"><label for="fromDate">Start date</label><input type="date" id="fromDate"></div>
            <div class="range-group"><label for="fromTime">Start time</label><input type="time" id="fromTime" value="07:00"></div>
            <div class="range-group"><label for="toDate">End date</label><input type="date" id="toDate"></div>
            <div class="range-group"><label for="toTime">End time</label><input type="time" id="toTime" value="07:00"></div>
        </div>
        <a href="/api/generate-report" class="btn btn-primary" id="generateLink" download>Generate PDF Report</a>
        <a href="#" class="btn btn-cleanup" id="cleanupLink" onclick="return confirm('Generate report AND delete images older than 7 days?');">Generate + Clean Up Old Images</a>
        <p style="margin-top:12px;font-size:13px;color:#666;">Report empty? Try: <a href="/api/generate-report?days=7&filter_by=capture" download>Last 7 days (server)</a> · <a href="/api/generate-report?all=1&filter_by=capture" download>Include all</a></p>
        <a href="/" class="btn btn-back">Back to Capture</a>
        <div class="note"><strong>Compliance:</strong> Download the PDF first. Choose "Capture time" for when labels were photographed, or "Label creation time" for the date/time printed on the pallet. Default is capture time. Auto-reports run Tue-Fri at 7am. Images older than 7 days are removed when you use "Clean Up".</div>
    </div>
    <script>
    (function(){function pad(x){return(x<10?'0':'')+x;}
    var n=new Date(),sd=new Date(n.getTime()-24*60*60*1000);
    document.getElementById('fromDate').value=sd.toISOString().slice(0,10);document.getElementById('fromTime').value=pad(sd.getHours())+':'+pad(sd.getMinutes());
    document.getElementById('toDate').value=n.toISOString().slice(0,10);document.getElementById('toTime').value=pad(n.getHours())+':'+pad(n.getMinutes());
    function buildUrl(cleanup){var fd=document.getElementById('fromDate').value,ft=document.getElementById('fromTime').value,td=document.getElementById('toDate').value,tt=document.getElementById('toTime').value,fb=document.querySelector('input[name="filterBy"]:checked').value;var u='/api/generate-report?from_date='+encodeURIComponent(fd)+'&from_time='+encodeURIComponent(ft)+'&to_date='+encodeURIComponent(td)+'&to_time='+encodeURIComponent(tt)+'&filter_by='+encodeURIComponent(fb);if(cleanup)u+='&cleanup=1';return u;}
    function up(){document.getElementById('generateLink').href=buildUrl(false);document.getElementById('cleanupLink').href=buildUrl(true);}
    ['fromDate','fromTime','toDate','toTime'].forEach(function(id){document.getElementById(id).addEventListener('change',up);});
    document.querySelectorAll('input[name="filterBy"]').forEach(function(r){r.addEventListener('change',up);});up();})();
    </script>
</body>
</html>'''
