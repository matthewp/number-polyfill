(function numPolyfill(loaded) {
  if(!loaded) {
    window.addEventListener('load', function onLoad() {
      window.removeEventListener('load', onLoad);

      numPolyfill(true);
    }, false);

    return;
  }

  var inputElem = document.createElement('input');
  inputElem.setAttribute('type', 'number');
  if(inputElem.type === 'number') {
    return;
  }

  var fireEvent = function(elem, evtName) {
    if("fireEvent" in elem) {
      element.fireEvent('on' + evtName);
    }
    else {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent(evtName, false, true);
      elem.dispatchEvent(evt);
    }
  };

  var getParams = function(elem) {
    var step = elem.getAttribute('step');
    step = /^-?\d+(?:\.\d+)?$/.test(step) ? parseFloat(step) : undefined;
    var min = elem.getAttribute('min');
    min = /^-?\d+(?:\.\d+)?$/.test(min) ? parseFloat(min) : undefined;
    var max = elem.getAttribute('max');
    max = /^-?\d+(?:\.\d+)?$/.test(max) ? parseFloat(max) : undefined;

    var val = parseFloat(elem.value);
    if(isNaN(val)) {
      val = min || 0;
    }

    return {
      min: min,
      max: max,
      step: step,
      val: val
    };
  };

  var clipValues = function(value, min, max) {
    if(max !== undefined && value > max) {
      return max;
    } else if(min !== undefined && value < min) {
      return min;
    } else {
      return value;
    }
  };

  var extractNumDecimalDigits = function(input) {
    if(input !== undefined) {
      var num = 0;
      var raisedNum = input;
      while(raisedNum != Math.round(raisedNum)) {
        num += 1;
        raisedNum = input * Math.pow(10, num);
      }
      return num;
    } else {
      return 0;
    }
  }

  var matchStep = function(value, min, max, step) {
    var stepDecimalDigits = extractNumDecimalDigits(step);
    if(step === undefined) {
      return value;
    } else if(stepDecimalDigits == 0) {
      var mod = (value - (min || 0)) % step;
      if(mod == 0) {
        return value;
      } else {
        var stepDown = value - mod;
        var stepUp = stepDown + step;
        if((stepUp > max) || ((value - stepDown) < (stepUp - value))) {
          return stepDown;
        } else {
          return stepUp;
        }
      }
    } else {
      var raiseTo = Math.pow(10, stepDecimalDigits);
      var raisedStep = step * raiseTo;
      var raisedMod = (value - (min || 0)) * raiseTo % raisedStep;
      if(raisedMod == 0) {
        return value;
      } else {
        var raisedValue = (value * raiseTo);
        var raisedStepDown = raisedValue - raisedMod;
        var raisedStepUp = raisedStepDown + raisedStep;
        if(((raisedStepUp / raiseTo) > max) || ((raisedValue - raisedStepDown) < (raisedStepUp - raisedValue))) {
          return (raisedStepDown / raiseTo);
        } else {
          return (raisedStepUp / raiseTo);
        }
      }
    }
  };

  var increment = function(elem) {
    var params = getParams(elem);
    var raiseTo = Math.pow(10, Math.max(extractNumDecimalDigits(params['val']), extractNumDecimalDigits(params['step'])));
    var newVal = (Math.round(params['val'] * raiseTo) + Math.round((params['step'] || 1) * raiseTo)) / raiseTo;

    if(params['max'] !== undefined && newVal > params['max']) newVal = params['max'];
    newVal = matchStep(newVal, params['min'], params['max'], params['step']);

    elem.value = newVal;
    fireEvent(elem, 'change');
  };

  var decrement = function(elem) {
    var params = getParams(elem);
    var raiseTo = Math.pow(10, Math.max(extractNumDecimalDigits(params['val']), extractNumDecimalDigits(params['step'])));
    var newVal = (Math.round(params['val'] * raiseTo) - Math.round((params['step'] || 1) * raiseTo)) / raiseTo;

    if(params['min'] !== undefined && newVal < params['min']) newVal = params['min'];
    newVal = matchStep(newVal, params['min'], params['max'], params['step']);

    elem.value = newVal;
    fireEvent(elem, 'change');
  };

  var allInputs = Array.prototype.slice.call(document.querySelectorAll('input[type="number"]'));
  allInputs.forEach(function(elem) {
    var halfHeight = (elem.outerHeight / 2) + 'px';
    var upBtn = document.createElement('div'),
        addClass = upBtn.classList.add;

    addClass('number-spin-btn');
    addClass('number-spin-btn-up');
    upBtn.style.height = halfHeight;

    var downBtn = document.createElement('div');
    addClass = downBtn.classList.add;

    addClass('number-spin-btn');
    addClass('number-spin-btn-down');
    downBtn.style.height = halfHeight;

    var btnContainer = document.createElement('div');
    addClass = btnContainer.classList.add;

    btnContainer.appendChild(upBtn);
    btnContainer.appendChild(downBtn);
    addClass('number-spin-btn-container');

    btnContainer.parentNode.insertBefore(elem, btnContainer.nextSibling);

    var elemEvents = {
      DOMMouseScroll: function(event) {
        if(event.originalEvent.detail < 0) {
          increment(this);
        } else {
          decrement(this);
        }
        event.preventDefault();
      },
      mousewheel: function(event) {
        if(event.wheelDelta > 0) {
          increment(this);
        } else {
          decrement(this);
        }
        event.preventDefault();
      },
      keypress: function(event) {
        if(event.keyCode == 38) { // up arrow
          increment(this);
        } else if(event.keyCode == 40) { // down arrow
          decrement(this);
        } else if(([8, 9, 35, 36, 37, 39].indexOf(event.keyCode) == -1) &&
		    ([45, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57].indexOf(event.which) == -1)) {
          event.preventDefault();
        }
      },
      change: function(event) {
        if(event.originalEvent === undefined) {
          return;
        }

        var params = getParams(this);

        newVal = clipValues(params['val'], params['min'], params['max']);
        newVal = matchStep(newVal, params['min'], params['max'], params['step'], params['stepDecimal']);

        elem.value = newVal;
      }
    };

    Object.keys(elemEvents).forEach(function(key) {
      var evt = elemEvents[key];

      elem.addEventListener(key, evt, false);
    });

    var upBtnEvents = {
      mousedown: function(event) {
        increment(elem);

        var timeoutFunc = function(elem, incFunc) {
          incFunc(elem);

          elem.timeoutID = window.setTimeout(timeoutFunc, 10, elem, incFunc);
        };

        var releaseFunc = function(event) {
          window.clearTimeout(elem.timeoutID);

          document.removeEventListener('mouseup', releaseFunc);
          upBtn.removeEventListener('mouseleave', releaseFunc);
        };

        document.addEventListener('mouseup', releaseFunc);
        upBtn.addEventListener('mouseleave', releaseFunc);

        elem.timeoutID = window.setTimeout(timeoutFunc, 700, elem, increment);
      }
    };

    Object.keys(upBtnEvents).forEach(function(key) {
      var evt = upBtnEvents[key];

      upBtn.addEventListener(key, evt, false);
    });

    var downBtnEvents = {
      mousedown: function(event) {
        decrement(elem);

        var timeoutFunc = function(elem, decFunc) {
          decFunc(elem);

          elem.timeoutID = window.setTimeout(timeoutFunc, 10, elem, decFunc);
        };

        var releaseFunc = function(event) {
          window.clearTimeout(elem.timeoutID);

          document.removeEventListner('mouseup', releaseFunc);
          downBtn.removeEventListener('mouseleave', releaseFunc);
        };

        document.addEventListener('mouseup', releaseFunc);
        downBtn.addEventListener('mouseleave', releaseFunc);

        elem.timeoutID = window.setTimeout(timeoutFunc, 700, elem, decrement);
      }
    };

    Object.keys(downBtnEvents).forEach(function(key) {
      var evt = downBtnEvents[key];

      downBtn.addEventListener(key, evt, false);
    });

    elem.style.textAlign = 'right';
  });
})();