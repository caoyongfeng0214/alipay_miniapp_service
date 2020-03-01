# alipay_miniapp_service

最近在写个支付宝小程序。初步了解了一下，并没有发现有什么好用的状态管理库。于是便写了这个包。它的作用是让数据、业务、视图都专心做自己的事情，并实现业务与数据在多页面之间的共享。

写这个东东有一定的难度，关键是支付宝小程序的很多API并没有对外开放，并且其状态管理机制并不像angular、React那么灵活，或许官方是为了性能的考虑。

写得比较匆忙，需优化的地方还很多。除了工作之外，本人对支付宝小程序并没有啥兴趣，有兴趣的童鞋可将这个项目拿去维护。

# 安装
```
npm install alipay-miniapp-service
```

# 示例
```js
import MiniAppService from "alipay-miniapp-service";

class Users extends MiniAppService {
    constructor() {
        super();
    }

    gets() {
        if(!this.$get('list')) {
            this.$set('list', [
                { id: 1, name: 'CYF' },
                { id: 2, name: '张学友' },
                { id: 3, text: '刘备' },
            ]);
        }
    }

    get(id) {
        let list = this.$get('list');
        if(list) {
            return list.find((T) => T.id == id);
        }
    }

    add(id, name) {
        let list = this.$get('list');
        list.push({
            id: id,
            name: name
        });
        return this;
    }

    edit(id, newName) {
        let list = this.$get('list');
        let item = list.find((T) => {
            return T.id == id;
        });
        if(item) {
            item.name = newName;
        }
        return this;
    }
}

export default Users;
```
