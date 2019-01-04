# staruml-starumlObjc
Objective-C Code Generator Extension for StarUML 2.8.0 ( not supported in StarUML 3 )

============================

This extension for StarUML(http://staruml.io) support to generate Objective-C code from UML model. Install this extension from Extension Manager of StarUML.

## eg. Gen Class
```Objective-C
/**
 * Project HTPlatform
 * @file HHSurfaceComponent.h
 */

#import <Foundation/Foundation.h>

@HHLabel;
@HHImageView;
@HHButton;


/**
 * @brief  SDK界面管理
 * 
 * @author: uml 
 * 
 * @date: 2019-1-4
 */

@interface HHSurfaceComponent: NSObject
/**
 * @brief  标题
 */
@property (nonatomic, strong) HHLabel* title;
/**
 * @brief  Logo
 */
@property (nonatomic, strong) HHImageView* logo;
/**
 * @brief  SDK底部背景
 */
@property (nonatomic, strong) HHImageView* footer;
/**
 * @brief  Login
 */
@property (nonatomic, strong) HHButton* Login;

/**
 * @brief 展示界面，遍历所有标签，重新排列一次
 */
- (void)layout;

/**
 * @brief 输出布局信息
 */
- (void)layoutLog;

/**
 * @brief  UI组件
 * @param components
 */
- (void)initWithComponents:(NSDictionary *)components;

/**
 * @brief dissmiss
 */
- (void)dissmiss;

@end

```

## eg. Gen Enum

```Objective-C
/**
 * Project HTPlatform
 * @file HHTextFieldType.h
 */

#import <Foundation/Foundation.h>

/**
@brief 输入框类型

 - account: 账号输入框
 - register: 注册输入框
 - cellphone: 手机号码输入框
 - password: 密码输入框
 - code: 验证码输入框
 - custom: 
 */
typedef NS_ENUM(NSUInteger, HHTextFieldType) {
	HHTextFieldTypeAccount,
	HHTextFieldTypeRegister,
	HHTextFieldTypeCellphone,
	HHTextFieldTypePassword,
	HHTextFieldTypeCode,
	HHTextFieldTypeCustom,
};
```
