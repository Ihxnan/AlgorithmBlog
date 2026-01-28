// https://www.luogu.com.cn/problem/P2285
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> arr(m);
    for (auto &[time, x, y] : arr)
        cin >> time >> x >> y;
    vi dp(m);
    int ans = 0;
    for (int i = 0; i < m; ++i)
    {
        auto &[ti, xi, yi] = arr[i];
        for (int j = 0; j < i; ++j)
        {
            auto &[tj, xj, yj] = arr[j];
            if (ti - tj >= abs(xi - xj) + abs(yi - yj))
                dp[i] = max(dp[i], dp[j]);
        }
        ans = max(ans, ++dp[i]);
    }
    cout << ans;
}
