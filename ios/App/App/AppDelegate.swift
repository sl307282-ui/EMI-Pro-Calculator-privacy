import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        if #available(iOS 16.4, *) {
            var searchCount = 0
            Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { timer in
                searchCount += 1
                if searchCount > 20 {
                    timer.invalidate()
                    return
                }
                
                // Find the active key window and inspect its views
                let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
                var vc = keyWindow?.rootViewController
                
                while vc != nil {
                    if let bridgeVC = vc as? CAPBridgeViewController {
                        if let webView = bridgeVC.bridge?.webView {
                            webView.isInspectable = true
                            print("[EMI Pro Native] WebView Inspectability successfully locked!")
                            timer.invalidate()
                            break
                        }
                    }
                    if let nav = vc as? UINavigationController {
                        vc = nav.visibleViewController
                    } else if let tab = vc as? UITabBarController {
                        vc = tab.selectedViewController
                    } else if let presented = vc?.presentedViewController {
                        vc = presented
                    } else {
                        if let firstChild = vc?.children.first {
                            vc = firstChild
                        } else {
                            break
                        }
                    }
                }
            }
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
