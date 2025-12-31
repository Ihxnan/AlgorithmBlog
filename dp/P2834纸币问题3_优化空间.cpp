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
    int money;

    vi dp(w + 1); // dp[i][j]: 前i个纸币凑出总价值为j的方案数
    dp[0] = 1; // 0个纸币凑出总价值为0的方案数为1

    // 状态转移方程:
    // dp[i][j] = dp[i - 1][j] + dp[i][j - arr[i]] (arr[i] <= j)
    while (cin >> money)
        for (int j = money; j <= w; ++j)
            dp[j] = (dp[j - money] + dp[j]) % MOD;

    cout << dp[w] << endl;
}
