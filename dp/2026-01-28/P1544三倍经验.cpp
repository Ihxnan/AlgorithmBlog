// https://www.luogu.com.cn/problem/P1544
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, k;
    cin >> n >> k;
    vector<vvi> dp(n, vvi(n));
    for (int i = 0, t; i < n; ++i)
        for (int j = 0; j <= i; ++j)
            cin >> t, dp[i][j].pb(t);

    auto sum = [&](vi v) -> ll
    {
        ll ans = 0;
        sort(v.rbegin(), v.rend());
        for (int i = 0; i < v.size(); ++i)
            ans += v[i] * (i < k && v[i] > 0 ? 3ll : 1);
        return ans;
    };

    auto Max = [&](vi a, vi b, int x) -> vi
    {
        a.pb(x);
        b.pb(x);
        return sum(a) < sum(b) ? b : a;
    };

    for (int i = n - 2; i >= 0; --i)
        for (int j = 0; j <= i; ++j)
            dp[i][j] = Max(dp[i + 1][j], dp[i + 1][j + 1], dp[i][j][0]);

    cout << sum(dp[0][0]);
}
