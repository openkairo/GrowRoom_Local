class LocalGrowBoxPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
        this._activeTab = 'overview'; // 'overview', 'settings', 'phases'
        this._draft = {}; // entryId -> { key: value }
    }

    set hass(hass) {
        this._hass = hass;
        this._update();
    }

    set narrow(narrow) {
        this._narrow = narrow;
        this._update();
    }

    set panel(panel) {
        this._panel = panel;
        this._update();
    }

    _update() {
        if (!this._hass) return;

        // Initialize fetching devices once
        if (!this._initialized) {
            this._initialized = true;
            this._fetchDevices();
        }

        // Re-render logic
        if (this._devices) {
            // If we are in Settings or Phases, DO NOT blow away the DOM on every state update.
            // The user is likely typing or selecting.
            if (this._activeTab === 'settings' || this._activeTab === 'phases') {
                // But we MUST update the hass object on pickers so they can search
                if (this.shadowRoot) {
                    this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(picker => {
                        picker.hass = this._hass;
                    });
                }
                return;
            }

            // In Overview, we want live updates, but maybe debounce or check logic?
            // for now, just render is fine as it's read-only
            this._render();
        }
    }

    async _fetchDevices() {
        if (!this._hass) return;

        // Ensure helpers are loaded (might trigger Custom Element upgrades for ha-selector)
        if (window.loadCardHelpers) {
            try {
                await window.loadCardHelpers();
            } catch (e) { console.warn("Could not load card helpers", e); }
        }

        try {
            const devices = await this._hass.callWS({ type: 'config/device_registry/list' });
            const entities = await this._hass.callWS({ type: 'config/entity_registry/list' });
            const entries = await this._hass.callWS({ type: 'config_entries/get', domain: 'local_grow_box' });
            // console.log("Fetched entries:", entries);

            // Filter: Look for devices with identifiers matching our domain
            const myDevices = devices.filter(d =>
                d.identifiers && d.identifiers.some(id => id[0] === 'local_grow_box')
            );

            // map() with async is tricky, use Promise.all
            this._devices = await Promise.all(myDevices.map(async device => {
                const deviceEntities = entities.filter(e => e.device_id === device.id);
                const entry = entries.find(e => e.entry_id === device.primary_config_entry);

                // console.log(`[FETCH] Device: ${device.name} (${device.id})`);

                // Fetch actual config via custom command because standard list might exclude options
                let combinedOptions = {};
                if (entry) {
                    try {
                        const confResp = await this._hass.callWS({
                            type: 'local_grow_box/get_config',
                            entry_id: entry.entry_id
                        });
                        combinedOptions = confResp.config || {};
                        // console.log(`[FETCH] -> Fetched Config:`, combinedOptions);
                    } catch (e) {
                        console.warn(`[FETCH] Failed to fetch config for ${device.name}:`, e);
                    }
                }

                const findEntity = (uniqueIdSuffix) => {
                    const ent = deviceEntities.find(e => e.unique_id.endsWith(uniqueIdSuffix));
                    return ent ? ent.entity_id : null;
                };

                return {
                    name: device.name_by_user || device.name,
                    id: device.id,
                    entryId: entry ? entry.entry_id : null,
                    options: combinedOptions,
                    entities: {
                        phase: findEntity('_phase'),
                        master: findEntity('_master_switch'),
                        vpd: findEntity('_vpd'),
                        pump: findEntity('_water_pump'),
                        days: findEntity('_days_in_phase'),
                    }
                };
            }));

            if (this.shadowRoot && this.shadowRoot.querySelector('.header')) {
                this._updateContent();
            } else {
                this._render();
            }
        } catch (err) {
            console.error("Error fetching grow boxes:", err);
        }
    }

    _render() {
        if (!this.shadowRoot) return;

        // If we haven't created the basic structure yet
        if (!this.shadowRoot.querySelector('.header')) {
            this._renderStructure();
        }

        this._updateContent();
    }

    _renderStructure() {
        const style = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
                
                :host {
                    --primary-color: #03a9f4;
                    --accent-color: #ff9800;
                    --bg-color: #111827;
                    --card-bg: #1f2937;
                    --text-primary: #f9fafb;
                    --text-secondary: #9ca3af;
                    --success-color: #10b981;
                    --danger-color: #ef4444;

                    /* Force HA Light Theme compatibility */
                    --primary-text-color: #f9fafb;
                    --secondary-text-color: #9ca3af;
                    --paper-input-container-color: rgba(255, 255, 255, 0.5);
                    --paper-input-container-focus-color: #03a9f4;
                    --mdc-theme-primary: #03a9f4;
                    --mdc-text-field-ink-color: #ffffff;
                    --mdc-select-ink-color: #ffffff;
                    --mdc-text-field-label-ink-color: #9ca3af;
                    --mdc-text-field-fill-color: rgba(255, 255, 255, 0.05);

                    font-family: 'Roboto', sans-serif;
                    display: block;
                    /* Modern Tech Pattern Background */
                    background-color: #0b1121;
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.08) 0px, transparent 50%), 
                        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.08) 0px, transparent 50%), 
                        radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 100% 100%, 100% 100%, 24px 24px;
                    background-attachment: fixed;
                    min-height: 100vh;
                    color: var(--text-primary);
                }
                

                
                /* Layout */
                .header { 
                    background-color: var(--card-bg); 
                    padding: 16px 24px; 
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex; align-items: center; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 24px; 
                    font-weight: 800; 
                    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    display: flex; align-items: center; gap: 8px;
                    letter-spacing: -0.5px;
                    text-transform: uppercase;
                }
                
                .tabs { 
                    display: flex; gap: 8px; margin-left: auto; margin-right: 0; 
                    background: rgba(0,0,0,0.3); padding: 4px; border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .tab { 
                    cursor: pointer; padding: 6px 16px; border-radius: 16px;
                    opacity: 0.7; transition: all 0.2s; text-transform: uppercase; 
                    font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
                    color: var(--text-secondary);
                    border: 1px solid transparent;
                }
                .tab:hover { opacity: 1; color: var(--text-primary); background: rgba(255,255,255,0.05); }
                .tab.active { 
                    opacity: 1; 
                    background: var(--primary-color); 
                    color: white; 
                    box-shadow: 0 2px 8px rgba(3, 169, 244, 0.25);
                    border-color: rgba(255,255,255,0.1);
                }

                .content { padding: 24px; max-width: 1200px; margin: 0 auto; }
                
                /* Cards */
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }
                
                .card {
                    background: var(--card-bg);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255,255,255,0.05);
                }
                
                .card-image {
                    height: 200px; background: #000; position: relative;
                }
                .card-image img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
                .live-badge {
                    position: absolute; top: 12px; right: 12px;
                    background: rgba(220, 38, 38, 0.9); padding: 4px 8px;
                    border-radius: 4px; font-size: 10px; font-weight: bold;
                }
                
                .card-header {
                    padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .card-title { font-size: 18px; font-weight: 500; }
                .card-subtitle { font-size: 12px; color: var(--text-secondary); }
                
                .card-body { padding: 16px; }
                
                .stat-row { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; }
                .stat-label { color: var(--text-secondary); font-size: 13px; display: flex; align-items: center; gap: 8px; }
                .stat-value { font-weight: 500; font-size: 15px; }
                
                .bar-bg { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-top: 4px; }
                .bar-fill { height: 100%; border-radius: 3px; background: var(--primary-color); }
                
                /* Controls */
                .controls { 
                    padding: 16px; 
                    background: rgba(0,0,0,0.2); 
                    display: grid; 
                    grid-template-columns: 1fr 1fr 1fr; 
                    gap: 12px; 
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .btn {
                    padding: 12px; border-radius: 8px; border: none; cursor: pointer;
                    background: rgba(255,255,255,0.05); color: var(--text-primary);
                    font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-1px); }
                .btn.active { 
                    background: rgba(3, 169, 244, 0.2); 
                    color: #38bdf8; 
                    border-color: rgba(3, 169, 244, 0.4);
                }
                
                /* Enhanced UI Elements */
                .status-badge {
                    font-size: 11px; padding: 4px 10px; border-radius: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .status-badge.online { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-badge.offline { background: rgba(107, 114, 128, 0.15); color: #9ca3af; border: 1px solid rgba(107, 114, 128, 0.2); }

                .info-box {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 10px;
                    padding: 10px 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .info-icon { font-size: 20px; line-height: 1; opacity: 0.9; }
                .info-content { display: flex; flex-direction: column; gap: 2px; }
                .info-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                .info-val { font-size: 13px; font-weight: 500; color: var(--text-primary); }
                
                /* Settings Form */
                .settings-section { background: var(--card-bg); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
                .section-title { font-size: 16px; color: var(--primary-color); margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
                
                .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
                .form-group { margin-bottom: 16px; }
                .form-label { display: block; margin-bottom: 6px; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; }
                
                input, select {
                    width: 100%; padding: 10px; background: #111827; border: 1px solid rgba(255,255,255,0.1);
                    color: white; border-radius: 6px; box-sizing: border-box;
                }
                
                /* HA Entity Picker override */
                ha-entity-picker {
                    display: block; width: 100%;
                }
                
                .save-bar {
                    position: fixed; bottom: 20px; right: 20px;
                    background: var(--success-color); color: white;
                    padding: 12px 24px; border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: none; align-items: center; gap: 8px; font-weight: 500;
                    z-index: 100;
                }
                .save-bar.visible { display: flex; animation: slideUp 0.3s ease-out; }
                
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                /* Modal */
                .modal {
                    display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%;
                    background-color: rgba(0,0,0,0.9); backdrop-filter: blur(8px);
                    align-items: center; justify-content: center;
                }
                .modal.visible { display: flex; animation: fadeIn 0.2s; }
                .modal-content {
                    background: var(--card-bg); padding: 16px; border-radius: 12px; 
                    max-width: 95%; max-height: 95vh; overflow: auto;
                    position: relative; border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .close-modal {
                    position: absolute; top: -40px; right: 0; color: #fff; font-size: 30px; font-weight: bold; cursor: pointer;
                    background: rgba(0,0,0,0.5); width: 40px; height: 40px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }
                .close-modal:hover { background: rgba(255,255,255,0.2); }

                /* Mobile Responsive */
                @media (max-width: 600px) {
                    .header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    .tabs {
                        margin-left: 0;
                        width: 100%;
                        overflow-x: auto;
                        justify-content: flex-start;
                        padding-bottom: 4px; /* Space for scrollbar */
                        background: transparent;
                        border: none;
                        padding: 0;
                    }
                    .tab {
                        flex-shrink: 0;
                        font-size: 11px;
                        padding: 8px 12px;
                        background: rgba(255,255,255,0.05); /* Ensure visibility */
                        margin-right: 4px;
                        white-space: nowrap;
                    }
                    .tab.active {
                        background: var(--primary-color);
                    }
                }
            </style>
            
            <div class="header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <h1>🌱 <span>Grow Room</span></h1>
                </div>
                <div class="tabs">
                    <div class="tab active" data-tab="overview">Übersicht</div>
                    <div class="tab" data-tab="settings">Geräte & Config</div>
                    <div class="tab" data-tab="phases">Phasen</div>
                    <div class="tab" data-tab="info">Info / Hilfe</div>
                </div>
            </div>
            
            <div class="content" id="main-content"></div>
            
            <div id="save-toast" class="save-bar">
                <span>✅</span> Einstellungen gespeichert!
            </div>
            
            <!-- Camera Modal -->
            <div id="camera-modal" class="modal">
                <div class="close-modal">&times;</div>
                <div class="modal-content">
                    <img id="modal-img" src="" style="width:100%; height:auto; display:block; border-radius:8px;">
                    <div id="modal-title" style="margin-top:12px; font-size:16px; font-weight:500; text-align:center;"></div>
                </div>
            </div>

            <div style="text-align:center; padding:32px; margin-top:40px; border-top: 1px solid rgba(255,255,255,0.1);">
                <span style="font-size:14px; opacity:0.8; letter-spacing: 0.5px; color:var(--text-secondary);">Powered by</span>
                <a href="https://openkairo.de" target="_blank" style="
                    display: inline-block;
                    margin-left: 8px;
                    color: #38bdf8; /* Bright Cyan/Blue */
                    text-decoration: none;
                    font-weight: 900;
                    font-size: 16px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    text-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
                    transition: all 0.3s ease;
                ">
                    OpenKAIRO
                </a>
            </div>
        `;

        this.shadowRoot.innerHTML = style;

        // Tab Event Listeners
        this.shadowRoot.querySelectorAll('.tab').forEach(t => {
            t.addEventListener('click', (e) => {
                this._activeTab = e.target.dataset.tab;

                // Update UI
                this.shadowRoot.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
                e.target.classList.add('active');

                this._updateContent();
            });
        });
    }

    _updateContent() {
        const container = this.shadowRoot.getElementById('main-content');
        if (!container || !this._devices) return;

        container.innerHTML = '';

        if (this._activeTab === 'overview') {
            this._renderOverview(container);
        } else if (this._activeTab === 'settings') {
            this._renderSettings(container);
        } else if (this._activeTab === 'phases') {
            this._renderPhases(container);
        } else if (this._activeTab === 'info') {
            this._renderInfo(container);
        }
    }

    _renderOverview(container) {
        if (this._devices.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary);">Keine Grow Box gefunden. Bitte Integration hinzufügen.</div>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'grid';

        // Phase Hours Map (default)
        const PHASE_HOURS = {
            'seedling': 18,
            'vegetative': 18,
            'flowering': 12,
            'drying': 0,
            'curing': 0
        };
        const PHASES = [
            { id: 'seedling', label: '🌱 Keimling' },
            { id: 'vegetative', label: '🌿 Wachstum' },
            { id: 'flowering', label: '🌸 Blüte' },
            { id: 'drying', label: '🍂 Trocknen' },
            { id: 'curing', label: '🏺 Veredelung' }
        ];

        this._devices.forEach(device => {
            const card = document.createElement('div');
            card.className = 'card';

            // Data
            const masterState = this._hass.states[device.entities.master];
            const pumpState = this._hass.states[device.entities.pump];
            const daysInPhase = this._hass.states[device.entities.days]?.state || 0;
            // Fix: Prioritize options over sensor state to avoid stale data after update
            const currentPhase = device.options.current_phase || this._hass.states[device.entities.phase]?.state || 'vegetative';

            // --- Light Timer Logic ---
            // --- Light Timer Logic ---
            let lightInfo = "Unbekannt";
            // Use ACTUAL state for the icon/visual
            const realLightState = this._hass.states[device.options.light_entity]?.state;
            const isLightOn = realLightState === 'on';
            // Variable used by rendering for Icon/Color
            let lightStatus = isLightOn ? 'on' : 'off';

            const startHour = parseInt(device.options.light_start_hour || 18);
            let duration = PHASE_HOURS[currentPhase] || 12;
            if (device.options[`${currentPhase}_hours`]) duration = parseFloat(device.options[`${currentPhase}_hours`]);

            // Format Schedule Display (e.g. 13:00 - 07:00)
            const endTotal = startHour + duration;
            const endH = Math.floor(endTotal % 24);
            const endM = Math.floor((endTotal % 1) * 60);
            // Simple check: if duration is integer, don't show :00 for end if you want cleaner look, but consistency is good.
            const fmtSchedule = `${startHour}:00 - ${endH}:${endM.toString().padStart(2, '0')}`;

            const now = new Date();
            const start = new Date(now);
            start.setHours(startHour, 0, 0, 0);

            let startTime = start.getTime();
            let endTime = startTime + (duration * 3600 * 1000);

            if (now.getHours() < startHour) {
                startTime -= 24 * 3600 * 1000;
                endTime -= 24 * 3600 * 1000;
            }

            const nowTime = now.getTime();
            const isLightTime = nowTime >= startTime && nowTime < endTime;

            if (isLightTime) {
                const remainingMs = endTime - nowTime;
                const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
                const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

                if (isLightOn) {
                    lightInfo = `An (noch ${hrs}h ${mins}m)<br><span style="font-size:10px; opacity:0.7">${fmtSchedule}</span>`;
                } else {
                    lightInfo = `Aus (Sollte AN sein!)<br><span style="font-size:10px; opacity:0.7">${fmtSchedule}</span>`;
                }
            } else {
                let nextStart = startTime + 24 * 3600 * 1000;
                if (nowTime > endTime) {
                    nextStart = startTime + 24 * 3600 * 1000;
                }
                const untilStart = nextStart - nowTime;
                const hrs = Math.floor(untilStart / (1000 * 60 * 60));
                const mins = Math.floor((untilStart % (1000 * 60 * 60)) / (1000 * 60));

                if (isLightOn) {
                    lightInfo = `An (Sollte AUS sein!)<br><span style="font-size:10px; opacity:0.7">${fmtSchedule}</span>`;
                } else {
                    lightInfo = `Aus (Start in ${hrs}h ${mins}m)<br><span style="font-size:10px; opacity:0.7">${fmtSchedule}</span>`;
                }
            }



            // Image Logic with Cache Busting (Persisted)
            const imgVer = device.options.image_version || 0;
            let imgUrl = `/local/local_grow_box_images/${device.id}.jpg?v=${imgVer}`;
            let isLive = false;
            if (device.options.camera_entity) {
                const cam = this._hass.states[device.options.camera_entity];
                if (cam) {
                    imgUrl = cam.attributes.entity_picture;
                    isLive = true;
                }
            }

            // Calculations for Bars
            const getVal = (entity) => {
                if (!entity) return null;
                const s = this._hass.states[entity];
                return s && !isNaN(s.state) ? parseFloat(s.state) : null;
            }

            const temp = getVal(device.options.temp_sensor);
            const hum = getVal(device.options.humidity_sensor);
            const vpd = getVal(device.entities.vpd);

            let vpdTarget = null;
            if (currentPhase === 'seedling') vpdTarget = { min: 0.4, max: 0.8 };
            else if (currentPhase === 'vegetative') vpdTarget = { min: 0.8, max: 1.2 };
            else if (currentPhase === 'flowering') vpdTarget = { min: 1.2, max: 1.6 };
            else if (currentPhase === 'drying') vpdTarget = { min: 0.8, max: 1.0 };
            else if (currentPhase === 'curing') vpdTarget = { min: 0.5, max: 0.7 };

            // Phase Options HTML
            const phaseOptions = PHASES.map(p =>
                `<option value="${p.id}" ${currentPhase === p.id ? 'selected' : ''}>${p.label}</option>`
            ).join('');

            card.innerHTML = `
                <div class="card-image">
                    <img src="${imgUrl}" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg'">
                    ${isLive ? '<div class="live-badge">LIVE</div>' : ''}
                    <div style="position:absolute; bottom:0; left:0; right:0; padding:12px; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent); display:flex; justify-content:space-between; align-items:end;">
                        <div>
                             <select class="phase-select" id="phase-select-${device.id}" style="
                                background: rgba(0,0,0,0.6); 
                                border: 1px solid rgba(255,255,255,0.2); 
                                color: white; 
                                padding: 4px 8px; 
                                border-radius: 4px; 
                                font-size: 14px;
                                cursor: pointer;
                                outline: none;
                             ">
                                ${phaseOptions}
                            </select>
                            <div style="color:white; font-weight:500; font-size:13px; margin-top:6px; margin-left:2px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">Tag ${daysInPhase}</div>
                        </div>
                    </div>
                </div>
                
                <div class="card-header">
                    <div class="card-title">${device.name}</div>
                    <div class="status-badge ${masterState && masterState.state === 'on' ? 'online' : 'offline'}">
                        ${masterState && masterState.state === 'on' ? '● Online' : '○ Offline'}
                    </div>
                </div>
                
                <div class="card-body">
                    ${this._renderStatBar('Temperatur', temp, '°C', 10, 45, '#ef4444', '🌡️')}
                    ${this._renderStatBar('Luftfeuchte', hum, '%', 30, 80, '#3b82f6', '💧')}
                    ${this._renderStatBar('VPD', vpd, 'kPa', 0, 3.0, '#10b981', '🍃', vpdTarget)}
                    
                    ${device.options.moisture_sensor ? this._renderStatBar('Bodenfeuchte', getVal(device.options.moisture_sensor), '%', 0, 100, '#8b5cf6', '🪴') : ''}
                    
                    <div style="margin-top:16px; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px; display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        
                        <div class="info-box">
                            <div class="info-icon">${lightStatus === 'on' ? '💡' : '🌑'}</div>
                            <div class="info-content">
                                <div class="info-label">Licht</div>
                                <div class="info-val" style="font-size:12px;">${lightInfo}</div>
                            </div>
                        </div>

                         <div class="info-box">
                            <div class="info-icon">${this._hass.states[device.options.fan_entity]?.state === 'on' ? '🌪️' : '💨'}</div>
                            <div class="info-content">
                                <div class="info-label">Abluft</div>
                                <div class="info-val">${this._hass.states[device.options.fan_entity]?.state === 'on' ? 'An' : 'Aus'}</div>
                            </div>
                        </div>
                        
                         <div class="info-box">
                            <div class="info-icon">${pumpState?.state === 'on' ? '💧' : '⛔'}</div>
                            <div class="info-content">
                                <div class="info-label">Pumpe</div>
                                <div class="info-val">${pumpState?.state === 'on' ? 'Läuft' : 'Aus'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="controls">
                    <button class="btn ${masterState?.state === 'on' ? 'active' : ''}" id="btn-master-${device.id}">
                        ⚡ Master
                    </button>
                    <button class="btn ${pumpState?.state === 'on' ? 'active' : ''}" id="btn-pump-${device.id}">
                        💧 Pumpe
                    </button>
                    <button class="btn" id="btn-upload-${device.id}">
                        📷 Bild
                    </button>
                </div>
            `;

            // Events
            const q = s => card.querySelector(s);
            q(`#btn-master-${device.id}`).onclick = () => this._toggle(device.entities.master);
            q(`#btn-pump-${device.id}`).onclick = () => this._hass.callService('homeassistant', 'toggle', { entity_id: device.entities.pump || device.options.pump_entity });
            q(`#btn-upload-${device.id}`).onclick = () => this._triggerUpload(device.id);
            q('.card-image').style.cursor = 'pointer';
            q('.card-image').onclick = (e) => {
                // Prevent click if clicking the select or badge
                if (e.target.tagName === 'SELECT' || e.target.closest('.phase-select')) return;
                this._openCameraModal(imgUrl, device.name);
            };

            // Phase Change Event
            const phaseSelect = q(`#phase-select-${device.id}`);
            phaseSelect.onchange = async (e) => {
                const newPhase = e.target.value;
                if (confirm(`Phase wirklich auf "${PHASES.find(p => p.id === newPhase).label}" ändern?`)) {
                    try {
                        await this._hass.callWS({
                            type: 'local_grow_box/update_config',
                            entry_id: device.entryId,
                            config: { current_phase: newPhase }
                        });
                        // Optimistic update or wait for reload
                        // setTimeout(() => this._fetchDevices(), 500); // Reload data
                        // actually config update should trigger reload via HA events if wired? 
                        // But _fetchDevices is manual. Let's trigger it.
                        this._fetchDevices();
                    } catch (err) {
                        alert("Fehler beim Ändern der Phase: " + err);
                    }
                } else {
                    e.target.value = currentPhase; // Revert
                }
            };

            grid.appendChild(card);
        });

        container.appendChild(grid);
    }

    _openCameraModal(url, title) {
        const modal = this.shadowRoot.getElementById('camera-modal');
        const img = this.shadowRoot.getElementById('modal-img');
        const txt = this.shadowRoot.getElementById('modal-title');

        // Refresh image to ensure live content
        const freshUrl = url.includes('?') ? url + '&t=' + Date.now() : url + '?t=' + Date.now();
        img.src = freshUrl;

        txt.innerText = title;
        modal.classList.add('visible');

        // Close logic
        const close = modal.querySelector('.close-modal');
        close.onclick = () => modal.classList.remove('visible');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('visible');
        }
    }

    _renderStatBar(label, val, unit, min, max, color, icon, targetRange) {
        if (val === null) return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value">--</span></div>`;

        const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

        // Target Area Rendering
        let targetArea = '';
        if (targetRange) {
            const tMinPct = Math.min(100, Math.max(0, ((targetRange.min - min) / (max - min)) * 100));
            const tMaxPct = Math.min(100, Math.max(0, ((targetRange.max - min) / (max - min)) * 100));
            const width = tMaxPct - tMinPct;

            targetArea = `<div style="position:absolute; left:${tMinPct}%; width:${width}%; height:100%; background:rgba(255,255,255,0.3); z-index:1;"></div>`;
            label += ` <span style="font-size:10px; opacity:0.7;">(Ziel: ${targetRange.min}-${targetRange.max})</span>`;
        }

        return `
            <div style="margin-bottom:12px;">
                <div class="stat-row" style="margin-bottom:4px;">
                    <span class="stat-label">${label}</span>
                    <span class="stat-value">${val} ${unit}</span>
                </div>
                <div class="bar-bg" style="position:relative;">
                    ${targetArea}
                    <div class="bar-fill" style="width:${pct}%; background-color:${color}; position:relative; z-index:2; opacity:0.8;"></div>
                </div>
            </div>
        `;
    }

    _renderSettings(container) {
        this._devices.forEach(device => {
            const section = document.createElement('div');
            section.className = 'settings-section';

            const title = document.createElement('div');
            title.className = 'section-title';
            title.innerText = `${device.name} - Konfiguration`;
            section.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'form-grid';

            // Helper to create columns
            const createCol = (titleText) => {
                const div = document.createElement('div');
                const h4 = document.createElement('h4');
                h4.style.cssText = "margin:0 0 16px 0; color:var(--text-secondary);";
                h4.innerText = titleText;
                div.appendChild(h4);
                return div;
            };

            const col1 = createCol('Klima & Sensoren');
            const col2 = createCol('Bewässerung & Licht');
            const col3 = createCol('Erweitert');

            // DOM-based Helper for Picker
            const appendPicker = (parent, label, configKey, domains) => {
                const group = document.createElement('div');
                group.className = 'form-group';

                const lbl = document.createElement('label');
                lbl.className = 'form-label';
                lbl.innerText = label;
                group.appendChild(lbl);

                const picker = document.createElement('ha-entity-picker');
                picker.id = `picker-${device.id}-${configKey}`;
                picker.dataset.key = configKey; // For saving

                // Draft logic
                const entryId = device.entryId;
                const draftVal = this._draft[entryId] && this._draft[entryId][configKey];
                const storedVal = device.options[configKey];
                const finalVal = (draftVal !== undefined) ? draftVal : (storedVal || '');

                // Append to DOM first - Critical for some Custom Elements
                group.appendChild(picker);
                parent.appendChild(group);

                // Function to set properties safely
                const setProps = () => {
                    picker.hass = this._hass;
                    picker.includeDomains = domains;

                    if (finalVal) {
                        picker.value = finalVal;
                    }
                    // Double check value set after a microtask for LitElement reactivity
                    setTimeout(() => {
                        if (finalVal && picker.value !== finalVal) {
                            picker.value = finalVal;
                        }
                    }, 50);
                };

                // Initialize properties
                if (customElements.get('ha-entity-picker')) {
                    setProps();
                } else {
                    customElements.whenDefined('ha-entity-picker').then(setProps);
                }

                // Listen for changes
                picker.addEventListener('value-changed', (ev) => {
                    const v = ev.detail?.value;
                    if (v !== undefined) {
                        if (!this._draft[entryId]) this._draft[entryId] = {};
                        this._draft[entryId][configKey] = v;
                    }
                });
            };

            // NEW: HA Selector Helper (Modern)
            const appendSelector = (parent, label, configKey, domain) => {
                const group = document.createElement('div');
                group.className = 'form-group';

                // Label is handled by ha-selector usually, but we keep our layout
                // const lbl = document.createElement('label');
                // lbl.className = 'form-label';
                // lbl.innerText = label;
                // group.appendChild(lbl);

                const selector = document.createElement('ha-selector');
                selector.label = label; // HA Selector handles label internally well

                // Config
                const entryId = device.entryId;
                const draftVal = this._draft[entryId] && this._draft[entryId][configKey];
                const storedVal = device.options[configKey];
                const finalVal = (draftVal !== undefined) ? draftVal : (storedVal || '');

                selector.hass = this._hass;
                selector.selector = { entity: { domain: domain } };
                selector.value = finalVal;
                selector.required = false;

                console.log(`[SELECTOR] Created for ${configKey}, value: ${finalVal}`);

                selector.addEventListener('value-changed', (ev) => {
                    const v = ev.detail?.value;
                    // console.log(`[SELECTOR] ${configKey} changed to:`, v);

                    if (!this._draft[entryId]) this._draft[entryId] = {};

                    // IF v is undefined/null/empty, we save '' to draft to CLEAR stored val
                    if (v === undefined || v === null || v === '') {
                        this._draft[entryId][configKey] = '';
                    } else {
                        this._draft[entryId][configKey] = v;
                    }
                });

                group.appendChild(selector);
                parent.appendChild(group);
            };

            // DOM-based Helper for Input
            const appendInput = (parent, label, configKey, type = 'text') => {
                const group = document.createElement('div');
                group.className = 'form-group';

                const lbl = document.createElement('label');
                lbl.className = 'form-label';
                lbl.innerText = label;
                group.appendChild(lbl);

                const input = document.createElement('input');
                input.type = type;

                // Draft logic: Check draft first, then stored option
                const draftVal = this._draft[device.entryId] && this._draft[device.entryId][configKey];
                const storedVal = device.options[configKey] !== undefined ? device.options[configKey] : '';
                input.value = (draftVal !== undefined) ? draftVal : storedVal;

                input.dataset.key = configKey; // For saving

                // Save to draft on input
                input.addEventListener('input', (e) => {
                    if (!this._draft[device.entryId]) {
                        this._draft[device.entryId] = {};
                    }
                    this._draft[device.entryId][configKey] = e.target.value;
                });

                group.appendChild(input);
                parent.appendChild(group);
            };

            // Col 1
            appendSelector(col1, 'Temp. Sensor', 'temp_sensor', ['sensor']);
            appendSelector(col1, 'Luftfeuchte Sensor', 'humidity_sensor', ['sensor']);
            appendSelector(col1, 'Abluft Ventilator', 'fan_entity', ['switch', 'fan', 'input_boolean']);
            appendInput(col1, 'Ziel Temperatur (°C)', 'target_temp', 'number');
            appendInput(col1, 'Max. Feuchte (%)', 'max_humidity', 'number');

            // Col 2
            appendSelector(col2, 'Licht Quelle', 'light_entity', ['switch', 'light', 'input_boolean']);
            appendInput(col2, 'Licht Start (Stunde)', 'light_start_hour', 'number');

            appendSelector(col2, 'Wasserpumpe', 'pump_entity', ['switch', 'input_boolean']);
            appendSelector(col2, 'Bodenfeuchte Sensor', 'moisture_sensor', ['sensor']);
            appendInput(col2, 'Ziel Bodenfeuchte (%)', 'target_moisture', 'number');
            appendInput(col2, 'Pumpen Dauer (s)', 'pump_duration', 'number');

            // Col 3
            appendSelector(col3, 'Kamera', 'camera_entity', ['camera']);
            appendInput(col3, 'Phasen Startdatum', 'phase_start_date', 'date');

            grid.appendChild(col1);
            grid.appendChild(col2);
            grid.appendChild(col3);
            section.appendChild(grid);

            // Save Button
            const btnDiv = document.createElement('div');
            btnDiv.style.cssText = "margin-top:24px; text-align:right;";
            const btn = document.createElement('button');
            btn.className = 'btn active';
            btn.style.cssText = "width:auto; display:inline-flex; padding:12px 24px;";
            btn.id = `save-${device.id}`; // Add ID for consistency
            btn.innerText = 'Speichern';
            btn.onclick = () => this._saveConfig_V2(section, device.entryId);
            btnDiv.appendChild(btn);

            section.appendChild(btnDiv);

            container.appendChild(section);


        });
    }

    _renderPhases(container) {
        this._devices.forEach(device => {
            const section = document.createElement('div');
            section.className = 'settings-section';

            const renderPhaseRow = (label, sub, icon, configKey, val) => `
                <div style="
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    background: rgba(255,255,255,0.03); 
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px; 
                    padding: 12px 16px; 
                    margin-bottom: 8px;
                ">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <span style="font-size:24px;">${icon}</span>
                        <div>
                            <div style="font-weight:500; font-size:14px;">${label}</div>
                            <div style="font-size:11px; color:var(--text-secondary);">${sub}</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="number" value="${val}" data-key="${configKey}" data-entry="${device.entryId}" 
                            style="width:70px; text-align:center; font-weight:bold; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); padding:8px; border-radius:6px;">
                        <span style="font-size:12px; color:var(--text-secondary); width:50px;">Std.</span>
                    </div>
                </div>
            `;

            section.innerHTML = `
                <div class="section-title">${device.name} - Phasen Management</div>
                <p style="color:var(--text-secondary); margin-bottom:24px; font-size:13px; line-height:1.5;">
                    Definiere hier die tägliche Beleuchtungsdauer für jede Wachstumsphase. 
                    <br>Das System schaltet basierend auf der aktuellen Phase automatisch um.
                </p>

                <div style="display:flex; flex-direction:column; gap:8px; max-width:600px;">
                    ${renderPhaseRow('Keimling', 'Hohe Luftfeuchte (65-80%), 20-25°C, sanftes Licht', '🌱', 'phase_seedling_hours', device.options.phase_seedling_hours !== undefined ? device.options.phase_seedling_hours : 18)}
                    ${renderPhaseRow('Wachstum', 'Viel Stickstoff, 18h Licht, RLF 50-70%', '🌿', 'phase_vegetative_hours', device.options.phase_vegetative_hours !== undefined ? device.options.phase_vegetative_hours : 18)}
                    ${renderPhaseRow('Blüte', '12h Licht zwingend, RLF <50% (Schimmelgefahr!), P-K Dünger', '🌸', 'phase_flowering_hours', device.options.phase_flowering_hours !== undefined ? device.options.phase_flowering_hours : 12)}
                    ${renderPhaseRow('Trocknen', 'Dunkel & Kühl (18-20°C), 50-60% RLF, 10-14 Tage', '🍂', 'phase_drying_hours', device.options.phase_drying_hours !== undefined ? device.options.phase_drying_hours : 0)}
                    ${renderPhaseRow('Veredelung', 'Im Glas/Bag, RLF stabil bei 58-62% halten', '🏺', 'phase_curing_hours', device.options.phase_curing_hours !== undefined ? device.options.phase_curing_hours : 0)}
                </div>
                
                 <div style="margin-top:24px; max-width:600px; display:flex; justify-content:flex-end;">
                    <button class="btn active" id="save-p-${device.id}" style="width:auto; display:inline-flex; padding:12px 32px;">
                        Speichern
                    </button>
                </div>
            `;

            section.querySelector(`#save-p-${device.id}`).onclick = () => this._saveConfig_V2(section, device.entryId);
            container.appendChild(section);
        });
    }

    async _saveConfig_V2(section, entryId) {
        // Start with draft values if they exist
        const updates = { ...(this._draft && this._draft[entryId] ? this._draft[entryId] : {}) };

        // Inputs
        section.querySelectorAll('input, select').forEach(el => {
            if (el.dataset.key) {
                updates[el.dataset.key] = el.value;
            }
        });

        // Entity Pickers
        // Fix: Don't blindly overwrite from DOM if we have a draft value (DOM might be empty/reset)
        section.querySelectorAll('ha-entity-picker').forEach(el => {
            const key = el.dataset.key;
            if (key) {
                // Only take from DOM if NOT in draft (e.g. initial load unmodified)
                // If user modified it, it's in draft.
                // If user didn't modify, draft is undefined for this key.
                if (updates[key] === undefined) {
                    updates[key] = el.value;
                }
            }
        });

        try {
            console.log("Sending config update for entry:", entryId, updates);
            // Result contains { options: { ... } }
            const result = await this._hass.callWS({
                type: 'local_grow_box/update_config',
                entry_id: entryId,
                config: updates
            });

            console.log("Save successful, received options:", result.options);

            // Update local cache directly to avoid race conditions with registry fetch
            const devIndex = this._devices.findIndex(d => d.entryId === entryId);
            if (devIndex >= 0) {
                // Merge new options into local device options
                this._devices[devIndex].options = {
                    ...this._devices[devIndex].options,
                    ...result.options
                };
            }

            // Clear draft for this entry as it is now saved
            if (this._draft[entryId]) {
                delete this._draft[entryId];
            }

            const toast = this.shadowRoot.getElementById('save-toast');
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 3000);

            // Re-render immediately with local data
            this._updateContent();

        } catch (e) {
            console.error("Save error:", e);
            alert("Fehler beim Speichern: " + e.message);
        }
    }

    _toggle(entityId) {
        if (!entityId) return;
        this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
    }

    _triggerUpload(deviceId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const device = this._devices.find(d => d.id === deviceId);
                    const result = await this._hass.callWS({
                        type: 'local_grow_box/upload_image',
                        device_id: deviceId,
                        entry_id: device ? device.entryId : null,
                        image: ev.target.result
                    });

                    // Update local state immediately with returned version
                    if (result && result.version) {
                        if (device) {
                            if (!device.options) device.options = {};
                            device.options.image_version = result.version;
                            this._updateContent(); // Instant visual update
                        }
                    }

                    // And refresh from backend to be sure
                    setTimeout(() => this._fetchDevices(), 1000);
                } catch (err) {
                    console.error("Upload error:", err);
                    alert('Upload fehlgeschlagen: ' + (err.message || err));
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    async _renderLog(container) {
        container.innerHTML = '<div style="padding:24px; text-align:center;">Lade Protokoll...</div>';

        // 1. Collect entities and map to devices
        const entities = [];
        const entityMap = {}; // entity_id -> { devId, type }

        this._devices.forEach(d => {
            const add = (eid, type) => {
                if (eid) {
                    entities.push(eid);
                    entityMap[eid] = { devId: d.id, type: type };
                }
            };
            add(d.entities.light, 'light');
            add(d.entities.pump || d.options.pump_entity, 'pump');
            add(d.entities.fan || d.options.fan_entity, 'fan');
            add(d.entities.phase, 'phase');
        });

        if (entities.length === 0) {
            container.innerHTML = '<div style="padding:24px; text-align:center;">Keine Geräte konfiguriert für das Protokoll.</div>';
            return;
        }

        // 2. Fetch (Last 48 hours to ensure we see recent events)
        const end = new Date();
        const start = new Date(end.getTime() - 48 * 60 * 60 * 1000); // 48h

        try {
            // Fix: Remove end_time to implicitly mean "now". Ensure start_time is valid ISO.
            const rawEvents = await this._hass.callWS({
                type: 'logbook/get_events',
                start_time: start.toISOString(),
                entity_ids: entities
            });

            // 3. Filter Noise
            const events = (rawEvents || []).filter(e =>
                e.state !== 'unavailable' && e.state !== 'unknown' && e.state !== '' && e.message !== 'became unavailable'
            ).sort((a, b) => new Date(b.when) - new Date(a.when));

            if (events.length === 0) {
                container.innerHTML = '<div style="padding:24px; text-align:center;">Keine Ereignisse in den letzten 24 Stunden.</div>';
                return;
            }

            // 4. Render Layout
            container.innerHTML = '';

            const header = document.createElement('div');
            header.style.cssText = "padding:16px; display:flex; gap:12px; max-width:800px; margin:0 auto; flex-wrap:wrap;";

            const createSelect = (opts) => {
                const s = document.createElement('select');
                s.style.cssText = "background:var(--card-bg); color:var(--primary-text-color); padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); flex:1; min-width:140px; outline:none; cursor:pointer;";
                s.innerHTML = opts.map(o => `<option value="${o.val}">${o.lbl}</option>`).join('');
                return s;
            };

            const devOpts = [{ val: 'all', lbl: 'Alle Boxen' }].concat(this._devices.map(d => ({ val: d.id, lbl: d.name })));
            const typeOpts = [
                { val: 'all', lbl: 'Alle Typen' },
                { val: 'light', lbl: '💡 Licht' },
                { val: 'pump', lbl: '💧 Wasser' },
                { val: 'fan', lbl: '🌪️ Luft' },
                { val: 'phase', lbl: '🌱 Phase' }
            ];

            const devSelect = createSelect(devOpts);
            const typeSelect = createSelect(typeOpts);

            header.appendChild(devSelect);
            header.appendChild(typeSelect);
            container.appendChild(header);

            const listContainer = document.createElement('div');
            listContainer.style.maxWidth = '800px';
            listContainer.style.margin = '0 auto';
            container.appendChild(listContainer);

            // Render Function
            const renderList = () => {
                const devFilter = devSelect.value;
                const typeFilter = typeSelect.value;

                listContainer.innerHTML = '';

                const filtered = events.filter(ev => {
                    const info = entityMap[ev.entity_id];
                    if (!info) return true;

                    if (devFilter !== 'all' && info.devId !== devFilter) return false;
                    if (typeFilter !== 'all' && info.type !== typeFilter) return false;

                    return true;
                });

                if (filtered.length === 0) {
                    listContainer.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-secondary);">Keine Einträge für diesen Filter.</div>';
                    return;
                }

                const list = document.createElement('div');
                list.className = 'log-list';

                filtered.forEach(ev => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        background: var(--card-bg);
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        padding: 12px 16px;
                        display: flex; justify-content: space-between; align-items: center; gap: 12px;
                    `;

                    const dateObj = new Date(ev.when);
                    const time = dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    let icon = '📝';
                    if (ev.domain === 'light') icon = '💡';
                    else if (ev.entity_id.includes('pump')) icon = '💧';
                    else if (ev.entity_id.includes('fan')) icon = '🌪️';
                    else if ((ev.domain === 'sensor' && ev.entity_id.includes('phase')) || ev.entity_id.includes('grow')) icon = '🌱';

                    let name = ev.name;
                    if (!name || name === 'undefined') {
                        const stateObj = this._hass.states[ev.entity_id];
                        name = stateObj ? stateObj.attributes.friendly_name : ev.entity_id;
                    }

                    item.innerHTML = `
                        <div style="display:flex; align-items:center; gap:12px; flex:1;">
                            <span style="color:var(--text-secondary); font-size:14px; width:45px;">${time}</span>
                            <span style="font-size:20px;">${icon}</span>
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:500;">${name}</span>
                                <span style="font-size:12px; color:var(--text-secondary);">${ev.message || ('Zustand: ' + ev.state)}</span>
                            </div>
                        </div>
                    `;
                    list.appendChild(item);
                });

                listContainer.appendChild(list);
            };

            devSelect.onchange = renderList;
            typeSelect.onchange = renderList;

            renderList();

        } catch (e) {
            console.error("Log fetch failed", e);
            container.innerHTML = `<div style="color:var(--danger-color); padding:24px;">Fehler beim Laden des Protokolls: ${e.message}</div>`;
        }

        // Debug Footer
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = "text-align:center; opacity:0.3; font-size:10px; margin-top:20px; color:var(--text-primary);";
        debugDiv.innerHTML = `Debug: Range ${new Date(end.getTime() - 48 * 3600000).toLocaleString()} - ${end.toLocaleString()} (${entities.length} entities)`;
        container.appendChild(debugDiv);
    }

    _renderInfo(container) {
        container.innerHTML = `
            <div style="max-width:800px; margin:0 auto; padding:16px;">
                <h2 style="text-align:center; margin-bottom:24px;">Grow Guide & Hilfe</h2>
                
                <div class="card" style="margin-bottom:24px;">
                    <div class="card-header">
                        <div class="card-title">🍃 VPD (Vapor Pressure Deficit)</div>
                    </div>
                    <div class="card-body">
                        <p style="color:var(--text-secondary); margin-bottom:16px;">Der VPD-Wert beschreibt, wie gut die Pflanze transpirieren kann. Grüne Bereiche sind optimal.</p>
                        <table style="width:100%; text-align:left; border-collapse:collapse; color:white;">
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                                <th style="padding:8px;">Phase</th>
                                <th style="padding:8px;">Optimaler Bereich (kPa)</th>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:8px;">🌱 Keimling</td>
                                <td style="padding:8px; color:#4ade80;">0.4 - 0.8</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:8px;">🌿 Wachstum</td>
                                <td style="padding:8px; color:#4ade80;">0.8 - 1.2</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:8px;">🌸 Blüte</td>
                                <td style="padding:8px; color:#4ade80;">1.2 - 1.6</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                <td style="padding:8px;">🍂 Trocknen</td>
                                <td style="padding:8px; color:#4ade80;">0.8 - 1.0</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;">🏺 Veredeln</td>
                                <td style="padding:8px; color:#4ade80;">0.5 - 0.7</td>
                            </tr>
                        </table>
                        <div style="text-align:center; padding:12px;">
                            <span style="font-size:40px;">🥦</span>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-bottom:24px;">
                    <div class="card-header">
                        <div class="card-title">🎮 Steuerung</div>
                    </div>
                    <div class="card-body">
                        <p style="color:var(--text-secondary); margin-bottom:12px;">Erklärung der Buttons auf der Übersichtsseite:</p>
                        <ul style="color:var(--text-secondary); padding-left:20px; line-height:1.6;">
                            <li><strong>⚡ Master:</strong> Hauptschalter für die Automatik. <br>
                                <span style="opacity:0.7; font-size:12px;">(AN = Automatik aktiv. AUS = Handbetrieb/Pause. Zustand wird gespeichert.)</span>
                            </li>
                            <li><strong>💧 Pumpe:</strong> Manuelles Gießen. <br>
                                <span style="opacity:0.7; font-size:12px;">(Pumpe läuft für die eingestellte Dauer und schaltet dann automatisch ab.)</span>
                            </li>
                            <li><strong>📷 Bild:</strong> Lade ein aktuelles Foto deiner Box hoch.</li>
                        </ul>
                    </div>
                </div>

                <div class="card" style="margin-bottom:24px;">
                    <div class="card-header">
                        <div class="card-title">💡 Lichtsteuerung</div>
                    </div>
                    <div class="card-body">
                        <p style="color:var(--text-secondary);">Das Licht wird basierend auf der <strong>Startzeit</strong> und der <strong>Phasendauer</strong> gesteuert.</p>
                        <ul style="color:var(--text-secondary); padding-left:20px; margin-top:8px;">
                            <li><strong>Startzeit:</strong> Kann unter "Geräte & Config" eingestellt werden.</li>
                            <li><strong>Dauer:</strong> Wird durch die aktuelle Phase bestimmt (z.B. 18h Wachstum).</li>
                            <li><strong>Manuell:</strong> Wenn du das Licht manuell ausschaltest, wartet die Automatik 10 Sekunden.</li>
                        </ul>
                    </div>
                </div>

                <div class="card">
                     <div class="card-header">
                        <div class="card-title">💧 Bewässerung</div>
                    </div>
                    <div class="card-body">
                        <p style="color:var(--text-secondary);">Die Pumpe wird aktiviert, wenn die Bodenfeuchte unter den Zielwert fällt.</p>
                        <ul style="color:var(--text-secondary); padding-left:20px; margin-top:8px;">
                            <li><strong>Logik:</strong> Feuchte < Zielwert → Pumpe an für X Sekunden.</li>
                            <li><strong>Pause:</strong> Nach dem Gießen wartet das System 15 Minuten (Einwirkzeit).</li>
                        </ul>
                    </div>
                </div>

                <div class="card" style="margin-top:24px; border: 1px solid rgba(251, 191, 36, 0.2);">
                    <div class="card-header">
                        <div class="card-title" style="color: #fbbf24;">💛 Support & Spenden</div>
                    </div>
                    <div class="card-body" style="text-align:center;">
                        <p style="color:var(--text-secondary); margin-bottom:20px;">
                            Gefällt dir das Projekt? Unterstütze die Weiterentwicklung mit einer Spende!
                        </p>
                        <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=info@low-streaming.de&currency_code=EUR" target="_blank" style="text-decoration:none;">
                            <button class="btn" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #111827; font-weight:bold; margin:0 auto; width:auto; padding:12px 32px; border:none; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
                                <span style="font-size:18px; margin-right:8px;">☕</span> Jetzt Spenden
                            </button>
                        </a>
                        <div style="margin-top:16px; font-size:12px; color:var(--text-secondary);">
                            PayPal: info@low-streaming.de
                        </div>
                    </div>
                </div>
                
                <div style="text-align:center; margin-top:32px; opacity:0.5; font-size:12px;">
                    Local Grow Box Integration v1.1
                </div>
            </div>
        `;
    }

}

customElements.define('local-grow-box-panel', LocalGrowBoxPanel);
