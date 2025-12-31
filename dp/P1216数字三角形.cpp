// https://www.luogu.com.cn/problem/P1216
#include "../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;

    vvi dp(n, vi(n)); // dp[i][j] 表示从底部到第i行第j列的数字三角形的最大路径和

    // 读取数字三角形
    for (int i = 0; i < n; ++i)
        for (int j = 0; j <= i; ++j)
            cin >> dp[i][j];

    // 状态转移方程:
    // dp[i][j] = max(dp[i+1][j], dp[i+1][j+1]) + dp[i][j]
    for (int i = n - 2; i >= 0; --i)
        for (int j = 0; j <= i; ++j)
            dp[i][j] += max(dp[i + 1][j], dp[i + 1][j + 1]);

    cout << dp[0][0];
}
