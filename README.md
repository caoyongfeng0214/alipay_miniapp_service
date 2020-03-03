# alipay_miniapp_service

最近在写个支付宝小程序。初步了解了一下，并没有发现有什么好用的状态管理库。于是便写了这个包。它的作用是让数据、业务、视图都专心做自己的事情，并实现业务与数据在多页面之间的共享。

写这个东东有一定的难度，关键是支付宝小程序的很多API并没有对外开放，并且其状态管理机制并不像angular、React那么灵活，或许官方是为了性能的考虑。

写得比较匆忙，需优化的地方还很多。除了工作之外，本人对支付宝小程序并没有啥兴趣，有兴趣的童鞋可将这个项目拿去维护。

# 安装
```
npm install alipay-miniapp-service
```

# 示例

`/service/users.js`
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
                { id: 3, name: '刘备' },
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

`/pages/index/index.js`
```js
import Users from '/services/users';

Page({
  data: {},
  onLoad() {
    this.users = Users.init('users', this);
  },
  onShow() {
    this.users.gets();
  }
});
```

`/pages/index/index.axml`
```xml
<view>
    <navigator a:for="{{users.list}}" url="../edit/edit?id={{item.id}}">{{item.name}}</navigator>
</view>
```


# 说明

**alipay-miniapp-service** 提供了一个静态方法：`init(name, cmp)` 。它用来初始化Service实例，并将当前页面实例或组件实例与Service实例绑定。在整个应用程序中，无论调多少次 `init(name, cmp)` 方法，同一个Service只会被实例化一次。它的第一个参数 `name` 是你想给这个Service实例起的名字，你可在视图中用这个名字来访问存储的数据，上例中， `/pages/index/index.axml` 中的 `{{users.list}}` 中的 `users` 即是这个名字。第二个参数 `cmp` 是当前的页面或组件。

目前 **alipay-miniapp-service** 主要提供了两个对外的实例方法：`$set(key, data)`、`$get(key)` 。

`$set(key, data)` 用来存储数据。第一个参数 `key` 是你为该参数设置的键值，以方便访问。第二个参数 `data` 为需要存储的数据。它与支付宝小程序原生的 `this.setData(key, data)` 的作用类似，但功能更强大。上例中， `/pages/index/index.axml` 中的 `{{users.list}}` 中的 `list` 即是这个key。

`$get(key)` 用来取出用 `$set(key, data)` 存储的数据。

**注意：** 上例中，`/pages/index/index.js` 中的 `this.users` 与 `/pages/index/index.axml` 中的 `users` 不是同一个。`/pages/index/index.js` 中的 `this.users` 是 `/service/users.js` 中定义的 `Users` 对象的实例，而 `/pages/index/index.axml` 中的 `users` 是在 `Users.init('users', this)` 中第一个参数指定的实例的名字。
