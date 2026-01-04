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

    vi sum(m + 2);
    for (int i = 1, num; i <= n; ++i)
    {
        cin >> num;

        // O(m) 计算前缀和
        for (int j = 0; j <= m; ++j)
            sum[j + 1] = (sum[j] + dp[j]) % mod;

        // O(1) 计算转移
        for (int j = m; j >= 0; --j)
            dp[j] = (sum[j + 1] - sum[max(0, j - num)] + mod) % mod;
    }

    cout << dp[m];
}
