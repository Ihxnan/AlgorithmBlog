// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805145370476544
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    char ch;
    cin >> n >> ch;

    vs ans;
    ans.pb(string(1, ch));
    --n;

    for (int i = 3; 2 * i <= n; i += 2)
        ans.pb(string(i, ch)), n -= 2 * i;

    for (int i = ans.size() - 1; i; --i)
        cout << string(ans.size() - 1 - i, ' ') << ans[i] << endl;

    for (int i = 0; i < ans.size(); ++i)
        cout << string(ans.size() - 1 - i, ' ') << ans[i] << endl;

    cout << n << endl;
}
