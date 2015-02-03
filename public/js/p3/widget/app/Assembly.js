define([
	"dojo/_base/declare","dijit/_WidgetBase","dojo/on",
	"dojo/dom-class","dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/Assembly.html","./AppBase","dojo/dom-construct",
	"dgrid/Grid","dgrid/extensions/DijitRegistry",
        "dgrid/Keyboard", "dgrid/Selection","dgrid/extensions/ColumnResizer","dgrid/extensions/ColumnHider",
        "dgrid/extensions/DnD","dojo/dnd/Source","dojo/_base/Deferred","dojo/aspect","dojo/_base/lang","dojo/domReady!"
], function(
	declare, WidgetBase, on,
	domClass,Templated,WidgetsInTemplate,
	Template,AppBase,domConstr,
        Grid,Store,DijitRegistry,
        Keyboard,Selection,formatter,ColumnResizer,
        ColumnHider,DnD,DnDSource,
        Deferred,aspect,lang,domReady
){
	return declare([AppBase], {
		"baseClass": "App Assembly",
		templateString: Template,
		applicationName: "Assembly",
		libraryData: null,
		startingRows: 14,
		addedRows: 0,
		constructor: function(){
            		this.libraryData = [
				{ first: 'Bob', last: 'Barker', age: 89 },
				{ first: 'Vanna', last: 'White', age: 55 },
				{ first: 'Pat', last: 'Sajak', age: 65 }
			];
		},
                startup: function(){
                        if (this._started) { return; }
                        this.inherited(arguments);
			for (i = 0; i < this.startingRows; i++) { 
				var tr =  this.libsTable.insertRow(0);//domConstr.create("tr",{},this.libsTableBody);
				var td = domConstr.create('td', {innerHTML: "<div class='emptyrow'></div>"},tr);
				var td2 = domConstr.create("td", {innerHTML: "<div class='emptyrow'></div>"},tr);
			}
/*
			this.libraryGrid = new Grid({
				columns: {'first': 'Libraries in assembly'}
			}, this.gridNode);

			this.libraryGrid.startup();
			this.libraryGrid.renderArray(this.libraryData);
*/			
			this._started=true;
		},

		onAddPair: function(){
			console.log("Create New Row", domConstr);
			var tr =  this.libsTable.insertRow(0);//var tr =  domConstr.create("tr",{},this.libsTableBody);
			var td = domConstr.create('td', {innerHTML: "somefile.txt"},tr);
			var td2 = domConstr.create("td", {innerHTML: "<i class='fa fa-times fa-1x' />"},tr);
			if(this.addedRows < this.startingRows){
				this.libsTable.deleteRow(-1);
			}
			var handle = on(td2, "click", function(evt){
				domConstr.destroy(tr);
				handle.remove();
				this.addedRows = this.addedRows-1;
				if (this.addedRows < this.startingRows){
					var tr =  this.libsTable.insertRow(-1);//domConstr.create("tr",{},this.libsTable);
					var td = domConstr.create('td', {innerHTML: "<div class='emptyrow'></div>"},tr);
					var td2 = domConstr.create("td", {innerHTML: "<div class='emptyrow'></div>"},tr);
				}	
			});
			this.addedRows= this.addedRows+1;
		}
		
	});
});

