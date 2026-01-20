// https://www.luogu.com.cn/problem/P3842
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    vector<pii> arr(n + 1);
    for (int i = 1; i <= n; ++i)
        cin >> arr[i];

    vector<pii> dp(n + 1);
    dp[1].first = 2 * arr[1].second + arr[1].first - 1;
    dp[1].second = arr[1].second - 1;
    for (int i = 2; i <= n; ++i)
    {
        dp[i].first = min(dp[i - 1].first + abs(arr[i].second - arr[i - 1].first),
                          dp[i - 1].second + abs(arr[i].second - arr[i - 1].second)) +
                      arr[i].second - arr[i].first + 1;
        dp[i].second = min(dp[i - 1].first + abs(arr[i].first - arr[i - 1].first),
                           dp[i - 1].second + abs(arr[i].first - arr[i - 1].second)) +
                       arr[i].second - arr[i].first + 1;
    }
    cout << min(dp[n].first + n - arr[n].first, dp[n].second + n - arr[n].second);
}
