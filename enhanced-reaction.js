(function () { // Run the plugin in an isolated and strict JavaScript scope.
    'use strict';
    var GranularNavigator = function () {  // Define the plugin name, version, and unique ID.
    this.name = 'Enhanced_Reaction_Explorer';
    this.version = '5.4.0';
    this.id = 'enhanced_reaction_explorer_v54';
};

    GranularNavigator.prototype.getName = function () { return this.name; }; // Provide the plugin metadata to MINERVA.
    GranularNavigator.prototype.getVersion = function () { return this.version; };
    GranularNavigator.prototype.getId = function () { return this.id; };
    
// Initialize the plugin and connect it to MINERVA.
    GranularNavigator.prototype.register = function (minervaProxy) {
        
        var container = minervaProxy.element; // Get the UI container provided by MINERVA.

        var style = document.createElement('style'); // Create the CSS styles for the plugin interface.
        
        style.innerHTML = `  
            .minerva-loader { border: 4px solid #f3f3f3; border-top: 4px solid #283593; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .modern-btn { border-radius: 8px; border: none; transition: 0.3s; cursor: pointer; font-family: inherit; }
            .ent-badge-container { display: inline-flex; align-items: center; margin: 4px; background: #fff; border: 1px solid #d1d9e6; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .ent-name { padding: 6px 10px; font-size: 12px; color: #1a237e; font-weight: bold; }
            .ent-rxn-btn { background: #283593; color: white; border: none; padding: 6px 10px; font-size: 10px; cursor: pointer; font-weight: bold; border-left: 1px solid #eee; }
            .ent-rxn-btn:hover { background: #d32f2f; }
            .rxn-card { background: #ffffff; border: 2px solid #283593; border-radius: 10px; padding: 15px; margin-top: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .rxn-header { font-size: 13px; font-weight: bold; color: #283593; border-bottom: 1px solid #eee; margin-bottom: 10px; padding-bottom: 5px; display: flex; justify-content: space-between; text-transform: uppercase; }
            .flow-box { display: flex; align-items: flex-start; justify-content: space-around; background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0; border: 1px dashed #283593; }
            .flow-item { text-align: center; font-size: 11px; flex: 1; }
            .flow-arrow { color: #d32f2f; font-weight: bold; font-size: 18px; flex: 0.3; text-align: center; margin-top: 10px; }
            .evidence-box { font-size: 11px; background: #fffde7; padding: 10px; border-radius: 6px; border: 1px solid #fff59d; line-height: 1.4; margin-bottom: 10px; }
            
            /* Detailed Table Styles */
            .detail-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; background: #fff; }
            .detail-table th { background: #283593; color: white; padding: 5px; text-align: left; text-transform: uppercase; }
            .detail-table td { border: 1px solid #eee; padding: 5px; color: #333; }
            .react-row { background: #fbe9e7; }
            .prod-row { background: #e8f5e9; }
            
            .json-toggle-btn { width: 100%; padding: 6px; background: #444; color: #eee; font-size: 9px; border-radius: 4px; cursor: pointer; border: none; margin-top: 10px; }
            .json-pre { background: #1a1a1a; color: #00ff41; padding: 10px; font-size: 10px; border-radius: 6px; overflow-x: auto; margin-top: 8px; display: none; max-height: 200px; }
            .back-btn { background: #607d8b; color: white; padding: 8px 12px; margin-bottom: 15px; font-size: 12px; font-weight: bold; }
        `;
        document.head.appendChild(style);

        container.innerHTML = `  
            <div style="padding:15px; background:#f4f6f9; border:1px solid #ddd; font-family: 'Segoe UI', sans-serif; height: 100%; overflow-y: auto;">
                <h4 style="margin:0 0 15px 0; color:#283593; border-bottom: 3px solid #283593; padding-bottom:5px; text-transform: uppercase;">Enhanced Reaction Explorer</h4>
                <button id="btnMap" class="modern-btn" style="width:100%; padding:12px; margin-bottom:15px; background:#283593; color:white; font-weight:bold;">SYNC MAP ENTITIES</button>
                <div id="loaderContainer" style="display:none; text-align:center;"><div class="minerva-loader"></div><p style="font-size:11px; color:#666;">Querying Project BioEntities...</p></div>
                <select id="compDrop" style="width:100%; padding:12px; margin-bottom:10px; display:none; border-radius:8px; border:2px solid #283593; font-weight:bold;"></select>
                <button id="btnScanArea" class="modern-btn" style="width:100%; padding:12px; background:#43a047; color:white; display:none; font-weight:bold;">AUDIT COMPARTMENT</button>
                <div id="navLog" style="margin-top:15px; font-size:13px; min-height:450px; background:#fff; border:1px solid #ddd; padding:15px; border-radius:8px;">Ready to Sync.</div>
            </div>`;
// Store project data and connect variables to the main UI elements.
        var allEntities = [];
        var areas = {}; 
        var select = container.querySelector('#compDrop');
        var scanBtn = container.querySelector('#btnScanArea');
        var log = container.querySelector('#navLog');
        var loader = container.querySelector('#loaderContainer');

       // Load all MINERVA entities and collect the available compartments and submaps.
        container.querySelector('#btnMap').onclick = function () {
            loader.style.display = 'block';
            minervaProxy.project.data.getAllBioEntities().then(function (entities) {
                allEntities = entities;
                entities.forEach(function(e) {
                    var type = (e._type || e.type || "").toLowerCase();
                    if (type.indexOf("compartment") !== -1 || type.indexOf("submap") !== -1) areas[e.name] = e;
                });
                // Show the Audit button after regions are loaded.
                loader.style.display = 'none';
                select.innerHTML = '<option value="">-- SELECT COMPARTMENT --</option>';
                Object.keys(areas).sort().forEach(name => select.innerHTML += '<option value="'+name+'">'+name+'</option>');
                select.style.display = 'block'; scanBtn.style.display = 'block';
            });
        };
// Get the full data of the selected map region.
        scanBtn.onclick = function () {
            var name = select.value;
            if(!name) return;
            var box = areas[name];
            var typeBuckets = {}; 
// Get the selected region and prepare the entity groups for auditing.
            allEntities.forEach(ent => {
                var isInside = (ent.x >= (box.x - 5) && ent.x <= (box.x + box.width + 5) && ent.y >= (box.y - 5) && ent.y <= (box.y + box.height + 5));
                var type = ent._type || ent.type || "Unknown";
                if (isInside && ent.id !== box.id && type.toLowerCase().indexOf("reaction") === -1) {
                    if (!typeBuckets[type]) typeBuckets[type] = [];
                    typeBuckets[type].push(ent);
                }
            });
// Build and display the audited entity inventory with search and RXN buttons.
            var out = '<h3 style="color:#283593; margin:0 0 10px 0;">Inventory: ' + name + '</h3>' +
          '<input id="entitySearch" type="text" placeholder="Search Entity..." ' +
          'style="width:100%; box-sizing:border-box; padding:10px; margin-bottom:10px; border:2px solid #283593; border-radius:8px;">' +
          '<hr/>';
            Object.keys(typeBuckets).sort().forEach(typeName => {
                out += '<b style="text-transform:uppercase; color:#d32f2f; font-size:10px;">' + typeName + '</b><br/>';
                typeBuckets[typeName].forEach(ent => {
                    out += `<div class="ent-badge-container">
                               <span class="ent-name">${ent.name || "Unnamed"}</span>
                               <button class="ent-rxn-btn" data-id="${ent.id}" data-model="${ent.modelId || ent._modelId}" data-type="ALIAS">RXN</button>
                           </div>`;
                });
                out += '<div style="height:10px;"></div>';
            });
            log.innerHTML = out;
var searchInput = log.querySelector('#entitySearch');
// Filter the audited entity list in real time based on the search text.
searchInput.oninput = function () {
    var searchText = this.value.toLowerCase();

    log.querySelectorAll('.ent-badge-container').forEach(function (badge) {

        var entityName = badge
            .querySelector('.ent-name')
            .textContent
            .toLowerCase();

        if (entityName.indexOf(searchText) !== -1) {
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }

    });
};
         // Fetch and display reactions for the selected entity using the MINERVA API.
            log.querySelectorAll('.ent-rxn-btn').forEach(btn => {
                btn.onclick = function() {
                    var id = parseInt(this.getAttribute('data-id'));
                    var mId = parseInt(this.getAttribute('data-model'));
                    var type = this.getAttribute('data-type');
                    
                    log.innerHTML = '<div class="minerva-loader"></div><p align="center">Fetching Sequence...</p>';
                    
                    minervaProxy.project.data.getReactionsWithElement({id: id, modelId: mId, type: type})
                        .then(function(reactions) {
                            var html = '<button id="backToList" class="modern-btn back-btn">⬅ BACK TO LIST</button>';
                            
                        // Build a reaction summary card with type, ID, flow, reference, and detail table.
                            
                            reactions.forEach((rxn) => {
                                // 1. Summary Header
                                var ref = rxn.references && rxn.references[0] ? rxn.references[0] : null;
                                
                                html += `
                                    <div class="rxn-card">
                                        <div class="rxn-header">
                                            <span>${rxn._type}</span>
                                            <span style="color:#666; font-size:9px;">ID: ${rxn._reactionId}</span>
                                        </div>
                                        
                                        <div class="flow-box">
                                            <div class="flow-item"><b>REACTION START</b><br>${rxn._reactants.length} Input(s)</div>
                                            <div class="flow-arrow">➔</div>
                                            <div class="flow-item"><b>REACTION END</b><br>${rxn._products.length} Output(s)</div>
                                        </div>

                                        <table class="detail-table">
                                            <thead><tr><th>Category</th><th>Name</th><th>ID</th><th>Type</th><th>Coords (X,Y)</th></tr></thead>
                                            <tbody>`;
                                
                                // List All Reactants
                                rxn._reactants.forEach(r => {
                                    var a = r._alias;
                                    html += `<tr class="react-row">
                                        <td><b>REACTANT</b></td>
                                        <td>${a.name}</td>
                                        <td>${a.id}</td>
                                        <td>${a._type}</td>
                                        <td>${Math.round(a.x)}, ${Math.round(a.y)}</td>
                                    </tr>`;
                                });

                                // List All Products
                                rxn._products.forEach(p => {
                                    var a = p._alias;
                                    html += `<tr class="prod-row">
                                        <td><b>PRODUCT</b></td>
                                        <td>${a.name}</td>
                                        <td>${a.id}</td>
                                        <td>${a._type}</td>
                                        <td>${Math.round(a.x)}, ${Math.round(a.y)}</td>
                                    </tr>`;
                                });
// Display reaction references and raw JSON, handle navigation, and register the plugin with MINERVA.
                                html += `</tbody></table>`;

                                if(ref) {
                                    html += `<div class="evidence-box" style="margin-top:10px;">
                                        <b>Reference:</b> <i>"${ref._article ? ref._article._title : 'View Paper'}"</i><br>
                                        <a href="${ref._link}" target="_blank">PubMed: ${ref._resource}</a>
                                    </div>`;
                                }

                                html += `
                                    <button class="json-toggle-btn" onclick="const p = this.nextElementSibling; p.style.display = (p.style.display === 'block' ? 'none' : 'block');">Toggle Raw JSON Data</button>
                                    <pre class="json-pre">${JSON.stringify(rxn, null, 2)}</pre>
                                </div><br>`;
                            });
                            log.innerHTML = html;
                            container.querySelector('#backToList').onclick = () => scanBtn.click();
                        });
                };
            });
        };
    };

    if (typeof minervaDefine === 'function') {
        minervaDefine(function () { return new GranularNavigator(); });
    }
}());
