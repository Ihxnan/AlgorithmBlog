// https://www.luogu.com.cn/problem/P2840
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, w;
    cin >> n >> w;
    vi arr(n);
    cin >> arr;
    sort(all(arr));

    vi dp(w + 1); // dp[i] 表示凑够 i 价值的方案数
    dp[0] = 1;    // 凑够 0 价值只有一种方案，就是不选任何纸币

    // 状态转移方程:
    // dp[i] = sum{dp[i - arr[j]]}, 0 <= j < n, (i >= arr[j])
    for (int i = 1; i <= w; ++i)
        for (int j = 0; j < n && i >= arr[j]; ++j)
            dp[i] = (dp[i] + dp[i - arr[j]]) % MOD;
    cout << dp[w];
}
