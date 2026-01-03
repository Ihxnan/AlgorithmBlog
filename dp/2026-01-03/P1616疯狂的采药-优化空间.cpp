// https://www.luogu.com.cn/problem/P1616
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int t, m;
    cin >> t >> m;

    vl dp(t + 1);
    for (int i = 0, ti, va; i < m; ++i)
    {
        cin >> ti >> va;
        for (int j = ti; j <= t; ++j)
            dp[j] = max(dp[j], dp[j - ti] + va);
    }
    cout << dp[t];
}
