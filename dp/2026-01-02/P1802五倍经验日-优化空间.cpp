// https://www.luogu.com.cn/problem/P1802
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, x;
    cin >> n >> x;

    vvl dp(n + 1, vl(x + 1)); // dp[i][j] 表示用j瓶药打完第i个人后，获得的最大经验

    // 状态转移方程：
    // dp[i][j] = max{dp[i-1][j] + lose[i], dp[i-1][j - use[i]] + win[i]} (j >= use[i])
    for (int i = 1, lose, win, use; i <= n; ++i)
    {
        cin >> lose >> win >> use;
        for (int j = 0; j <= x; ++j)
        {
            dp[i][j] = dp[i - 1][j] + lose;
            if (j >= use)
                dp[i][j] = max(dp[i][j], dp[i - 1][j - use] + win);
        }
    }
    cout << dp[n][x] * 5;
}
