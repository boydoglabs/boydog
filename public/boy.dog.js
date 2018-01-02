//boy.dog v1.0.0
var bd = function(port) {
  console.log("boyDog connect", port)
  
  jQuery.fn.htmlClean = function() {
    //Clean whitespaces
    this.contents().filter(function() {
      if (this.nodeType != 3) {
        $(this).htmlClean();
        return false;
      } else {
        this.textContent = $.trim(this.textContent);
        return !/\S/.test(this.nodeValue);
      }
    }).remove();
    
    //Normalize attribute paths (i.e.: address.gps.lat = address['gps']['lat'])
    function normalizePaths(attrName) {
      $('[' + attrName + ']').each(function(i, el) {
        var attr = $(el).attr(attrName);

        var attr = _.toPath(attr);
      
        if (attr.length > 1) {
          attr = attr.shift() + "['" + attr.join("']['") + "']";
        } else {
          attr = attr.shift();
        }
        
        $(el).attr(attrName, attr);
      });
    };
    
    normalizePaths('dog-val');
    normalizePaths('dog-run');
    //TODO: Add all normalizations
    
    return this;
  }
  $('html').htmlClean(); //Clean html for whitespaces and line-breaks
  
  var socket = io.connect('http://localhost:' + port);
  
  var dogLogic = {};
  
  //Socket functions
  socket.on('connect', function(data) {
    console.log("socket on connect");
  });

  function rebindDog(element) {
    if (!element) element = 'html';
    
    $(element).find('[dog-val]').each(function(i, el) {
      var attr = $(el).attr('dog-val');
      
      socket.emit('boy-val', { attr: attr, get: true });
      
      //Functions for updating values
      $(el).off().keyup(function(field) {
        var val = field.currentTarget.value;
        
        socket.emit('boy-val', { attr: attr, set: val });
        
        /*//TODO: Implement fallback POST and GET version
        $.post("/get", {}).done(function(json) { });
        $.post("/set", {}).done(function(json) { });*/
      });
    });
  }

  rebindDog();

  $('[dog-run]').each(function(i, el) {
    var path = $(el).attr('dog-run');
    
    $(el).off().on('click', function() {
      socket.emit('boy-run', { path: path });
    });
  });

  //To set a value
  socket.on('dog-val', function(data) {
    var elem = $('[dog-val="' + data.attr + '"]');
    
    elem.each(function(k, el) {
      el = $(el);
      
      var options = $(el).attr('dog-options') || "";
      var msg = data.val;
      
      if (options.indexOf("stringify") >= 0) msg = JSON.stringify(msg);
      if (options.indexOf("length") >= 0) {
        console.log("msg", msg, el, data)
        
        msg = +msg.length;
      }
      if (options.indexOf("walk") >= 0) {
        msg = +msg.length;
        
        if (msg == $(el).attr('dog-lastwalk')) return; //If this element has not changed since the last walk, then don't walk again
        
        var upto = msg;
        var parent = $(el).parent();

        for (i = 0; i < upto; i++) {
          var existingKey = parent.find('[dog-walk-key="' + i + '"]').length;
          
          if (existingKey) continue;
          
          var newEl = $(el).clone();
          newEl.removeAttr('dog-val').removeAttr('dog-options').show();
          newEl.attr('dog-walk-key', i);
          
          $(newEl).html($(newEl).html().replace(/@@@/g, i));
          
          /*//TODO: Implement append/prepend
          if (options.indexOf("reverse") >= 0) {
            parent.prepend(newEl);
          } else {
            parent.append(newEl);
          }*/
          
          parent.append(newEl);
        }
        
        $(el).hide();
        $(el).attr('dog-lastwalk', msg);
        rebindDog(parent);
      }
      
      el.val(msg);
    })
  });
  
  
  return {
    dogLogic: dogLogic
  };
}