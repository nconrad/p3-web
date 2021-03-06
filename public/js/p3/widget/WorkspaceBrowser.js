define([
	"dojo/_base/declare","dijit/layout/BorderContainer","dojo/on",
	"dojo/dom-class","dijit/layout/ContentPane","dojo/dom-construct",
	"./WorkspaceExplorerView","dojo/topic","./ItemDetailPanel",
	"./ActionBar","dojo/_base/Deferred","../WorkspaceManager","dojo/_base/lang",
	"./Confirmation","./SelectionToGroup","dijit/Dialog","dijit/TooltipDialog",
	"dijit/popup","dojo/text!./templates/IDMapping.html","dojo/request",
	"./ContainerActionBar"

], function(
	declare, BorderContainer, on,
	domClass,ContentPane,domConstruct,
	WorkspaceExplorerView,Topic,ItemDetailPanel,
	ActionBar,Deferred,WorkspaceManager,lang,
	Confirmation,SelectionToGroup,Dialog,TooltipDialog,
	popup,IDMappingTemplate,xhr,ContainerActionBar
){
	return declare([BorderContainer], {
		"baseClass": "WorkspaceBrowser",
		"disabled":false,
		"path": "/",
		gutters: false,
		navigableTypes: ["parentfolder","folder","genome_group","feature_group","job_result","experiment_group","experiment","unspecified","contigs","reads","model"],
		design: "sidebar",
		splitter: false,
		startup: function(){
			if (this._started) {return;}
			console.log("this.design: ", this.design);
			this.actionPanel = new ActionBar({splitter:false,region:"right",layoutPriority:2, style:"width:48px;text-align:center;"});
			this.browserHeader = new ContainerActionBar({region: "top", className: "BrowserHeader", path: this.path, layoutPriority:3});
			var self=this;

			this.actionPanel.addAction("ToggleItemDetail","fa fa-info-circle fa-2x", {label:"DETAIL",persistent:true,validTypes:["*"], tooltip: "Toggle Selection Detail"}, function(selection){
				console.log("Edit Item Action", selection);
			//	this.itemDetailPanel.set("selection", selection);

			//	self.itemDetailPanel.set("item",selection[0]);				
				if (self.getChildren().some(function(child){
					return child===self.itemDetailPanel
				})){
					self.removeChild(self.itemDetailPanel);
				}else{
					self.addChild(self.itemDetailPanel);
				}
				
			}, true);


			this.actionPanel.addAction("ViewGenomeItem","MultiButton fa fa-eye fa-2x", {
				label: "VIEW",
				validTypes:["*"],
				validContainerTypes: ["genome_group"],
				multiple: false,
				tooltip: "View Genome"
			},function(selection){
				console.log("selection: ", selection);
				var sel = selection[0];
				window.location = "/portal/portal/patric/Genome?cType=genome&cId=" + sel.genome_id
			}, true);

			this.actionPanel.addAction("ViewFeatureGroupItem","MultiButton fa fa-eye fa-2x", {
				validTypes:["*"],
				label: "VIEW",
				validContainerTypes: ["feature_group"],
				multiple: false,
				tooltip: "View Feature"
			},function(selection){
				console.log("selection: ", selection);
				var sel = selection[0];
				window.location = "/portal/portal/patric/Feature?cType=feature&cId=" + sel.feature_id
			}, true);

			this.actionPanel.addAction("ViewGenomeFromFeature","MultiButton fa icon-genome fa-2x", {
				validTypes:["*"],
				label: "GENOME",
				validContainerTypes: ["feature_group"],
				multiple: false,
				tooltip: "View Genome"
			},function(selection){
				console.log("selection: ", selection);
				var sel = selection[0];
				window.location = "/portal/portal/patric/Genome?cType=genome&cId=" + sel.genome_id
			}, true);

			this.actionPanel.addAction("ViewCDSFeatures","MultiButton fa icon-genome-features-cds fa-2x", {
				validTypes:["*"],
				label: "CDS",
				validContainerTypes: ["genome_group"],
				multiple: false,
				tooltip: "View CDS Features"
			},function(selection){
				console.log("selection: ", selection);
				var sel = selection[0];
				window.location = "/portal/portal/patric/FeatureTable?cType=genome&featuretype=CDS&annotation=PATRIC&filtertype=&cId="+sel.genome_id
			}, true);

			this.actionPanel.addAction("ViewGenomeBrowser","MultiButton fa icon-genome_browser fa-2x", {
				validTypes:["*"],
				label: "BROWSER",
				validContainerTypes: ["genome_group"],
				multiple: false,
				tooltip: "Open Genome Browser"
			},function(selection){
				console.log("selection: ", selection);
				var sel = selection[0];
				window.location = "/portal/portal/patric/GenomeBrowser?cType=genome&loc=0..10000&tracks=DNA,PATRICGenes,RefSeqGenes&cId=" + sel.genome_id
			}, true);


			this.actionPanel.addAction("DownloadItem","fa fa-download fa-2x",{label:"DOWNLOAD",multiple: false,validTypes:WorkspaceManager.downloadTypes, tooltip: "Download"}, function(selection){
				console.log("Download Item Action", selection);
				WorkspaceManager.downloadFile(selection[0].path);
			}, true);

			
			var dfc = '<div>Download Table As...</div><div class="wsActionTooltip" rel="text/tsv">Text</div><div class="wsActionTooltip" rel="text/csv">CSV</div><div class="wsActionTooltip" rel="application/vnd.openxmlformats">Excel</div>'
			var downloadTT=  new TooltipDialog({content: dfc, onMouseLeave: function(){ popup.close(downloadTT); }})

			on(downloadTT.domNode, "div:click", function(evt){
				var rel = evt.target.attributes.rel.value;
				console.log("REL: ", rel);
				var selection = self.actionPanel.get('selection')
				var dataType=(self.actionPanel.currentContainerWidget.containerType=="genome_group")?"genome":"genome_feature"
				var currentQuery = self.actionPanel.currentContainerWidget.get('query');
				console.log("selection: ", selection);
				console.log("DownloadQuery: ", dataType, currentQuery );
				console.log("Download link: ", "/api/" + dataType + "/" + currentQuery + "&http_authorization=" + encodeURIComponent(window.App.authorizationToken) + "&http_accept=" + rel + "&http_download=true");
				window.open("/api/" + dataType + "/" + currentQuery + "&http_authorization=" + encodeURIComponent(window.App.authorizationToken) + "&http_accept=" + rel + "&http_download=true");		
				popup.close(downloadTT);
			});

			this.browserHeader.addAction("DownloadTable","fa fa-download fa-2x",{label:"DOWNLOAD",multiple: false,validTypes:["genome_group","feature_group"], tooltip: "Download Table", tooltipDialog:downloadTT}, function(selection){
				console.log("Download Table", selection);
				popup.open({
					popup: this._actions.DownloadTable.options.tooltipDialog,
					around: this._actions.DownloadTable.button,
					orient: ["below"]
				});
	
			}, true);

			var downloadTTSelect=  new TooltipDialog({content: dfc, onMouseLeave: function(){ popup.close(downloadTTSelect); }})

			on(downloadTTSelect.domNode, "div:click", function(evt){
				var rel = evt.target.attributes.rel.value;
				console.log("REL: ", rel);
				var selection = self.actionPanel.get('selection');
				var dataType=(selection[0].type=="genome_group")?"genome":"genome_feature";
				var currentQuery = self.getQuery(selection[0]);
				console.log("selection: ", selection);
				console.log("DownloadQuery: ", dataType, currentQuery );
				window.open("/api/" + dataType + "/" + currentQuery + "&http_authorization=" + encodeURIComponent(window.App.authorizationToken) + "&http_accept=" + rel + "&http_download=true");		
				popup.close(downloadTT);
			});
			this.actionPanel.addAction("SelectDownloadTable","fa fa-download fa-2x",{label:"DOWNLOAD",multiple: false,validTypes:["genome_group","feature_group"], tooltip: "Download Selection", tooltipDialog:downloadTTSelect}, function(selection){
				console.log("Download Table", selection);
				if(selection.length==1){
					popup.open({
						popup: this._actions.SelectDownloadTable.options.tooltipDialog,
						around: this._actions.SelectDownloadTable.button,
						orient: ["below"]
					});
				}
	
			}, true);
			
			var dtsfc = '<div>Download Job Results:</div><div class="wsActionTooltip" rel="circos.svg">SVG Image</div><div class="wsActionTooltip" rel="genome_comparison.txt">Genome Comparison Table</div>'
			var downloadTTSelectFile = new TooltipDialog({content: dtsfc, onMouseLeave: function(){ popup.close(downloadTTSelect); }})

			this.browserHeader.addAction("SelectDownloadSeqComparison","fa fa-download fa-2x",{label:"DOWNLOAD",multiple: false,validTypes:["GenomeComparison"], tooltip: "Download Results", tooltipDialog:downloadTTSelectFile}, lang.hitch(this.browserHeader,function(selection){
				console.log("Download Table", selection);
				console.log("this._actions: ", this._actions);
				this._actions.SelectDownloadSeqComparison.selection=selection[0];
				if(selection.length==1){
					popup.open({
						popup: this._actions.SelectDownloadSeqComparison.options.tooltipDialog,
						around: this._actions.SelectDownloadSeqComparison.button,
						orient: ["below"]
					});
				}
	
			}), true);

			on(downloadTTSelectFile.domNode, "div:click", lang.hitch(this.browserHeader,function(evt){
				var rel = evt.target.attributes.rel.value;
//				console.log("REL: ", rel);
//				console.log("SELECTION: ", this._actions.SelectDownloadSeqComparison.selection);
				var outputFiles = this._actions.SelectDownloadSeqComparison.selection.autoMeta.output_files;
				outputFiles.some(function(t){
					var fname = t[0];
					if (fname.indexOf(rel)>=0){
						console.log("DOWNLOAD: ", fname);
						WorkspaceManager.downloadFile(fname);
						return true;
					}
					return false;
				});
				popup.close(downloadTTSelectFile);
			}));

			this.browserHeader.addAction("ViewAnnotatedGenome","fa fa-eye fa-2x",{label:"VIEW", multiple: false,validTypes:["GenomeAnnotation"], tooltip: "View Annotated Genome"}, function(selection){
				console.log("View Genome Annotation: ", selection[0]);
				var gid = self.actionPanel.currentContainerWidget.getGenomeId();
				var url= "/portal/portal/patric/Genome?cType=genome&cId=" + gid;
				window.location=url;

			}, true);

			this.browserHeader.addAction("ViewModel","fa fa-eye fa-2x",{label:"VIEW", multiple: false,validTypes:["model"], tooltip: "View Model @ Modelseed"}, function(selection){
				console.log("View Model: ", selection[0]);
				var path = self.actionPanel.currentContainerWidget.getModelPath();
				var url= "http://modelseed.theseed.org/#/model" + path + "?login=patric";
				//window.location=url;
				window.open(url,"_blank");
			}, true);



			this.browserHeader.addAction("ViewAnnotatedGenomeCDS","fa icon-genome-features-cds fa-2x",{label:"CDS", multiple: false,validTypes:["GenomeAnnotation"], tooltip: "View CDS for Annotated Genome"}, function(selection){
				console.log("View Genome Annotation: ", selection[0]);
				var gid = self.actionPanel.currentContainerWidget.getGenomeId();
				window.location = "/portal/portal/patric/FeatureTable?cType=genome&featuretype=CDS&annotation=PATRIC&filtertype=&cId="+gid;

			}, true);

			this.browserHeader.addAction("ViewAnnotatedGenomeBrowser","fa icon-genome_browser fa-2x",{label:"BROWSER", multiple: false,validTypes:["GenomeAnnotation"], tooltip: "View Annotated Genome in Genome Browser"}, function(selection){
				console.log("View Genome Annotation: ", selection[0]);
				var gid = self.actionPanel.currentContainerWidget.getGenomeId();
				window.location = "/portal/portal/patric/GenomeBrowser?cType=genome&loc=0..10000&tracks=DNA,PATRICGenes,RefSeqGenes&cId=" + + gid;

			}, true);




			this.browserHeader.addAction("Upload","fa fa-upload fa-2x",{label:"UPLOAD", multiple: true,validTypes:["folder"], tooltip: "Upload to Folder"}, function(selection){
				console.log("UPLOAD TO: ", selection[0].path + selection[0].name); 
				Topic.publish("/openDialog",{type:"Upload",params:selection[0].path + selection[0].name });
			}, true);

			this.browserHeader.addAction("Create Folder","fa icon-folder-plus fa-2x",{label: "ADD FOLDER",multiple: true,validTypes:["folder"], tooltip: "Create Folder"}, function(selection){
				console.log("CREATE FOLDER", selection[0].path);
				Topic.publish("/openDialog",{type:"CreateFolder",params:selection[0].path + selection[0].name});
			}, true);



			
			var vfc = '<div class="wsActionTooltip" rel="dna">View FASTA DNA</div><divi class="wsActionTooltip" rel="protein">View FASTA Proteins</div>'
			var viewFASTATT=  new TooltipDialog({content: vfc, onMouseLeave: function(){ popup.close(viewFASTATT); }})

			on(viewFASTATT.domNode, "div:click", function(evt){
				var rel = evt.target.attributes.rel.value;
				console.log("REL: ", rel);
				var selection = self.actionPanel.get('selection')
				console.log("selection: ", selection);
				popup.close(viewFASTATT);

				var ids = selection.map(function(d){ return d['feature_id']; });
				var frm = domConstruct.create("form", {style: {display: "none"},method: "POST", action: "/portal/portal/patric/FeatureTable/FeatureTableWindow?action=b&cacheability=PAGE&mode=fasta", target: "fastaDisplay"}, this.domNode);
				domConstruct.create("input", {name: "fastaaction", value: "display"},frm);
				domConstruct.create("input", {name: "fastascope", value: "Selected"},frm);
				domConstruct.create("input", {name: "fastatype", value: rel},frm);
				domConstruct.create("input", {name: "fids", value: ids},frm);

				window.open("","fastaDisplay","width=920,height=400,scrollbars,resizable")
				
				frm.submit();
			});

			this.actionPanel.addAction("ViewFASTA","fa icon-fasta fa-2x",{label: "FASTA",ignoreDataType:true, multiple: true,validTypes:["*"],validContainerTypes: ["feature_group"], tooltip: "View FASTA Data",tooltipDialog:viewFASTATT}, function(selection){
				popup.open({
					popup: this._actions.ViewFASTA.options.tooltipDialog,
					around: this._actions.ViewFASTA.button,
					orient: ["below"]
				});
				console.log("popup viewFASTA", selection);
	
			}, true);

			this.actionPanel.addAction("MultipleSeqAlignment","fa icon-alignment fa-2x",{label:"MSA",ignoreDataType:true,multiple: true,validTypes:["*"],validContainerTypes: ["feature_group"], tooltip: "Multiple Sequence Alignment"}, function(selection){
				var selection = self.actionPanel.get('selection')
				var ids = selection.map(function(d){ return d['feature_id']; });


				xhr.post("/portal/portal/patric/FIGfam/FIGfamWindow?action=b&cacheability=PAGE",{
					data: {
						featureIds: ids.join(","),
						callType: 'toAligner'	
					}
				}).then(function(results){
					document.location = "/portal/portal/patric/MSA?cType=&cId=&pk=" + results;
				});

			}, true);

			var idMappingTTDialog =  new TooltipDialog({content: IDMappingTemplate, onMouseLeave: function(){ popup.close(idMappingTTDialog); }})

			on(idMappingTTDialog.domNode, "TD:click", function(evt){
				var rel = evt.target.attributes.rel.value;
				console.log("REL: ", rel);
				var selection = self.actionPanel.get('selection')
				console.log("selection: ", selection);
				var ids = selection.map(function(d){ return d['feature_id']; });

				xhr.post("/portal/portal/patric/IDMapping/IDMappingWindow?action=b&cacheability=PAGE", {
					data: {
						keyword: ids.join(","),
						from: "feature_id",
						fromGroup: "PATRIC",
						to: rel,
						toGroup: (["seed_id","feature_id","alt_locus_tag","refseq_locus_tag","protein_id","gene_id","gi"].indexOf(rel) > -1)?"PATRIC":"Other",
						sraction: 'save_params'	
					}
				}).then(function(results){
					document.location = "/portal/portal/patric/IDMapping?cType=taxon&cId=131567&dm=result&pk=" + results;
				});
				popup.close(idMappingTTDialog);
			});

			this.actionPanel.addAction("idmapping","fa icon-exchange fa-2x",{label:"ID MAP",ignoreDataType:true,multiple: true,validTypes:["*"],validContainerTypes: ["feature_group"],tooltip: "ID Mapping", tooltipDialog:idMappingTTDialog },function(selection){

				console.log("TTDlg: ", this._actions.idmapping.options.tooltipDialog);
				console.log("this: ", this);
				popup.open({
					popup: this._actions.idmapping.options.tooltipDialog,
					around: this._actions.idmapping.button,
					orient: ["below"]
				});
				console.log("popup idmapping", selection);
			}, true);

			this.actionPanel.addAction("Pathway Summary","fa icon-git-pull-request fa-2x",{label:"PATHWAY",ignoreDataType:true,multiple: true,validTypes:["*"],validContainerTypes: ["feature_group"], tooltip: "Pathway Summary"}, function(selection){

				var selection = self.actionPanel.get('selection')
				var ids = selection.map(function(d){ return d['feature_id']; });


				xhr.post("/portal/portal/patric/TranscriptomicsEnrichment/TranscriptomicsEnrichmentWindow?action=b&cacheability=PAGE",{
					data: {
						feature_id: ids.join(","),
						callType: 'saveParams'	
					}
				}).then(function(results){
					document.location = "/portal/portal/patric/TranscriptomicsEnrichment?cType=taxon&cId=131567&pk=" + results;
				});

			}, true);



			this.actionPanel.addAction("ExperimentGeneList","fa icon-list-unordered fa-2x",{label: "GENES", multiple: true, validTypes:["DifferentialExpression"], 
				tooltip: "View Gene List"}, function(selection){
				console.log("View Gene List", selection);
				window.location =  "/portal/portal/patric/TranscriptomicsGene?cType=taxon&cId=131567&dm=result&log_ratio=&zscore=&expId=&sampleId=&wsSampleId=&wsExperimentId=" + selection.map(function(s){return s.path;})
			}, true);

			this.actionPanel.addAction("ExperimentGeneList3","fa icon-list-unordered fa-2x",{label: "GENES", multiple: true, validTypes: ["*"], validContainerTypes: ["experiment"], tooltip: "View Experiment Gene List"}, function(selection){
				console.log("this.currentContainerType: ", this.currentContainerType, this);
				console.log("View Gene List", selection);
				var expPath = this.currentContainerWidget.get('path');
				window.location =  "/portal/portal/patric/TranscriptomicsGene?cType=taxon&cId=131567&dm=result&log_ratio=&zscore=&expId=&sampleId=&wsExperimentId=" + expPath + "&wsSampleId=" + selection.map(function(s){return s.pid;})
			}, true);



			this.actionPanel.addAction("ExperimentGeneList2","fa icon-list-unordered fa-2x",{multiple: true, validContainerTypes:["experiment_group"],validTypes:["*"], tooltip: "View Experiment Group Gene List"}, function(selection){
				console.log("View Gene List2", selection);
				var expids = []
				var wsExps = []
				selection.forEach(function(s){
					if (s.path) {
						wsExps.push(s.path);
					}else if (s.expid){
						expids.push(s.expid);
					}
					
				});
				var url = "/portal/portal/patric/TranscriptomicsGene?cType=taxon&cId=131567&dm=result&log_ratio=&zscore=";
				if (expids && expids.length>0){
					url = url + "&expId=" + expids.join(",")+"&sampleId=";
				}else{
					url = url + "&expId=&sampleId=";
				}
				if (wsExps && wsExps.length>0){
					url = url + "&wsExperimentId=" + wsExps.join(",") + "&wsSampleId=";
				}else{
					url = url + "&wsExperimentId=&wsSampleId=";
				}



				
				window.location =  url;
			}, true);

	
	

			/*
			this.actionPanel.addAction("UploadItem","fa fa-upload fa-2x", {multiple: false,validTypes:["*"]}, function(selection){
				console.log("Replace Item Action", selection);
				Topic.publish("/openDialog",{type:"UploadReplace",params:{path: selection[0].path}});
			}, true);
			*/

			this.actionPanel.addAction("RemoveItem", "fa fa-remove fa-2x", {label:"REMOVE",ignoreDataType:true,multiple: true, validTypes:["*"],validContainerTypes:["genome_group","feature_group"],tooltip: "Remove Selection from Group"}, function(selection){
				console.log("Remove Items from Group", selection);
				console.log("currentContainerWidget: ", this.currentContainerWidget);
					
				var type = selection[0].document_type;
				var idType = (this.currentContainerWidget.containerType=="genome_group")?"genome_id":"feature_id";
				var type = (idType=="genome_id")?"genome":"genome feature";
				var objs = selection.map(function(s){
					console.log('s: ', s, s.data);
					return s[idType];
				});
	
				var conf = "Are you sure you want to remove " + objs.length + " " + type + 
					   ((objs.length>1)?"s":"") +
					   " from this group?"
				var _self=this;	
				var dlg = new Confirmation({
					content: conf,
					onConfirm: function(evt){
						console.log("remove items from group, ", objs, _self.currentContainerWidget.get('path')) ;
						Deferred.when(WorkspaceManager.removeFromGroup(_self.currentContainerWidget.get('path'),idType, objs), function(){
							if (_self.currentContainerWidget && _self.currentContainerWidget.refresh){
								_self.currentContainerWidget.refresh();
							}else{
								console.log("No current container Widget or no refresh() on it");
							}
						});
					}
				})
				dlg.startup()
				dlg.show();
	
			},true);

			var _self=this;
			this.actionPanel.addAction("SplitItems", "fa icon-split fa-2x", {label:"SPLIT",ignoreDataType:true,multiple: true, validTypes:["*"],validContainerTypes:["genome_group","feature_group"],tooltip: "Copy selection to a new or existing group"}, function(selection, containerWidget){
				console.log("Add Items to Group", selection);
				var dlg = new Dialog({title:"Copy Selection to Group"});
				var stg = new SelectionToGroup({selection: selection, type: containerWidget.containerType,path: containerWidget.get("path")});
				on(dlg.domNode, "dialogAction", function(evt){
					dlg.hide();
					setTimeout(function(){
						dlg.destroy();
					},2000);
				});
				domConstruct.place(stg.domNode, dlg.containerNode,"first");
				stg.startup();
				dlg.startup();
				dlg.show();
			},true);


//			this.actionPanel.addAction("Table", "fa icon-table fa-2x", {multiple: true, validTypes:["*"]}, function(selection){
//				console.log("Remove Items from Group", selection);
//			},true);


			this.actionPanel.addAction("DeleteItem","fa fa-trash fa-2x",{label:"DELETE",allowMultiTypes:true,multiple: true,validTypes:["genome_group","feature_group","experiment_group","job_result","unspecified","contigs","reads","diffexp_input_data","diffexp_input_metadata","DifferentialExpression","GenomeAssembly","GenomeAnnotation","RNASeq"], tooltip: "Delete Selection"}, function(selection){
				var objs = selection.map(function(s){
					console.log('s: ', s, s.data);
					return s.path||s.data.path;
				});
				var conf = "Are you sure you want to delete" +
					   ((objs.length>1)?" these objects":" this object") +
					   " from your workspace?"
	
				var dlg = new Confirmation({
					content: conf,
					onConfirm: function(evt){
						WorkspaceManager.deleteObject(objs,true, false);
					}
				})
				dlg.startup()
				dlg.show();
			}, true);

			this.actionPanel.addAction("DeleteFolder","fa fa-trash fa-2x",{label:"DELETE",allowMultiTypes:false,multiple: true,validTypes:["folder"],tooltip: "Delete Folder"}, function(selection){
				var objs = selection.map(function(s){
					console.log('s: ', s, s.data);
					return s.path||s.data.path;
				});
				var conf = "Are you sure you want to delete" +
					   ((objs.length>1)?" these folders":" this folder") +
					   " and its contents from your workspace?"
	
				var dlg = new Confirmation({
					content: conf,
					onConfirm: function(evt){
						WorkspaceManager.deleteObject(objs,true, true);
					}
				})
				dlg.startup()
				dlg.show();
	
			}, true);




			this.itemDetailPanel = new ItemDetailPanel({region: "right", style: "width:300px", splitter: false, layoutPriority:1})
			this.itemDetailPanel.startup();
			this.addChild(this.actionPanel);
			this.addChild(this.itemDetailPanel);
			this.addChild(this.browserHeader);

			var self=this;
			this.inherited(arguments);

		},
		_setPathAttr: function(val){
			console.log("WorkspaceBrowser setPath()", val)
			this.path = decodeURIComponent(val);
			var parts = this.path.split("/").filter(function(x){ return x!=""; }).map(function(c){ return decodeURIComponent(c) });
			var workspace = parts[0] + "/" + parts[1];
			var obj;
			console.log("Workspace: ", workspace, parts[1], val)
			if (!window.App.user || !window.App.user.id){
				Topic.publish("/login");
				return;
			}
			if (!parts[1]){
				obj = {metadata: {type: "folder"}}
			}else{
				obj = WorkspaceManager.getObject(val,true)
			}
			Deferred.when(obj, lang.hitch(this,function(obj){

				if (this.browserHeader) {
					console.log("Set BrowserHeader selection: ", [obj]);
					this.browserHeader.set("selection", [obj]);

				}
				var panelCtor;
				var params = {path: this.path, region: "center"}
				console.log("Browse to Type: ", obj.type, obj);
				switch(obj.type) {
					case "folder": 
						panelCtor = WorkspaceExplorerView;
						break;
					case "genome_group":
						panelCtor = window.App.getConstructor("p3/widget/viewer/GenomeGroup");
						params.query="?&in(genome_id,GenomeGroup("+encodeURIComponent(this.path).replace("(","%28").replace(")","%29")+"))";
						break;
					case "feature_group":
						panelCtor = window.App.getConstructor("p3/widget/viewer/FeatureList");
						params.query="?&in(feature_id,FeatureGroup("+encodeURIComponent(this.path)+"))";
						break;
					case "model":
						panelCtor = window.App.getConstructor("p3/widget/viewer/Model");
						params.data = obj;
						break;
					case "job_result":
						var d = "p3/widget/viewer/JobResult"
						console.log("job_result object: ", obj);
						if (obj && obj.autoMeta && obj.autoMeta.app){
							var id = obj.autoMeta.app.id || obj.autoMeta.app
							switch(id){
								case "DifferentialExpression":
									console.log("Using Experiement Viewer");
									d = "p3/widget/viewer/Experiment"
									break;
								case "GenomeComparison": 
									console.log("SeqComparison Viewer");
									d = "p3/widget/viewer/SeqComparison"
									break;
								case "GenomeAnnotation": 
									console.log("GenomeAnnotation Viewer");
									d = "p3/widget/viewer/GenomeAnnotation"
									break;

							}
						}			
						console.log("LOAD VIEWER: ", d, params);
						panelCtor = window.App.getConstructor(d);
						params.data = obj;
						//params.query="?&in(feature_id,FeatureGroup("+encodeURIComponent(this.path)+"))";
						break;
					case "experiment_group":
						panelCtor = window.App.getConstructor("p3/widget/viewer/ExperimentGroup");
						params.data= obj;
						break;
					default:
						panelCtor = window.App.getConstructor("p3/widget/viewer/File");
						params.file = {metadata: obj};
						console.log("FileViewer Ctor params: ", params);
				}	

				console.log("params.query: ", params.query);
				Deferred.when(panelCtor, lang.hitch(this,function(Panel){
					console.log("ActivePanel instanceof Panel: ", this.activePanel instanceof Panel);
					if (!this.activePanel || !(this.activePanel instanceof Panel)){
						if (this.activePanel) { 
							this.removeChild(this.activePanel);
						 }
						console.log("Creeate New Active Panel");
						var newPanel = new Panel(params);
						var hideTimer;
						this.actionPanel.set("currentContainerWidget", newPanel);
						this.itemDetailPanel.set("containerWidget", newPanel);

						if (newPanel.on) {
						newPanel.on("select", lang.hitch(this,function(evt){
							console.log("Selected: ", evt);
							var sel = Object.keys(evt.selected).map(lang.hitch(this,function(rownum){
								console.log("rownum: ", rownum);
								console.log("Row: ", evt.grid.row(rownum).data);
								return evt.grid.row(rownum).data;
							}));
							console.log("selection: ", sel);
							console.log("this.activePanel: ", newPanel);
							if (hideTimer) {
								clearTimeout(hideTimer);
							}
							if (sel.length>0){
								this.addChild(this.actionPanel);
							}
							this.actionPanel.set("selection", sel);
							this.itemDetailPanel.set('selection', sel);
							
							/*
							if (sel.length==1) {
								if (this.getChildren().some(function(child){
									return (child===this.actionPanel)
								},this)) {
									this.itemDetailPanel.set("item",sel[0]);	
								}
							}else if (sel.length>1) {

							}else {
								this.removeChild(this.actionPanel);
							}
							*/
						}));	

						newPanel.on("deselect", lang.hitch(this,function(evt){

							if (!evt.selected) { 
								this.actionPanel.set("selection", []); 
								this.itemDetailPanel.set("selection", []);
							}else{
								var sel = Object.keys(evt.selected).map(lang.hitch(this,function(rownum){
									console.log("rownum: ", rownum);
									console.log("Row: ", evt.grid.row(rownum).data);
									return evt.grid.row(rownum).data;
								}));
							}
							console.log("selection: ", sel);
							this.actionPanel.set("selection", sel);
							this.itemDetailPanel.set('selection', sel);
						/*	if (!sel || sel.length<1){
								hideTimer = setTimeout(lang.hitch(this,function(){
									this.removeChild(this.actionPanel);
									this.removeChild(this.itemDetailPanel);
								}),500);	
							}
						*/
						}));

						newPanel.on("ItemDblClick", lang.hitch(this,function(evt){
							console.log("ItemDblClick: ", evt);
							if (evt.item && evt.item.type && (this.navigableTypes.indexOf(evt.item.type)>=0)){
								Topic.publish("/navigate", {href:"/workspace" + evt.item_path })
								this.actionPanel.set("selection", []);
								this.itemDetailPanel.set("selection", []);
								console.log("SHOW LOADING STATUS SOMEHOW");	
								newPanel.clearSelection();
								/*
								hideTimer = setTimeout(lang.hitch(this,function(){
									this.removeChild(this.actionPanel);
									this.removeChild(this.itemDetailPanel);
								}),500);	
								*/
							}else{
								console.log("non-navigable type, todo: show info panel when dblclick");
							}
	
						}));
						}
	
						this.addChild(newPanel);
						this.activePanel = newPanel;
					}else{
						this.activePanel.set('path', this.path);
						if (this.activePanel.clearSelection){
							this.activePanel.clearSelection();
						}
					//	this.removeChild(this.actionPanel);
					//	this.removeChild(this.itemDetailPanel);
					}

					var parts = this.path.split("/").filter(function(x){ return x!=""; }).map(function(c){ return decodeURIComponent(c) });
					var workspace = parts[0] + "/" + parts[1];
					console.log("Publish to ActiveWorkspace:",workspace,val)
					WorkspaceManager.set("currentPath",val);
//					Topic.publish("/ActiveWorkspace",{workspace: workspace, path:val});

					console.log("Set Browser Header Path: ", this.path);
					this.browserHeader.set("path", this.path)
/*
					if (this._started){
						var len = parts.length;
						var out = [];

						var out = ["<span class='wsBreadCrumb'>"];
						var bp = ["workspace"];
						parts.forEach(function(p,idx){
							if (idx == (parts.length-1)){
								out.push(p + "&nbsp;");
								return;
							}
							out.push("<a class='navigationLink' href='");
							bp.push(p);
							out.push("/" + bp.join("/") + ((idx==0)?"/":"") );
							out.push("'>" + ((idx==0)?p.replace("@patricbrc.org",""):p)  + "</a>&nbsp;/&nbsp;");
						})
						//out.push("<span>" + parts.join("/") + "</span>");
						out.push("<span style='float:right;'>");
						out.push("<a href class='DialogButton fa fa-upload fa-2x' rel='Upload:" + ((this.path.charAt(-1)=="/")?this.path:this.path+"/")+ "' style='margin:4px;' title='Upload to Folder'></a>");
						out.push("<a href class='DialogButton fa icon-folder-plus fa-2x' rel='CreateFolder:" + ((this.path.charAt(-1)=="/")?this.path:this.path+"/") + "' style='margin:4px;' title='Create Folder' ></a>");
						out.push("</span>");	

						this.browserHeader.set("content", out.join(""));
					}
*/
				}));

			}));
		},

		getQuery: function(obj){
			var query ="";
			switch(obj.type) {
				case "genome_group":
					query="?&in(genome_id,GenomeGroup("+encodeURIComponent(obj.path).replace("(","%28").replace(")","%29")+"))";
					break;
				case "feature_group":
					query="?&in(feature_id,FeatureGroup("+encodeURIComponent(obj.path)+"))";
					break;
			}
			return query;
		},

		refresh: function(){
			if (this.activePanel instanceof WorkspaceExplorerView){
				this.explorer.refreshWorkspace()
			}
		},
		getMenuButtons: function(){
			// console.log("Get Menu Buttons");
	  //       if (this.buttons) { return this.buttons; }
	  //       this.buttons = [];
	  //       var b = domConstruct.create("div", {innerHTML:"Add Folder", 'class':'facetMenuIcon plusIcon',title:"Add Document Comment"});
	  //       on(b, "click", function(){
	  //               Topic.publish("/dialog/show","AddComment");
	  //       });
	  //       this.buttons.push(b);
	  		this.buttons=[];
	        return this.buttons;

		}
	});
});
