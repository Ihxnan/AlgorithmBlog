// https://www.luogu.com.cn/problem/P2834
#include "../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, w; // n: 硬币数目 w: 总价值
    cin >> n >> w;
    vi arr(n); // 纸币面值数组
    cin >> arr;
    sort(all(arr));

    vvi dp(n + 1, vi(w + 1));
    dp[0][0] = 1;
    for (int i = 1; i <= n; ++i)
        for (int j = 0; j <= w; ++j)
        {
            dp[i][j] = dp[i - 1][j];
            if (j >= arr[i - 1])
                dp[i][j] = (dp[i][j - arr[i - 1]] + dp[i][j]) % MOD;
        }

    cout << dp[n][w] << endl;
}
