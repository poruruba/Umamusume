var hashs = {};
var searchs = {};

function proc_load() {
  hashs = parse_url_vars(location.hash);
  searchs = parse_url_vars(location.search);
}

function parse_url_vars(param){
    var searchParams = new URLSearchParams(param);
    var vars = {};
    for (let p of searchParams)
        vars[p[0]] = p[1];

    return vars;
}

function vue_add_methods(options, funcs){
    for(var func in funcs){
        options.methods[func] = funcs[func];
    }
}
function vue_add_computed(options, funcs){
    for(var func in funcs){
        options.computed[func] = funcs[func];
    }
}
function vue_add_components(options, components){
    if( !options.components )
        options.components = {};
    for( var component in components){
        options.components[component] = components[component];
    }
}

function datgui_add(property, p1, p2, p3){
    var ctrl = datgui.add(vue, property, p1, p2, p3);
    vue.$watch(property, (v) => ctrl.setValue(v) );
}

function datgui_addColor(property){
    var ctrl = datgui.addColor(vue, property);
    vue.$watch(property, (v) => ctrl.setValue(v) );
}
