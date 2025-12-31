// https://www.luogu.com.cn/problem/P1048
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int t, m;
    cin >> t >> m;
    vi weight(m + 1), value(m + 1);
    for (int i = 1; i <= m; ++i)
        cin >> weight[i] >> value[i];

    vvi dp(m + 1, vi(t + 1)); // dp[i][j]: 前i个物品在时间j内能获得的最大价值

    // 状态转移方程:
    // dp[i][j] = max{ dp[i-1][j], dp[i-1][j-weight[i]] + value[i] } (j >= weight[i])
    for (int i = 1; i <= m; ++i)
        for (int j = 1; j <= t; ++j)
        {
            dp[i][j] = dp[i - 1][j];
            if (j >= weight[i])
                dp[i][j] = max(dp[i][j], dp[i - 1][j - weight[i]] + value[i]);
        }

    cout << dp[m][t] << endl;
}
