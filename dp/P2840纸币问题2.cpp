// https://www.luogu.com.cn/problem/P2840
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

    vi dp(w + 1);                                   // dp[i] 表示凑够 i 价值的方案数
    dp[0] = 1;                                      // 凑够 0 价值只有一种方案，就是不选任何纸币
    for (int i = 1; i <= w; ++i)                    // 枚举所有可能的总价值 i
        for (int j = 0; j < n && i >= arr[j]; ++j)  // 考虑最后一张可能的面值
            dp[i] = (dp[i] + dp[i - arr[j]]) % MOD; // 状态转移
    cout << dp[w];
}
