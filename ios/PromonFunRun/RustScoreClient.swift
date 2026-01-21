import Foundation

enum RustScoreClient {
    static func postScore(payload: [String: Any]) {
        // TODO: Replace with Rust static library call.
        // Placeholder behavior: log to console.
        print("postScore payload: \(payload)")
    }

    static func listScores(completion: @escaping (String) -> Void) {
        // TODO: Replace with Rust static library call.
        // Return a JSON array string for JS to consume.
        let placeholder = "[]"
        completion(placeholder)
    }
}
