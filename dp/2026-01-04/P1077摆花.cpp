// https://www.luogu.com.cn/problem/P1077
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int mod = 1e6 + 7;
    int n, m;
    cin >> n >> m;
    vi arr(n + 1);
    for (int i = 1; i <= n; ++i)
        cin >> arr[i];

    vvi dp(n + 1, vi(m + 1)); // dp[i][j] 表示前n种花放j盆的方案数
    dp[0][0] = 1;             // 空盆的方案数为1

    // 状态转移方程:
    // dp[i][j] = sum(dp[i - 1][j - k])  (0 <= k <= min(j, arr[i]))
    for (int i = 1; i <= n; ++i)
        for (int j = 0; j <= m; ++j)
            for (int k = 0; k <= min(j, arr[i]); ++k)
                dp[i][j] = (dp[i][j] + dp[i - 1][j - k]) % mod;

    cout << dp[n][m];
}
