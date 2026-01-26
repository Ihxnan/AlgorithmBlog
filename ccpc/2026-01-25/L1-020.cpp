// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805117167976448
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    unordered_set<int> hash;
    for (int i = 0, t, p; i < n; ++i)
    {
        cin >> t;
        if (t == 1)
            cin >> p;
        else
            for (int j = 0; j < t; ++j)
                cin >> p, hash.insert(p);
    }
    cin >> n;
    vi ans;
    for (int i = 0, t; i < n; ++i)
    {
        cin >> t;
        if (!hash.count(t))
            ans.pb(t);
    }
    if (ans.size())
        for (int i = 0; i < ans.size(); ++i)
            cout << setw(5) << setfill('0') << ans[i] << " "[i == ans.size() - 1];
    else
        cout << "No one is handsome";
}
