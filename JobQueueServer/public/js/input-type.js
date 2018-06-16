// Interface Type
class IType {
	constructor(infos){
		this.infos = infos;
		this.class = infos.class ? infos.class : "";
		this.attributes = infos.attributes ? infos.attributes : {};
		this.conditions = infos.conditions ? infos.conditions : {};
	}
	getValue(){
		return "";
	}
	setValue(value){

	}
	getElement(){
		return $("");
	}
	verify(){
		return true;
	}
	attributesHTML(){
		var thisObj = this;
		var result = " ";
		Object.keys(thisObj.attributes).forEach(function(key){
			var value = thisObj.attributes[key];
			result += key + "='" + value + "' ";
		})
		return result;
	}
	onChange(callback){
		this.element.find(".input").change(callback);
	}
	checkConditions(){
		var conditions = this.conditions;
		var $element = this.getElement();
		onChange();
		Object.keys(conditions).forEach(function(key){
			var input = TypeManager.listInputs[key];
			input.onChange(onChange);
		})
		function onChange(){
			var is_show = true;
			Object.keys(conditions).forEach(function(key){
				var value = conditions[key];
				var input = TypeManager.listInputs[key];
				if (!input) is_show = false;
				if (value != input.getValue())
					is_show = false;
			})
			if (is_show) $element.slideDown();
			else $element.slideUp();
		}
	}
}
// Type default
class TypeDefault extends IType {
	// { field_name, name, value }
	constructor(infos){	
		super(infos);
		this.type = infos.type;
		this.field_name = infos.field_name;
		this.name = infos.name;
		this.helper = infos.helper;
		this.value = infos.value;
		this.required = (infos.required && infos.required == 1) ? true : false;
		this.element = this.createElement();

		var element = this.element;
		this.element.find(".input").change(function(event) {
			element.removeClass('error');
		});
	}
	verify(){
		if (!this.required || this.getValue() != "")
			return true;
		this.element.addClass('error');
		return false;
	}
	getValue(){
		return this.element.find(".input").val();
	}
	setValue(value){
		this.element.find(".input").val(value);
	}
	createElement() {
		var valueHtml = (this.value) ? 'value="'+this.value+'"' : "";
		var htmlHelper = (this.helper) ? '<p><small><i>'+this.helper+'</i></small><p>' : "";
		var html = '<div class="form-group typetext '+this.class+'">\
					<label for="'+this.field_name+'">'+this.name+'</label>\
					<input '+this.attributesHTML()+' type="'+this.type+'" class="form-control input" id="'+this.field_name+'" name="'+this.field_name+'" '+valueHtml+'>\
					'+htmlHelper+'\
				</div>';
		return $(html);
	}
	getElement(){
		return this.element;
	}
	onChange(callback){
		this.element.find(".input").change(callback);
	}
}
// Type text
class TypeText extends IType {
	// { field_name, name, value }
	constructor(infos){	
		super(infos);
		this.field_name = infos.field_name;
		this.name = infos.name;
		this.value = infos.value;
		this.helper = infos.helper;
		this.required = (infos.required && infos.required == 1) ? true : false;
		this.element = this.createElement();

		var element = this.element;
		this.element.find(".input").change(function(event) {
			element.removeClass('error');
		});
	}
	verify(){
		if (!this.required || this.getValue() != "")
			return true;
		this.element.addClass('error');
		return false;
	}
	getValue(){
		return this.element.find(".input").val();
	}
	setValue(value){
		this.element.find(".input").val(value);
	}
	createElement() {
		var valueHtml = (this.value) ? 'value="'+this.value+'"' : "";
		var htmlHelper = (this.helper) ? '<p><small><i>'+this.helper+'</i></small><p>' : "";
		var html = '<div class="form-group '+this.class+' typetext">\
					<label for="'+this.field_name+'">'+this.name+'</label>\
					<input type="text" '+this.attributesHTML()+' class="form-control input" id="'+this.field_name+'" name="'+this.field_name+'" '+valueHtml+'>\
					'+htmlHelper+'\
				</div>';
		return $(html);
	}
	getElement(){
		return this.element;
	}
	onChange(callback){
		this.element.find(".input").change(callback);
	}
}
// Type checkbox
class TypeCheckbox extends IType {
	// { field_name, name, value }
	constructor(infos){	
		super(infos);
		this.field_name = infos.field_name;
		this.name = infos.name;
		this.value = parseInt(infos.value);
		this.element = this.createElement();
	}
	getValue(){
		return (this.element.find(".input").is(":checked")) ? 1 : 0;
	}
	setValue(value){
		if (value == 1)
			this.element.find(".input").attr("checked", "");
		else 
			this.element.find(".input").removeAttr("checked");
	}
	createElement() {
		var valueHtml = (this.value) ? 'value="'+this.value+'"' : "";
		var checked = (this.value == 1) ? "checked" : "";
		var html = '<div class="form-group '+this.class+'">\
					<label class="checkbox-inline">\
					<input type="checkbox" '+this.attributesHTML()+' class="input" id="'+this.field_name+'" name="'+this.field_name+'" '+checked+'> '+this.name+'</label>\
				</div>';
		return $(html);
	}
	getElement(){
		return this.element;
	}
	onChange(callback){
		this.element.find(".input").change(callback);
	}
}
// Type select
class TypeSelect extends IType {
	// { field_name, name, value }
	constructor(infos){	
		super(infos);
		this.field_name = infos.field_name;
		this.choices = (infos.choices) ? infos.choices : {};
		this.name = infos.name;
		this.value = infos.value;
		this.element = this.createElement();
	}
	getValue(){
		return this.element.find(".input").val();
	}
	setValue(value){
		this.element.find(".input").val(value);
	}
	createElement() {
		var options = "";
		var choices = this.choices;
		var currentValue = this.value;
		Object.keys(this.choices).forEach(function(value){
			var name = choices[value];
			var selected = (value == currentValue) ? "selected" : "";
			options += '<option value="'+value+'" '+selected+'>'+name+'</option>';
		})
		var html = '<div class="form-group '+this.class+'">\
					<label for="'+this.field_name+'">'+this.name+'</label>\
					<select '+this.attributesHTML()+' class="form-control input" id="'+this.field_name+'" name="'+this.field_name+'" >\
						'+options+'\
					</select>\
				</div>';
		return $(html);
	}
	getElement(){
		return this.element;
	}
	onChange(callback){
		this.element.find(".input").change(callback);
	}
}
// Type radio
class TypeRadio extends IType {
	// { field_name, name, value }
	constructor(infos){	
		super(infos);
		this.field_name = infos.field_name;
		this.choices = (infos.choices) ? infos.choices : {};
		this.name = infos.name;
		this.value = infos.value;
		this.element = this.createElement();
	}
	getValue(){
		return this.element.find(".input:checked").val();
	}
	setValue(value){
		this.element.find(".input[value='"+value+"']").attr('checked', '');
	}
	createElement() {
		var options = "";
		var choices = this.choices;
		var currentValue = this.value;
		var field_name = this.field_name;
		Object.keys(this.choices).forEach(function(value){
			var name = choices[value];
			var checked = (value == currentValue) ? "checked" : "";
			options += '<div class="radio"><label><input class="input" '+checked+' type="radio" value="'+value+'" name="'+field_name+'"> '+name+'</label></div>'
		})
		var html = '<div class="form-group '+this.class+'">\
					<label>'+this.name+'</label>\
					'+options+'\
				</div>';
		return $(html);
	}
	getElement(){
		return this.element;
	}
	onChange(callback){
		this.element.find(".input").change(callback);
	}
}
// Type textarea
class TypeTextarea extends IType {
	constructor(infos){	
		super(infos);
		this.field_name = infos.field_name;
		this.name = infos.name;
		this.value = infos.value;
		this.element = this.createElement();

		var element = this.element;
		this.element.find(".input").change(function(event) {
			element.removeClass('error');
		});
	}
	verify(){
		if (!this.required || this.getValue() != "")
			return true;
		this.element.addClass('error');
		return false;
	}
	getValue(){
		return this.element.find(".input").val();
	}
	setValue(value){
		this.element.find(".input").val(value);
	}
	createElement() {
		var valueHtml = (this.value) ? this.value : "";
		var html = '<div class="form-group typetextarea '+this.class+'">\
					<label for="'+this.field_name+'">'+this.name+'</label>\
					<textarea '+this.attributesHTML()+' class="form-control input" id="'+this.field_name+'" name="'+this.field_name+'" rows="10">'+valueHtml+'</textarea>\
				</div>';
		return $(html);
	}
	getElement(){
		return this.element;
	}
	onChange(callback){
		this.element.find(".input").change(callback);
	}
}

// Type editor
class TypeEditor extends IType {
	constructor(infos){	
		super(infos);
		this.field_name = infos.field_name;
		this.name = infos.name;
		this.value = infos.value;
		this.element = this.createElement();
		
		var element = this.element;
		this.element.find(".input").change(function(event) {
			element.removeClass('error');
		});
	}
	verify(){
		if (!this.required || this.getValue() != "")
			return true;
		this.element.addClass('error');
		return false;
	}
	getValue(){
		return this.element.find(".input").val();
	}
	setValue(value){
		this.element.find("textarea").trumbowyg('html');
	}
	createElement() {
		var valueHtml = (this.value) ? this.value : "";
		var html = '<div class="form-group typeeditor '+this.class+'">\
					<label for="'+this.field_name+'">'+this.name+'</label>\
					<textarea class="form-control input" id="'+this.field_name+'" name="'+this.field_name+'" rows="10">'+valueHtml+'</textarea>\
				</div>';
		var element = $(html);
		element.find('textarea').trumbowyg({
			btns: [
				['formatting'],
				['strong', 'em', 'del'],
				['foreColor', 'backColor'],
				['link'],
				['insertImage'],
				['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
				['unorderedList', 'orderedList'],
				['horizontalRule'],
				['removeformat'],
				['fullscreen'],
				['undo', 'redo'],
				['viewHTML']
			]
		})
		return element;
	}
	getElement(){
		return this.element;
	}
}
// Type repeat
class TypeRepeat extends IType {
	constructor(infos){	
		console.log(infos)
		super(infos);
		this.field_name = infos.field_name;
		this.name = infos.name;
		this.helper = infos.helper;
		this.min = (infos.min) ? infos.min : 0;
		this.max = (infos.max) ? infos.max : -1;
		this.value = (infos.value) ? infos.value : [];	// [{ field_name(fieldAInfo): value, field_name(fieldBInfo): value, ... }]
		for(var i = 0; i < this.value.length; i++){
			var fieldInfo = this.value[i];
			Object.keys(fieldInfo).forEach(function(key){
				fieldInfo[infos.field_name + "." + key] = fieldInfo[key];
				delete fieldInfo[key];
			})
		}
		this.index = 0;
		this.fields = (infos.fields) ? infos.fields : [];	// [{fieldAInfo}{fieldBInfo}...]
		for(var i = 0; i < this.fields.length; i++){
			this.fields[i].field_name = this.field_name + "." + this.fields[i].field_name;
		}
		this.childsType = [];	// [{field_name(fieldAInfo): typeA, {field_name(fieldBInfo): typeB}, ...}]
		this.element = this.createElement();
	}
	verify(){
		var result = true;
		this.childsType.forEach(function(childType){
			Object.keys(childType).forEach(function(key){
				result = result && childType[key].verify();
			})
		})
		return result;
	}
	getValue(){
		var result = [];
		var thisObj = this;
		this.childsType.forEach(function(childType){
			result.push(thisObj.getValueChildType(childType))
		})
		return result;
	}
	createElement() {
		var thisObj = this;
		var helper = (this.helper) ? '<div class="helper">'+this.helper+'</div>' : "";
		var valueHtml = (this.value) ? this.value : "";
		var element = $('<div class="repeat '+this.class+'"></div>');
		var repeatContainer = $('<div class="repeat-container"><label>'+this.name+'</label>'+helper+'</div>');
		var repeatChildList = $('<div class="repeat-child-list"></div>');
		var buttonAdd = $('<div class="text-right"><button class="btn btn-success add-child"><i class="fa fa-plus" aria-hidden="true"></i></button></div>');

		for(var i = 0; i < this.min; i++){
			var childType = this.createChildsType();
			this.childsType.push(childType);
			var childElement = this.createElementChild(childType);
			repeatChildList.append(childElement);
		}

		for(var i = this.min; i < this.value.length; i++){
			var childType = this.createChildsType();
			this.childsType.push(childType);
			var childElement = this.createElementChild(childType);
			repeatChildList.append(childElement);
		}
		repeatContainer.append(repeatChildList);
		repeatContainer.append(buttonAdd);
		element.html(repeatContainer);

		// Sụ kiện thêm
		buttonAdd.find(".add-child").click(function(event) {
			if (thisObj.childsType.length >= thisObj.max && thisObj.max != -1) return;
			var childType = thisObj.createChildsType();
			thisObj.childsType.push(childType);
			var childElement = thisObj.createElementChild(childType);
			repeatChildList.append(childElement);
		});
		return element;
	}
	getElement(){
		return this.element;
	}

	getValueChildType(childType){
		var results = {};
		Object.keys(childType).forEach(function (key){
			results[key] = childType[key].getValue();
		})
		var field_name = this.field_name;
		Object.keys(results).forEach(function(key){
			if (key.startsWith(field_name+".")){
				var newKey = key.slice(field_name.length+1);
				var index = newKey.lastIndexOf(".");
				if (index != -1)
					newKey = newKey.slice(0, index);
				results[newKey] = results[key];
				delete results[key];
			}
		});
		return results;
	}
	createElementChild(childType){
		var thisObj = this;
		var element = $("<div class='repeat-child'></div>")
		Object.keys(childType).forEach(function(key){
			element.append(childType[key].getElement());
		})
		var button = $('<button class="btn btn-danger remove-child"><i class="fa fa-times" aria-hidden="true"></i></button>');
		element.append($('<div class="text-right"></div>').append(button));
		button.click(function(event) {
			if (thisObj.childsType.length <= thisObj.min) return;
			element.remove();
			var index = thisObj.childsType.indexOf(childType);
			if (index < 0) return;
			thisObj.childsType.splice(index, 1);
		});
		return element;
	}
	createChildsType(){
		var index = this.index ++;
		var childType = {};
		var value = (this.value.length <= index || index < 0) ? {} : this.value[index];
		this.fields.forEach(function(field){
			field = Object.assign({}, field);	// clone object
			if (value[field.field_name])
				field.value = value[field.field_name];
			field.field_name = field.field_name + "."+index;
			var type = TypeManager.createType(field.type, field);
			childType[field.field_name] = type;
		});
		return childType;
	}
}
// Type group
class TypeGroup extends IType {
	constructor(infos){	
		super(infos);
		this.field_name = infos.field_name;
		this.name = infos.name;
		this.min = (infos.min) ? infos.min : 0;
		this.max = (infos.max) ? infos.max : -1;
		this.value = (infos.value) ? infos.value : {};	// { field_name(fieldAInfo): value, field_name(fieldBInfo): value, ... }
		var fieldInfo = this.value;
		Object.keys(fieldInfo).forEach(function(key){
			fieldInfo[infos.field_name + "." + key] = fieldInfo[key];
			delete fieldInfo[key];
		})
		this.fields = (infos.fields) ? infos.fields : [];	// [{fieldAInfo}{fieldBInfo}...]
		for(var i = 0; i < this.fields.length; i++){
			this.fields[i].field_name = this.field_name + "." + this.fields[i].field_name;
		}
		this.childType = {};	// [{field_name(fieldAInfo): typeA, {field_name(fieldBInfo): typeB}, ...}]
		this.element = this.createElement();
	}
	verify(){
		var result = true;
		var childType = this.childType;
		Object.keys(childType).forEach(function(key){
			result = result && childType[key].verify();
		})
		return result;
	}
	getValue(){
		var results = {};
		var childType = this.childType;
		Object.keys(childType).forEach(function (key){
			results[key] = childType[key].getValue();
		})
		var field_name = this.field_name;
		Object.keys(results).forEach(function(key){
			if (key.startsWith(field_name+".")){
				var newKey = key.slice(field_name.length+1);
				results[newKey] = results[key];
				delete results[key];
			}
		});
		return results;
	}
	createElement() {
		var thisObj = this;
		var valueHtml = (this.value) ? this.value : "";
		var element = $('<div class="form-group group '+this.class+'"><label>'+this.name+'</label></div>');
		var grouptChildList = $('<div class="group-child-list"></div>');

		var childType = {};
		var value = this.value
		this.fields.forEach(function(field){
			field = Object.assign({}, field);	// clone object
			if (value[field.field_name])
				field.value = value[field.field_name];
			var type = TypeManager.createType(field.type, field);
			childType[field.field_name] = type;
		});
		this.childType = childType;
		var childElement = this.createElementChild(childType);
		var childElement = this.createElementChild(childType);
		grouptChildList.append(childElement);
		element.append(grouptChildList);
		return element;
	}
	getElement(){
		return this.element;
	}
	createElementChild(childType){
		var thisObj = this;
		var element = $("<div class='group-child'></div>")
		Object.keys(childType).forEach(function(key){
			element.append(childType[key].getElement());
		})
		return element;
	}
}


var TypeManager = {
	listInputs: {},
	listType: {
		"default": TypeDefault,
		"text": TypeText,
		'checkbox': TypeCheckbox,
		"select": TypeSelect,
		"radio": TypeRadio,
		"textarea": TypeTextarea,
		"editor": TypeEditor,
		"repeat" : TypeRepeat,
		"group": TypeGroup
	},
	createType: function(type, infos){
		var Type = this.listType[type];
		if (!Type) Type = this.listType['default'];
		this.listInputs[infos.field_name] = new Type(infos);
		var listInputs = this.listInputs;
		Object.keys(listInputs).forEach(function(key){
			if (listInputs[key] && listInputs[key].checkConditions)
				listInputs[key].checkConditions();
		})
		return this.listInputs[infos.field_name];
	}
}