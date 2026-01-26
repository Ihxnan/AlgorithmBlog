// https://www.luogu.com.cn/problem/P2392
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int arr[4];
    for (auto &p : arr)
        cin >> p;
    int ans = 0;

    for (auto &p : arr)
    {
        int sum = 0;
        vi arr(p + 1);
        for (int i = 1; i <= p; ++i)
            cin >> arr[i], sum += arr[i];
        int V = sum / 2;
        vvi dp(p + 1, vi(V + 1));
        for (int i = 1; i <= p; ++i)
        {
            for (int j = 0; j <= V; ++j)
            {
                dp[i][j] = dp[i - 1][j];
                if (j >= arr[i])
                    dp[i][j] = max(dp[i][j], dp[i - 1][j - arr[i]] + arr[i]);
            }
        }
        ans += max(dp[p][V], sum - dp[p][V]);
    }

    cout << ans << endl;
}
