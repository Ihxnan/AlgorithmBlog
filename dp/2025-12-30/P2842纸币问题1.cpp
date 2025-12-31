// https://www.luogu.com.cn/problem/P2842
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, w;
    cin >> n >> w;
    vi arr(n);
    cin >> arr;
    sort(all(arr));

    vi dp(w + 1, iINF); // dp[i] 表示凑够 i 价值的最少纸币数
    dp[0] = 0; // 0 价值的最少纸币数为 0

    // 状态转移方程：
    // dp[i] = min{dp[i - arr[j]] + 1} (0 <= j < n, arr[j] <= i)
    for (int i = 1; i <= w; ++i)
        for (int j = 0; j < n && i >= arr[j]; ++j)
            dp[i] = min(dp[i], dp[i - arr[j]] + 1);
    cout << dp[w];
}
