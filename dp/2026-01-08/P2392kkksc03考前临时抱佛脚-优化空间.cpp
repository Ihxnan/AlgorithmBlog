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
        vi dp(V + 1);
        for (int i = 1; i <= p; ++i)
            for (int j = V; j >= arr[i]; --j)
                dp[j] = max(dp[j], dp[j - arr[i]] + arr[i]);
        ans += max(dp[V], sum - dp[V]);
    }

    cout << ans << endl;
}
