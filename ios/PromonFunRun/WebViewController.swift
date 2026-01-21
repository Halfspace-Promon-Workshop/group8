import UIKit
import WebKit

final class WebViewController: UIViewController, WKScriptMessageHandler {
    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupWebView()
        loadLocalContent()
    }

    private func setupWebView() {
        let contentController = WKUserContentController()
        contentController.add(self, name: "postScore")
        contentController.add(self, name: "listScores")

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.isScrollEnabled = false

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func loadLocalContent() {
        guard let htmlURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") else {
            return
        }
        webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "postScore":
            if let payload = message.body as? [String: Any] {
                RustScoreClient.postScore(payload: payload)
            }
        case "listScores":
            RustScoreClient.listScores { scoresJson in
                let script = "window.onScoresRetrieved(\(scoresJson));"
                DispatchQueue.main.async { [weak self] in
                    self?.webView.evaluateJavaScript(script, completionHandler: nil)
                }
            }
        default:
            break
        }
    }
}
