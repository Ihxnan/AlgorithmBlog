// https://www.luogu.com.cn/problem/P2834
#include "../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, w;
    cin >> n >> w;
    vi arr(n + 1);
    for (int i = 1; i <= n; ++i)
        cin >> arr[i];

    vvi dp(n + 1, vi(w + 1)); // dp[i][j]: 前i个纸币凑出总价值为j的方案数
    dp[0][0] = 1;             // 0个纸币凑出总价值为0的方案数为1

    // 状态转移方程:
    // dp[i][j] = dp[i - 1][j] + dp[i][j - arr[i]] (arr[i] <= j)
    for (int i = 1; i <= n; ++i)
        for (int j = 0; j <= w; ++j)
        {
            dp[i][j] = dp[i - 1][j];
            if (j >= arr[i])
                dp[i][j] = (dp[i][j - arr[i]] + dp[i][j]) % MOD;
        }

    cout << dp[n][w] << endl;
}
