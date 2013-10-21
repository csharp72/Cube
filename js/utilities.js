$.deepCopy = function( objectOrArray ){
    var duplicate;
    if( $.isPlainObject( objectOrArray ) ){
        duplicate = {};
    }else if( $.isArray( objectOrArray ) ){
        duplicate = [];
    }
    
    copy( objectOrArray, duplicate );
    
    function copy( obj, into ){
        $.each(obj, function(key, val){
            if( $.isPlainObject( val ) ){
                into[key] = {};
                copy( val, into[key] );
            }else if( $.isArray( val ) ){
                into[key] = [];
                copy( val, into[key] );
            }else{
                into[key] = val;
            }
        });
    }
    
    return duplicate;
};

$.deepCompare = function( a, b ){
    //compare the equivalency of two objects or arrays

    var equivalent = true;
    compare(a,b);
    compare(b,a);

    function compare(a,b){
        if( !b ){ // b doesn't exist
            return equivalent = false;
        }
        $.each(a, function(key, aVal){
            var bVal = b[key];
            if( typeof bVal == 'undefined' ){
                return equivalent = false;
            }else if( typeof aVal == 'function' ){
                return equivalent = aVal.toString().replace(/\s/g,'') == bVal.toString().replace(/\s/g,'');
            }else if( $.isPlainObject( aVal ) || $.isArray( aVal ) ){
                return compare( aVal, bVal );
            }else if( aVal != bVal ){
                return equivalent = false; //break out of this each loop
            }
        });
        return equivalent; //break out of subsequent each loops
    }
    return equivalent;
}