const CHAR_DOT = '.';
const CHAR_ARY = '[';

const getV = function(o, k) {
    if(k[0] === CHAR_ARY) {
        return o[parseInt(k.substring(1, k.length - 1))];
    } else {
        return o[k.trim()];
    }
};

const setV = function(o, k, v) {
    if(k[0] === CHAR_ARY) {
        o[parseInt(k.substring(1, k.length - 1))] = v;
    } else {
        o[k.trim()] = v;
    }
};

const getKeys = function(key) {
    let ary = [], k = '';
    for(let i = 0; i < key.length; i++) {
        let ch = key[i];
        if(ch === CHAR_DOT || ch === CHAR_ARY) {
            if(k) {
                ary.push(k);
                k = ch === CHAR_ARY ? ch : '';
            } else {
                throw 'illegal key: ' + key;
            }
        } else {
            k += ch;
        }
    }
    if(k) {
        ary.push(k);
    }
    return ary;
};

const getObj = function(o, aryKeys) {
    for(let i = 0; i < aryKeys.length - 1; i++) {
        o = getV(o, aryKeys[i]);
        if(o === undefined) {
            throw aryKeys.join('') + ' is undefined';
        }
    }
    return o;
};


if(!Component.__$isServiceComp) {
    const  _Comp = Component;
    Component = function(ops) {
        if(!ops) {
            ops = {};
        }
        let _didUnmount = ops.didUnmount;
        ops.didUnmount = function() {
            if(this.__$svrs && this.__$svrs instanceof Array) {
                this.__$svrs.forEach((T) => {
                    if(T.__removeCmp) {
                        T.__removeCmp(this);
                    }
                });
            }
            if(_didUnmount) {
                _didUnmount.apply(this, arguments);
            }
        };
        return _Comp(ops);
    };
    Component.__$isServiceComp = true;
}


function MiniAppService() {
    if(!MiniAppService.__id) {
        MiniAppService.__id = 1;
    }
    let _id = '_service_' + (MiniAppService.__id++);
    this.__defineGetter__('$id', function() {
        return _id;
    });
    this.__defineSetter__('$id', function() {
        throw '$id is readonly';
    });
    const app = getApp();
    if(!app._$datas) {
        app._$datas = {};
    }
    let _data = app._$datas[_id];
    if(!_data) {
        _data = app._$datas[_id] = {};
    }
    this.__defineGetter__('$data', function() {
        return _data;
    });
    this.__defineSetter__('$data', function() {
        throw '$data is readonly';
    });

    let _cmps = [];
    this.__defineGetter__('$cmps', function() {
        return _cmps;
    });
    this.__defineSetter__('$cmps', function() {
        throw '$cmps is readonly';
    });

    this.__defineGetter__('__removeCmp', function() {
        return function(cmp) {
            let idx = _cmps.indexOf(cmp);
            if(idx >= 0) {
                _cmps.splice(idx, 1);
            }
            return this;
        };
    });
    this.__defineSetter__('__removeCmp', function() {
        throw '__removeCmp is readonly';
    });

    return this;
}


MiniAppService.init = function(cmp) {
    if(!cmp) {
        throw 'cmp is undefined';
    }
    if(!cmp.setData) {
        throw 'cmp is not a Page or Component';
    }
    if(!this.Name) {
        throw 'service class missed "Name" property';
    }
    const app = getApp();
    if(!app.__$instances) {
        app.__$instances = {};
    }
    this.$instance = app.__$instances[this.Name];
    if(!this.$instance) {
        this.$instance = app.__$instances[this.Name] = new this();
    }
    if(this.$instance.$cmps.indexOf(cmp) < 0) {
        if(cmp.$page) {
            if(!cmp.__$svrs) {
                cmp.__$svrs = [];
            }
            cmp.__$svrs.push(this.$instance);
        } else {
            let _onunload = cmp.onUnload;
            cmp.onUnload = () => {
                this.$instance.__removeCmp(cmp);
                if(_onunload) {
                    _onunload.apply(cmp, []);
                }
            };
        }
        this.$instance.$cmps.push(cmp);
        cmp.setData({[this.Name]: this.$instance.$data});
        cmp[this.$instance.$id] = this.Name;
    }

    return this.$instance;
};


MiniAppService.prototype.$apply = function() {
    let k = arguments[0],
        v = undefined,
        filter = undefined;
    if(k instanceof Function) {
        filter = k;
        k = undefined;
    } else if (k instanceof Object) {
        filter = arguments[1];
        Object.keys(k).forEach((K) => {
            k[this.constructor.Name + '.' + K] = k[K];
            delete k[K];
        });
    } else if(k !== undefined) {
        v = arguments[1];
        filter = arguments[2];
        k = {
            [this.constructor.Name + '.' + k]: v
        };
    }
    if(!filter || filter instanceof Function) {
        if(this.$cmps) {
            if(!k) {
                k = {[this.constructor.Name]: this.$data};
            }
            this.$cmps.forEach((T) => {
                if(!filter || filter(T)) {
                    T.setData(k);
                }
            });
        }
    }
};


MiniAppService.prototype.$set = function() {
    let key = arguments[0],
        filter = undefined,
        useApply = !!!arguments[3];
    if(key instanceof Object) {
        filter = arguments[1];
        Object.keys(key).forEach((T) => {
            this.$set(T, key[T], filter, true);
        });
        this.$apply(key, filter);
    } else {
        let val = arguments[1];
        filter = arguments[2];
        key += '';
        let ary = getKeys(key);
        let o = getObj(this.$data, ary);
        setV(o, ary[ary.length - 1], val);
        if(useApply) {
            this.$apply(key, val, filter);
        }
    }
};

MiniAppService.prototype.$splice = function(key, val, filter) {
    key += '';
    let ary = getKeys(key);
    let o = getObj(this.$data, ary);
    let list = o[ary[ary.length - 1]];
    if(list instanceof Array) {
        if(val instanceof Array) {
            Array.prototype.splice.apply(list, val);
            if(!filter || filter instanceof Function) {
                if(this.$cmps) {
                    let v = {
                        [this.constructor.Name + '.' + key]: val
                    };
                    this.$cmps.forEach((T) => {
                        if(!filter || filter(T)) {
                            T.$spliceData(v);
                        }
                    });
                }
            }
        } else {
            throw 'val is not array';
        }
    } else {
        throw key + ' is not array';
    }
};

MiniAppService.prototype.$get = function(key) {
    return this.$data[key];
};

export default MiniAppService;