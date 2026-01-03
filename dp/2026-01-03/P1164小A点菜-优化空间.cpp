// https://www.luogu.com.cn/problem/P1164
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, m;
    cin >> n >> m;

    vi dp(m + 1);
    dp[0] = 1;
    for (int i = 1, money; i <= n; ++i)
    {
        cin >> money;
        for (int j = m; j >= money; --j)
            dp[j] += dp[j - money];
    }

    cout << dp[m];
}
