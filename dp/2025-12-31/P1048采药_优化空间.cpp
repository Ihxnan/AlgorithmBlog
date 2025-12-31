// https://www.luogu.com.cn/problem/P1048
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int t, m, weight, value;
    cin >> t >> m;

    vi dp(t + 1);
    while (cin >> weight >> value)
        for (int j = t; j >= weight; --j)
            dp[j] = max(dp[j], dp[j - weight] + value);

    cout << dp[t] << endl;
}
