// https://www.luogu.com.cn/problem/P1049
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int V, n;
    cin >> V >> n;
    vi dp(V + 1);
    for (int i = 0, t; i < n; ++i)
    {
        cin >> t;
        for (int j = V; j >= t; --j)
            dp[j] = max(dp[j], dp[j - t] + t);
    }
    cout << V - dp[V];
}
