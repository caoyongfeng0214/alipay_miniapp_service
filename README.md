[建立这个项目的初衷，点击这里。](https://github.com/caoyongfeng0214/alipay_miniapp_service/wiki/%E6%96%87%E6%A1%A3%EF%BC%88v0.0.X%EF%BC%89)


+ 业务逻辑是不应该与视图混在一起的，这样的代码是不便于维护的，这是一个基本的常识。
+ 试想这样一个应用场景：在一个电商应用中，购物车可能存在于多个“页面”中，当用户在某个“页面”中改变了购物车的状态（比如新添了一件商品到购物车中），那么其它所有“页面”中的购物车都应该同时更新状态，包括“返回”到的“上一个页面”。你当然可以在“上一个页面”被显示时重新加载数据，但这与SPA的惯常操作是相违背的，当然同时也增加了服务器的负担。


---


# 早期版本文档

[v0.0.X文档](https://github.com/caoyongfeng0214/alipay_miniapp_service/wiki/%E6%96%87%E6%A1%A3%EF%BC%88v0.0.X%EF%BC%89)


**注意：当前版本与早期版本（0.0.X）是不兼容的**


---


# v0.1.XX

在早期的版本中，我试图让状态的管理更简单化，就像在 React 和 Angular 中那么方便。

但后来我发现，这样做存在性能的巨坑。开发者使用早期的版本时，若想写出良好性能的代码，是需要耗费较多脑细胞的。

因此在 v0.1.xx 版本中，我牺牲了一定的便利性，规避了前期版本中存在的主要问题。


# 安装
```
npm install alipay-miniapp-service
```


# 使用

1. 在项目的 `app.js` 中集成 `alipay-miniapp-service`：
    ```js
    import MiniAppService from "alipay-miniapp-service";
    
    App({
      // 将 MiniAppService 作为全局变量保存在 app.js，以便于在其它文件中使用。
      Service: MiniAppService,

      // Other ...
    });
    ```
    
1. 定义 Service，每个 Service 都应该继承自 `MiniAppService`：
    
    `/services/Users.js`
    ```js
    class Users extends getApp().Service {
      constructor() {
          super();
      }

      // 注意：需为每个Service指定一个Name，在所有的Service中它应该是唯一的。
      static get Name() {
          return 'Users';
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
    }

    export default Users;
    ```
    实例方法 `$get(key)`、`$set(key, val)` 用来从 Service 中获取、保存数据。
    
1. 在“页面”或“自定义组件”中使用 Service：
    
    `/pages/index/index.js`
    ```js
    import Users from '/services/Users';

    Page({
        data: {},
        onLoad() {
            this.users = Users.init(this);
            this.users.gets();
        },
        // Other ....
    });
    ```
    在“页面”的 `onLoad()` 中调用 Service 的 `init(cmp)` 方法初始化一个 Service 的实例，该方法返回此 Service 的实例。
    
    若是在“自定义组件”中，则应在 `didMount()` 中调用 `init(cmp)` 方法。
    
    `init(cmp)` 方法接受一个参数，即当前“页面”或“自定义组件”自身。
    
1. 在 AXML 中绑定数据：
    
    `/pages/index/index.axml`
    ```xml
    <view a:for="{{Users.list}}">
      <navigator url="../edit/edit?id={{item.id}}">{{item.name}}</navigator>
    </view>
    ```
    这里的 `Users` 即是在 Service 中定义的 `Name`。
    
    在 Service 中使用 `$set()` 方法存储的数据，在 AXML 中都需要使用该 Service 的 `Name` 来访问。
    
1. Service 中数据的改变：

    给上面的 `Users` Service 添加一个 `edit(id, newName)` 方法：
    
    `/services/Users.js`
    ```js
    class Users extends getApp().Service {
      // ....

      edit(id, newName) {
          let list = this.$get('list');
          let user = list.find((T) => {
            return T.id == id;
          });
          if(user) {
            user.name = newName;
            this.$apply();
          }
      }
    }

    export default Users;
    ```
    **注意：** 直接修改了 Service 中的数据后，并不会马上应用到视图中，需调用该 Service 的 `$apply()` 方法使其生效。
    
    也可使用 Service 的 `$set(key, val)` 方法修改数据。在大多数情况下，这样做的性能会更好一些。因此，上面的 `edit(id, newName)` 方法可修改为：
    
    `/services/Users.js`
    ```js
    class Users extends getApp().Service {
      // ....

      edit(id, newName) {
          let list = this.$get('list');
          let idx = list.findIndex((T) => {
            return T.id == id;
          });
          if(idx >= 0) {
            this.$set(`list[${idx}].name`, newName);
          }
      }
    }

    export default Users;
    ```
    `$set(key, val)` 方法的 `key` 与[“页面”中的 `setData()`](https://opendocs.alipay.com/mini/framework/page-detail#Page.prototype.setData(data%3A%20Object%2C%20callback%3A%20Function))的 `key` 的规则是一样的。
    
    上例中的 ``this.$set(`list[${idx}].name` , newName);`` 也可改写为：
    ```js
    this.$set({
      [`list[${idx}].name`]: newName
    });
    ```
    这两种写法是等效的。
    
    如果希望数据的更改仅应用于一个或某几个“页面”（或组件）中， 则可加入过滤器。例如：将数据的修改仅应用于 `selfName` 属性的值为 `Default` 的“页面”（或组件）：
    ```js
    this.$set(`list[${idx}].name`, newName, (T) => {
      return T.selfName == 'Default';
    });
    ```
    或者也可以这样写：
    ```js
    this.$set({
      [`list[${idx}].name`]: newName
    }, (T) => {
      return T.selfName == 'Default';
    });
    ```
    当然，还需要给相应的“页面”或组件加入这个属性：
    
    `/pages/index/index.js`
    ```js
    import Users from '/services/Users';

    Page({
        data: {},
        onLoad() {
            this.selfName = 'Default';
            // ....
        },
        // ....
    });
    ```
    
1. Service 中的数组：

    可使用 Service 的 `$splice()` 方法对数组进行操作，它与[“页面”中的 `$spliceData()`](https://opendocs.alipay.com/mini/framework/page-detail#Page.prototype.%24spliceData(data%3A%20Object%2C%20callback%3A%20Function))的用法是类似的。

    来个示例，为上面示例中的 `Users` Service 添加一个 `del(id)` 方法：

    `/services/Users.js`
    ```js
    class Users extends getApp().Service {
      // ....

      del(id) {
          let list = this.$get('list');
          let idx = list.findIndex((T) => {
            return T.id == id;
          });
          if(idx >= 0) {
            this.$splice('list', [idx, 1]);
          }
      }
    }

    export default Users;
    ```
    当然，也可为 `$splice()` 使用过滤器：
    
    `/services/Users.js`
    ```js
    class Users extends getApp().Service {
      // ....

      del(id) {
          let list = this.$get('list');
          let idx = list.findIndex((T) => {
            return T.id == id;
          });
          if(idx >= 0) {
            this.$splice('list', [idx, 1], (T) => {
              return T.selfName == 'Default';
            });
          }
      }
    }

    export default Users;
    ```
