const _helper_setkey = function(obj, k) {
    if(obj instanceof Object) {
        obj.__$k = k;
        let ks = Object.keys(obj);
        for(let i = 0; i < ks.length; i++) {
            let _k = ks[i];
            let item = obj[_k];
            _helper_setkey(item, k + (obj instanceof Array ? ('[' + _k + ']') : ('.' + _k)));
        }
    }
};

const _helper_getv = function(obj, keys, idx) {
    if(idx < keys.length) {
        let k = keys[idx];
        let v = obj[k];
        if(v) {
            if(idx + 1 < keys.length) {
                return _helper_getv(v, keys, idx + 1);
            }
            return v;
        }
    }
    return undefined;
};

const _helper_getval = function(obj, k) {
    let ary = k.split('.');
    let ks = [];
    ary.forEach((T) => {
        if(T.indexOf('[') >= 0) {
            let ary2 = T.split('[');
            ary2.forEach((M) => {
                ks.push(M.indexOf(']') > 0 ? parseInt(M) : M);
            });
        } else {
            ks.push(T);
        }
    });
    return _helper_getv(obj, ks, 0);
};


function MiniAppService() {
    let _data = {};
    let _dataChange = function(target, property, descriptor) {
        if(target === _data) {
            _helper_setkey(descriptor.value, property);
            _cmps.forEach((T) => {
                T.setData({[T[_id] + '.' + property]: descriptor.value});
            });
        } else {
            if(descriptor && descriptor.value) {
                if(descriptor.value instanceof Object) {
                    let _k = target.__$k;
                    if(descriptor.value instanceof Array) {
                        _k += '[' + property + ']';
                    } else {
                        _k += '.' + property;
                    }
                    _helper_setkey(descriptor.value, _k);
                }
                // let v = _helper_getval(_data, target.__$k);
                // v[property] = descriptor.value;
                // _cmps.forEach((T) => {
                //     T.setData({[T[_id] + '.' + target.__$k]: v});
                // });
                setTimeout(() => {
                    _cmps.forEach((T) => {
                        T.setData({[T[_id] + '.' + target.__$k]: target});
                    });
                }, 0);
            }
        }
    };
    this.__defineGetter__('_$dataChange', function(target, property, descriptor) {
        return _dataChange;
    });
    this.__defineSetter__('_$dataChange', function() {
        throw '_$dataChange is readonly';
    });
    this.__defineSetter__('$cmps', function() {
        throw '$cmps is readonly';
    });
    let _$data = MiniAppService.__watch(_data, _dataChange);
    this.__defineGetter__('$data', function() {
        return _$data;
    });
    this.__defineSetter__('$data', function() {
        throw '$data is readonly';
    });

    let _cmps = [];
    this.__defineGetter__('$cmps', function(target, property, descriptor) {
        return _cmps;
    });
    this.__defineSetter__('$cmps', function() {
        throw '$cmps is readonly';
    });

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
}

MiniAppService.__watch = function(object, onChange) {
    const handler = {
        get(target, property, receiver) {
            if(property === '__isProxy') {
                return true;
            }
            if(property === '__$k' || !target[property] || target[property].__isProxy || target[property] instanceof Function || !(target[property] instanceof Object)) {
                return target[property];
            }
            try {
                return new Proxy(target[property], handler);
            } catch (err) {
                return Reflect.get(target, property, receiver);
            }
        },
        defineProperty(target, property, descriptor) {
            if(property !== '__$k') {
                onChange(target, property, descriptor);
            }
            return Reflect.defineProperty(target, property, descriptor);
        },
        deleteProperty(target, property) {
            if(property !== '__$k') {
                onChange(target, property);
            }
            return Reflect.deleteProperty(target, property);
        }
    };

    return new Proxy(object, handler);
};

MiniAppService.init = function(keyName, cmp) {
    if(!cmp) {
        throw 'cmp is undefined';
    }
    if(!cmp.setData) {
        throw 'cmp is not Page or Component';
    }
    if(!this.$instance) {
        this.$instance = new this();
    }
    if(this.$instance.$cmps.indexOf(cmp) < 0) {
        if(cmp.$page) {
            if(!cmp.$page.__$cmps) {
                cmp.$page.__$cmps = []
            }
            cmp.$page.__$cmps.push(cmp);
            let _onunload = cmp.$page.onUnload;
            cmp.$page.onUnload = () => {
                if(cmp.$page.__$cmps) {
                    cmp.$page.__$cmps.forEach((T) => {
                        let idx = this.$instance.$cmps.indexOf(T);
                        if(idx >= 0) {
                            this.$instance.$cmps.splice(idx, 1);
                        }
                    });
                    delete cmp.$page.__$cmps;
                    if(_onunload) {
                        _onunload.apply(cmp.$page, []);
                    }
                }
            };
        } else {
            let _onunload = cmp.onUnload;
            cmp.onUnload = () => {
                let idx = this.$instance.$cmps.indexOf(cmp);
                if(idx >= 0) {
                    this.$instance.$cmps.splice(idx, 1);
                }
                if(_onunload) {
                    _onunload.apply(cmp, []);
                }
            };
        }
        this.$instance.$cmps.push(cmp);
        cmp.setData({[keyName]: this.$instance.$data});
        cmp[this.$instance.$id] = keyName;
    }

    return this.$instance;
};

MiniAppService.prototype.$set = function(key, val) {
    this.$data[key] = val;
};

MiniAppService.prototype.$get = function(key) {
    return this.$data[key];
};

export default MiniAppService;