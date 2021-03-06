define("p3/widget/JobsGrid", [
		"dojo/_base/declare", "dgrid/Grid", "dojo/store/JsonRest", "dgrid/extensions/DijitRegistry",
		"dgrid/Keyboard", "dgrid/Selection", "./formatter", "dgrid/extensions/ColumnResizer", "dgrid/extensions/ColumnHider",
		"dgrid/extensions/DnD", "dojo/dnd/Source", "dojo/_base/Deferred", "dojo/aspect", "dojo/_base/lang",
		"dojo/topic","dgrid/editor","dijit/Menu","dijit/MenuItem","../WorkspaceManager","dijit/Dialog",
		"../JobManager"

	],
	function(
		declare, Grid, Store, DijitRegistry,
		Keyboard, Selection, formatter, ColumnResizer,
		ColumnHider, DnD, DnDSource,
		Deferred, aspect, lang,Topic,editor,Menu,MenuItem,WorkspaceManager,Dialog,
		JobManager
	) {
		return declare([Grid, ColumnHider,Selection, Keyboard, ColumnResizer, DijitRegistry], {
			columns: {
				"status_indicator": {
					label: "",
					field: "status",
					formatter: formatter.status_indicator
				},
				"status": {
					label: "Status",
					field: "status",
					formatter: formatter.status_alias
				},

				submit_time: {
					label: "Submit",
					field: "submit_time",
					formatter: formatter.date	
				},
	
				"id":{
					label: "ID",
					field: "id",
					hidden: true
				},
				"app": {
					label: "App",
					field: "app",
					formatter: formatter.appLabel
				},
				parameters: {
					label: "Output Name",
					field: "parameters",
					formatter: function(val){
						return val.output_file || "";
					}
				},

				start_time: {
					label: "Start",
					field: "start_time",
					formatter: formatter.date	
				},
				completed_time: {
					label: "Completed",
					field: "completed_time",
					formatter: formatter.date	
				}
			},
			constructor: function() {
				this.dndParams.creator = lang.hitch(this, function(item, hint) {
					console.log("item: ", item, " hint:", hint, "dataType: ", this.dndDataType);
					var avatar = dojo.create("div", {
						innerHTML: item.organism_name || item.ncbi_taxon_id || item.id
					});
					avatar.data = item;
					if (hint == 'avatar') {
						// create your avatar if you want
					}

					return {
						node: avatar,
						data: item,
						type: this.dndDataType
					}
				})

			},
			store: null,
			selectionMode: "single",
			allowTextSelection: false,
			deselectOnRefresh: false,
			minRowsPerPage: 50,
			bufferRows: 100,
			maxRowsPerPage: 1000,
			pagingDelay: 250,
			//		pagingMethod: "throttleDelayed",
			farOffRemoval: 2000,
			keepScrollPosition: true,
			rowHeight: 24,
			loadingMessage: "Loading...",
			dndDataType: "genome",
			dndParams: {
				accept: "none",
				selfAccept: false,
				copyOnly: true
			},

			/*
                _setApiServer: function(server){
                        console.log("_setapiServerAttr: ", server);
                        this.apiServer = server;
                        this.set('store', this.createStore(this.dataModel), this.buildQuery());
                },
		*/

			_setTotalRows: function(rows) {
				this.totalRows = rows;
				console.log("Total Rows: ", rows);
				if (this.controlButton) {
					console.log("this.controlButton: ", this.controlButton);
					if (!this._originalTitle) {
						this._originalTitle = this.controlButton.get('label');
					}
					this.controlButton.set('label', this._originalTitle + " (" + rows + ")");

					console.log(this.controlButton);
				}
			},

			showErrorDialog: function(data){
				console.log("Show Error Dialog: ", data);
				if (!this.errorDialog){
					this.errorDialog = new Dialog({title: "Task Output", content: "Loading Task Detail..."});
				}else{
					this.errorDialog.set("content","Loading Task Detail...");
				}

				var _self=this;
				var timer = setTimeout(function(){
					_self.errorDialog.set("content","Unable to retreive additional details about this task at this task. The operation timed out.");
				},30000);
				JobManager.queryTaskDetail(data.id,true,true).then(function(detail){
					console.log("JOB DETAIL: ", detail);
					clearTimeout(timer);
					if (detail.stderr) {
						_self.errorDialog.set("content","<div style='overflow:auto;'><div data-dojo-type='dijit/TitlePane' title='STDOUT' open='false'><pre>" + (detail.stdout || "None.") + "</pre></div><br><div data-dojo-type='dijit/TitlePane' title='STDERR'><pre>"+(detail.stderr || "None.")+"</pre></div>");
					}else{
						_self.errorDialog.set("content","Unable to retreive additional details about this task at this task.<br><pre>" + JSON.stringify(detail,null,4) + "</pre>");
					}
				}, function(err){
					_self.errorDialog.set("content","Unable to retreive additional details about this task at this task.<br>" + err + "<br><pre></pre>");
				});

				this.errorDialog.show();
			},

			startup: function() {
				if (this._started) {
					return;
				}
				var _self = this;
				aspect.before(_self, 'renderArray', function(results) {
					Deferred.when(results.total, function(x) {
						_self.set("totalRows", x);
					});
				});

				this.on(".dgrid-content .dgrid-row:dblclick", function(evt) {
					var row = _self.row(evt);
					console.log("dblclick row:", row)
					if (row.data && row.data.status && row.data.status=="completed"){
						console.log("row.data: ", row.data);
						Topic.publish("/navigate", {href: "/workspace" + row.data.parameters.output_path+ "/" + row.data.parameters.output_file});
					}else{
						_self.showErrorDialog(row.data);
					}
/*
                                        on.emit(_self.domNode, "ItemDblClick", {
                                                item_path: row.data.path,
                                                item: row.data,
                                                bubbles: true,

                                        });
                                        console.log('after emit');
*/
				});
				_selection={};
				Topic.publish("/select", []);

			/*
				this.on("dgrid-select", function(evt) {
					console.log("dgrid-select");
					var rows = event.rows;
					Object.keys(rows).forEach(function(key){ _selection[rows[key].data.id]=rows[key].data; });
					var sel = Object.keys(_selection).map(function(s) { _selection[s].type="job_status_reference"; return _selection[s]; });
					console.log("sel: ", sel);
				});
				this.on("dgrid-deselect", function(evt) {
					console.log("dgrid-select");
					var rows = event.rows;
					Object.keys(rows).forEach(function(key){ delete _selection[rows[key].data.id] });
					var sel = Object.keys(_selection).map(function(s) { return _selection[s]; });
					Topic.publish("/select", sel);
				});
			*/
			/*
				var activeItem;
				this.on(".dgrid-content:contextmenu", function(evt){
					var row=_self.row(evt);
					activeItem = row;
					console.log("activeItem: ", row.data);
				});

				var menu = new Menu({
					  // Hook menu at domNode level since it stops propagation, and would
					  // block any contextmenu events delegated from the domNode otherwise
					  targetNodeIds: [this.domNode]
				});

				menu.addChild(new MenuItem({
					label: "Delete Object",
					onClick: function() {
						if (activeItem) {
							console.log("Delete Object: ", activeItem.data.id, activeItem.data.path);
							if (activeItem.data.type=="folder"){
								WorkspaceManager.deleteFolder([activeItem.data.path]);
							}else{
								WorkspaceManager.deleteObject([activeItem.data.path],true);
							}
							
						}
					}
				}));

				this.inherited(arguments);
				this._started = true;
			*/

			},
			_setActiveFilter: function(filter) {
				console.log("Set Active Filter: ", filter, "started:", this._started);
				this.activeFilter = filter;
				this.set("query", this.buildQuery());
			},

			buildQuery: function(table, extra) {
				var q = "?" + (this.activeFilter ? ("in(gid,query(genomesummary,and(" + this.activeFilter + ",limit(Infinity),values(genome_info_id))))") : "") + (this.extra || "");
				console.log("Feature Grid Query:", q);
				return q;
			},
			createStore: function(dataModel) {
				console.log("Create Store for ", dataModel, " at ", this.apiServer);
				var store = new Store({
					target: (this.apiServer ? (this.apiServer) : "") + "/" + dataModel + "/",
					idProperty: "rownum",
					headers: {
						"accept": "application/json",
						"content-type": "application/json",
						"Authorization": (window.App.authorizationToken||""),
						'X-Requested-With': null
					}
				});
				console.log("store: ", store);
				return store;
			},

			getFilterPanel: function() {
				console.log("getFilterPanel()");
				return FilterPanel;
			}

		});

	});
