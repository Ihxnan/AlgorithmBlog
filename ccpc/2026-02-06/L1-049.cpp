// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805081289900032
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    vi arr(n);
    cin >> arr;

    int cnt = 1;
    int sum = accumulate(all(arr), 0);
    vvi ans(n);
    while (cnt <= sum * 10)
        for (int i = 0; i < n; ++i)
            if (ans[i].size() < arr[i] * 10)
                ans[i].pb(cnt++);

    for (int i = 0; i < n; ++i)
    {
        cout << '#' << i + 1 << endl;
        for (int j = 0, k = 0; j < ans[i].size(); ++j, k += ans[i][j] == ans[i][j - 1] + 1)
            cout << ans[i][j] + k << " \n"[j % 10 == 9];
    }
}
