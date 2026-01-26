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

    vi dp(m + 1);
    dp[0] = 1;

    for (int i = 1, num; i <= n; ++i)
    {
        cin >> num;
        for (int j = m; j >= 0; --j)
            for (int k = 1; k <= min(j, num); ++k)
                dp[j] = (dp[j] + dp[j - k]) % mod;
    }

    cout << dp[m];
}
